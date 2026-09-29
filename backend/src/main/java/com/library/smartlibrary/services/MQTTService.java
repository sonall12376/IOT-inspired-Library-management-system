package com.library.smartlibrary.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.smartlibrary.config.WebSocketRoomHandler;
import com.library.smartlibrary.models.*;
import com.library.smartlibrary.repositories.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class MQTTService implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(MQTTService.class);

    @Value("${mqtt.broker.url}")
    private String brokerUrl;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SeatService seatService;

    @Autowired
    private WebSocketRoomHandler webSocketRoomHandler;

    private MqttClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        // Exclude MQTT initialization in test environments to avoid blocking Jest/JUnit setups
        String activeProfile = System.getProperty("spring.profiles.active");
        if ("test".equals(activeProfile)) {
            return;
        }

        try {
            String cleanUrl = brokerUrl;
            if (cleanUrl.startsWith("mqtt://")) {
                cleanUrl = cleanUrl.replace("mqtt://", "tcp://");
            }

            String clientId = "backend_server_" + String.format("%04d", (int)(Math.random() * 10000));
            client = new MqttClient(cleanUrl, clientId, new MemoryPersistence());
            
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(10);
            
            client.setCallback(this);
            client.connect(options);
            log.info("Successfully connected to MQTT Broker: {}", cleanUrl);

            // Subscribe to Seat Status Telemetry
            client.subscribe("library/floors/+/rooms/+/seats/+/status");
            log.info("Subscribed to seat status telemetry topic path.");

            // Subscribe to Device Heartbeat
            client.subscribe("library/devices/+/heartbeat");
            log.info("Subscribed to device heartbeats topic path.");

        } catch (MqttException e) {
            log.error("Failed to initialize MQTT connection: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        if (client != null && client.isConnected()) {
            try {
                client.disconnect();
            } catch (MqttException e) {
                // Ignore
            }
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("MQTT connection lost: {}", cause != null ? cause.getMessage() : "Unknown reason");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        try {
            String payloadStr = new String(message.getPayload());
            Map<String, Object> payload = objectMapper.readValue(
                payloadStr, 
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
            );

            if (topic.endsWith("/status")) {
                handleStatusUpdate(topic, payload);
            } else if (topic.endsWith("/heartbeat")) {
                handleHeartbeat(topic, payload);
            }
        } catch (Exception e) {
            log.error("Error processing MQTT message on topic {}: {}", topic, e.getMessage());
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // No-op for subscriber
    }

    private void handleStatusUpdate(String topic, Map<String, Object> payload) {
        String[] parts = topic.split("/");
        // library/floors/:floorNum/rooms/:roomName/seats/:seatNumber/status
        int floorNum = Integer.parseInt(parts[2]);
        String seatNumber = parts[6];
        boolean occupied = (Boolean) payload.get("occupied");

        log.debug("[MQTT Ingestion] Status telemetry received for {} (occupied: {})", seatNumber, occupied);

        // Resolve Seat Node
        Optional<Floor> floorOpt = floorRepository.findByFloorNumber(floorNum);
        if (floorOpt.isEmpty()) {
            return;
        }

        Optional<Seat> seatOpt = seatRepository.findBySeatNumberAndFloorId(seatNumber, floorOpt.get().getId());
        if (seatOpt.isEmpty()) {
            return;
        }

        Seat seat = seatOpt.get();

        // Ignore if locked under maintenance
        if ("maintenance".equals(seat.getStatus())) {
            log.debug("[MQTT Ingestion] Ignoring state update: Seat {} is marked for maintenance.", seat.getSeatNumber());
            return;
        }

        Date now = new Date();
        String targetStatus = occupied ? "occupied" : "vacant";

        if (occupied) {
            // Check if there is an active booking that is currently pending check-in
            List<Booking> pendingBookings = bookingRepository.findBySeatIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                    seat.getId(), "pending", now, now
            );

            if (!pendingBookings.isEmpty()) {
                Booking pending = pendingBookings.get(0);
                pending.setStatus("active");
                pending.setCheckInTime(now);
                bookingRepository.save(pending);
                log.info("[MQTT Ingestion] Auto checked-in booking {} for seat {} due to presence detection.", pending.getId(), seat.getSeatNumber());
            }

            // Check if user returned from temporary absence for active booking
            List<Booking> activeBookings = bookingRepository.findBySeatIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                    seat.getId(), "active", now, now
            );

            if (!activeBookings.isEmpty()) {
                Booking active = activeBookings.get(0);
                if (active.getAbsenceStartedAt() != null) {
                    active.setAbsenceStartedAt(null);
                    active.setAbsenceWarningSent(false);
                    bookingRepository.save(active);
                    log.info("[MQTT Ingestion] User returned to seat {} for booking {}. Cleared absence timers.", seat.getSeatNumber(), active.getId());
                }
            }

        } else {
            // Check if there is an active booking for this seat (temporary departure)
            List<Booking> activeBookings = bookingRepository.findBySeatIdAndStatusAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
                    seat.getId(), "active", now, now
            );

            if (!activeBookings.isEmpty()) {
                Booking active = activeBookings.get(0);
                targetStatus = "reserved"; // remains reserved rather than resetting to vacant
                if (active.getAbsenceStartedAt() == null) {
                    active.setAbsenceStartedAt(now);
                    active.setAbsenceWarningSent(false);
                    bookingRepository.save(active);
                    log.info("[MQTT Ingestion] Temporary absence detected for booking {} on seat {}. Started timers.", active.getId(), seat.getSeatNumber());
                }
            }
        }

        if (seat.getStatus().equals(targetStatus)) {
            return;
        }

        seat.setStatus(targetStatus);
        seatRepository.save(seat);

        // Broadcast status update
        seatService.broadcastSeatUpdate(seat);
    }

    private void handleHeartbeat(String topic, Map<String, Object> payload) {
        String[] parts = topic.split("/");
        // library/devices/:macAddress/heartbeat
        String mac = parts[2].toUpperCase();

        log.debug("[MQTT Ingestion] Heartbeat telemetry received for MAC: {}", mac);

        Optional<Device> deviceOpt = deviceRepository.findByMacAddress(mac);
        Device device;

        if (deviceOpt.isPresent()) {
            device = deviceOpt.get();
        } else {
            // Discover & Auto-Register new device node
            device = new Device();
            device.setMacAddress(mac);
            device.setDeviceName("Auto-Discovered Sensor (" + mac.substring(Math.max(0, mac.length() - 5)) + ")");
            log.info("[MQTT Ingestion] Auto-registered newly discovered device node with MAC: {}", mac);
        }

        device.setStatus("online");
        device.setLastHeartbeat(new Date());

        if (payload.get("rssi") != null) {
            device.setRssi(((Number) payload.get("rssi")).intValue());
        }
        if (payload.get("batteryPercentage") != null) {
            device.setBatteryPercentage(((Number) payload.get("batteryPercentage")).intValue());
        }
        if (payload.get("firmwareVersion") != null) {
            device.setFirmwareVersion((String) payload.get("firmwareVersion"));
        }

        deviceRepository.save(device);

        // Emit SocketIO/WebSocket update event
        webSocketRoomHandler.broadcast("device_updated", device);
    }
}
