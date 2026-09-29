package com.library.smartlibrary.services;

import com.library.smartlibrary.config.WebSocketRoomHandler;
import com.library.smartlibrary.models.*;
import com.library.smartlibrary.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;

@Component
public class WatchdogService {

    private static final Logger log = LoggerFactory.getLogger(WatchdogService.class);

    @Value("${watchdog.offline-threshold-ms:180000}")
    private long offlineThresholdMs;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SeatService seatService;

    @Autowired
    private WebSocketRoomHandler webSocketRoomHandler;

    // Background sweep runs every 30 seconds (or customized interval in tests)
    @Scheduled(fixedRateString = "${watchdog.sweep-rate-ms:30000}")
    public void sweep() {
        // Exclude scheduler execution in test profile unless triggered manually
        String activeProfile = System.getProperty("spring.profiles.active");
        if ("test".equals(activeProfile) && offlineThresholdMs > 1000) {
            return;
        }

        try {
            Date thresholdDate = new Date(System.currentTimeMillis() - offlineThresholdMs);

            // Find devices that were online but haven't updated heartbeats
            List<Device> staleDevices = deviceRepository.findByStatusAndLastHeartbeatBefore("online", thresholdDate);

            if (staleDevices.isEmpty()) {
                return;
            }

            log.warn("Watchdog detected {} stale devices. Setting offline.", staleDevices.size());

            // Fetch admins and librarians to trigger database warnings
            List<User> staffUsers = userRepository.findAll().stream()
                    .filter(u -> "admin".equals(u.getRole()) || "librarian".equals(u.getRole()))
                    .toList();

            for (Device device : staleDevices) {
                device.setStatus("offline");
                deviceRepository.save(device);

                // Broadcast socket update
                webSocketRoomHandler.broadcast("device_updated", device);

                // Trigger alerts
                for (User staff : staffUsers) {
                    notificationService.sendNotification(
                            staff.getId(),
                            "Device Stale Offline Warning",
                            "IoT Device \"" + device.getDeviceName() + "\" (" + device.getMacAddress() + ") has dropped offline. Please inspect connectivity.",
                            "warning"
                    );
                }

                // Find seats bound to this device and mark them offline as well
                List<Seat> seats = seatRepository.findByDeviceId(device.getId());
                for (Seat seat : seats) {
                    if (!"offline".equals(seat.getStatus())) {
                        seat.setStatus("offline");
                        seatRepository.save(seat);

                        // Broadcast seat status update
                        seatService.broadcastSeatUpdate(seat);
                        log.warn("Watchdog marked seat {} offline because device {} went offline.", seat.getSeatNumber(), device.getMacAddress());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in Device Watchdog sweep process: {}", e.getMessage());
        }
    }
}
