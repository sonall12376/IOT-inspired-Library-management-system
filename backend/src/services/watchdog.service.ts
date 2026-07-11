import { Device } from '../models/Device';
import { Seat } from '../models/Seat';
import { logger } from '../config/logger';
import { Server as SocketIOServer } from 'socket.io';

export class WatchdogService {
  private static intervalId: NodeJS.Timeout;

  /**
   * Start periodic sweeps checking for offline/stale devices
   */
  public static initialize(io: SocketIOServer, checkIntervalMs = 30000, offlineThresholdMs = 120000): void {
    logger.info(`Initializing Device Watchdog Service. Sweep interval: ${checkIntervalMs / 1000}s`);

    this.intervalId = setInterval(async () => {
      try {
        const thresholdDate = new Date(Date.now() - offlineThresholdMs);
        
        // Find devices that were online but haven't reported heartbeats within threshold
        const staleDevices = await Device.find({
          status: 'online',
          lastHeartbeat: { $lt: thresholdDate }
        });

        if (staleDevices.length === 0) {
          return;
        }

        logger.warn(`Watchdog detected ${staleDevices.length} stale devices. Setting offline.`);

        for (const device of staleDevices) {
          device.status = 'offline';
          await device.save();

          // Emit WebSocket device update
          io.emit('device_updated', device);

          // Find seats bound to this device and mark them offline as well
          const seats = await Seat.find({ deviceId: device._id });
          for (const seat of seats) {
            if (seat.status !== 'offline') {
              seat.status = 'offline';
              await seat.save();

              // Emit WebSocket seat update
              io.emit('seat_updated', {
                seatId: seat._id,
                floorId: seat.floorId,
                status: seat.status,
                seatNumber: seat.seatNumber
              });
              logger.warn(`Watchdog marked seat ${seat.seatNumber} offline because device ${device.macAddress} went offline.`);
            }
          }
        }
      } catch (err: any) {
        logger.error('Error in Device Watchdog sweep process:', err.message);
      }
    }, checkIntervalMs);
  }

  /**
   * Stop watchdog interval sweep (useful for testing teardowns)
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
