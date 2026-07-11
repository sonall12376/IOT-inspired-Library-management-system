import mqtt, { MqttClient } from 'mqtt';
import { Seat } from '../models/Seat';
import { Device } from '../models/Device';
import { Floor } from '../models/Floor';
import { Booking } from '../models/Booking';
import { logger } from '../config/logger';
import { Server as SocketIOServer } from 'socket.io';

export class MQTTService {
  private static client: MqttClient;

  /**
   * Initialize MQTT client connection and register topic subscriptions
   */
  public static initialize(io: SocketIOServer): void {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    logger.info(`Initializing MQTT Ingestion Service. Connecting to broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: `backend_server_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000
    });

    this.client.on('connect', () => {
      logger.info('Successfully connected to MQTT Broker.');
      
      // Subscribe to Seat Status Telemetry
      // Topic structure: library/floors/:floorNumber/rooms/:roomName/seats/:seatNumber/status
      this.client.subscribe('library/floors/+/rooms/+/seats/+/status', (err) => {
        if (err) logger.error('Failed to subscribe to seat status updates topic:', err);
        else logger.info('Subscribed to seat status telemetry topic path.');
      });

      // Subscribe to Device Heartbeat
      // Topic structure: library/devices/:macAddress/heartbeat
      this.client.subscribe('library/devices/+/heartbeat', (err) => {
        if (err) logger.error('Failed to subscribe to heartbeats topic:', err);
        else logger.info('Subscribed to device heartbeats topic path.');
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payloadStr = message.toString();
        const payload = JSON.parse(payloadStr);

        if (topic.endsWith('/status')) {
          await this.handleStatusUpdate(topic, payload, io);
        } else if (topic.endsWith('/heartbeat')) {
          await this.handleHeartbeat(topic, payload, io);
        }
      } catch (err: any) {
        logger.error(`Error processing MQTT message on topic ${topic}:`, err.message);
      }
    });

    this.client.on('error', (err) => {
      logger.error('MQTT Client encountered connection error:', err);
    });
  }

  /**
   * Process seat occupancy change telemetry messages
   */
  private static async handleStatusUpdate(topic: string, payload: any, io: SocketIOServer): Promise<void> {
    const parts = topic.split('/');
    // library/floors/:floor/rooms/:room/seats/:seatNumber/status
    const floorNum = parseInt(parts[2]);
    const seatNumber = parts[6];
    const { occupied } = payload;

    logger.debug(`[MQTT Ingestion] Status telemetry received for ${seatNumber} (occupied: ${occupied})`);

    // 1. Resolve Seat node
    let seat = await Seat.findOne({ seatNumber }).populate('floorId');
    if (!seat && floorNum) {
      // Find floor by level number
      const floor = await Floor.findOne({ floorNumber: floorNum });
      if (floor) {
        seat = await Seat.findOne({ seatNumber, floorId: floor._id });
      }
    }

    if (!seat) {
      logger.warn(`[MQTT Ingestion] Mapped seat node not found for number ${seatNumber} in level ${floorNum}`);
      return;
    }

    // 2. Ignore status changes if seat is in maintenance
    if (seat.status === 'maintenance') {
      logger.debug(`[MQTT Ingestion] Ignoring state update: Seat ${seat.seatNumber} is marked for maintenance.`);
      return;
    }

    const now = new Date();
    let targetStatus: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline' = occupied ? 'occupied' : 'vacant';

    if (occupied) {
      // presence detected: check if there's an active booking that is currently pending check-in
      const pendingBooking = await Booking.findOne({
        seatId: seat._id,
        status: 'pending',
        startTime: { $lte: now },
        endTime: { $gte: now }
      });

      if (pendingBooking) {
        pendingBooking.status = 'active';
        pendingBooking.checkInTime = now;
        await pendingBooking.save();
        logger.info(`[MQTT Ingestion] Auto checked-in booking ${pendingBooking._id} for seat ${seat.seatNumber} due to presence detection.`);
      }
    } else {
      // absence detected: check if there is an active booking for this seat
      const activeBooking = await Booking.findOne({
        seatId: seat._id,
        status: 'active',
        startTime: { $lte: now },
        endTime: { $gte: now }
      });

      if (activeBooking) {
        // Seat is booked but user is temporarily away -> status remains 'reserved' rather than resetting to vacant
        targetStatus = 'reserved';
      }
    }
    
    // Prevent redundant database writes and Socket.IO updates
    if (seat.status === targetStatus) {
      return;
    }

    seat.status = targetStatus;
    await seat.save();

    // Emit live WebSocket update to all clients
    io.emit('seat_updated', {
      seatId: seat._id,
      floorId: seat.floorId._id,
      status: seat.status,
      seatNumber: seat.seatNumber
    });

    logger.info(`[MQTT Ingestion] Seat ${seat.seatNumber} state updated to: ${seat.status}`);
  }

  /**
   * Process device heartbeat signals (performs automatic discovery and upsert)
   */
  private static async handleHeartbeat(topic: string, payload: any, io: SocketIOServer): Promise<void> {
    const parts = topic.split('/');
    // library/devices/:macAddress/heartbeat
    const macAddress = parts[2];
    const { status, rssi, batteryPercentage, firmwareVersion } = payload;

    logger.debug(`[MQTT Ingestion] Heartbeat telemetry received for MAC: ${macAddress}`);

    // Automatically discovery/register or update device details
    const updatedDevice = await Device.findOneAndUpdate(
      { macAddress },
      {
        macAddress,
        deviceName: `Sensor ${macAddress.slice(-5)}`,
        status: status || 'online',
        rssi: rssi || 0,
        batteryPercentage: batteryPercentage !== undefined ? batteryPercentage : undefined,
        firmwareVersion: firmwareVersion || '1.0.0',
        lastHeartbeat: new Date()
      },
      { upsert: true, new: true }
    );

    // Emit live WebSocket update for device health dashboard
    io.emit('device_updated', updatedDevice);
  }
}
