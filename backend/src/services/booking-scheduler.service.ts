import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { logger } from '../config/logger';
import { Server as SocketIOServer } from 'socket.io';

export class BookingSchedulerService {
  private static intervalId: NodeJS.Timeout;

  /**
   * Initialize and start periodic reservation sweeps
   */
  public static initialize(io: SocketIOServer, checkIntervalMs = 60000): void {
    logger.info(`Initializing Booking Scheduler daemon. Sweep interval: ${checkIntervalMs / 1000}s`);

    this.intervalId = setInterval(async () => {
      try {
        const now = new Date();

        // 1. Process 15-minute pending grace window expiry (No-show triggers)
        // A booking is stale if status is 'pending', and current time is past startTime + 15 minutes.
        const graceTime = new Date(now.getTime() - 15 * 60 * 1000);
        const staleBookings = await Booking.find({
          status: 'pending',
          startTime: { $lt: graceTime }
        });

        for (const booking of staleBookings) {
          booking.status = 'no-show';
          await booking.save();

          logger.info(`[Booking Scheduler] Booking ${booking._id} set to no-show (grace window expired).`);

          const seat = await Seat.findById(booking.seatId);
          if (seat && (seat.status === 'reserved' || seat.status === 'occupied')) {
            seat.status = 'vacant';
            await seat.save();

            // Emit live websocket event
            io.emit('seat_updated', {
              seatId: seat._id,
              floorId: seat.floorId,
              status: seat.status,
              seatNumber: seat.seatNumber
            });
          }
        }

        // 2. Process booking end-time auto-completion
        // A booking is completed if status is 'active', and current time is past endTime.
        const completedBookings = await Booking.find({
          status: 'active',
          endTime: { $lt: now }
        });

        for (const booking of completedBookings) {
          booking.status = 'completed';
          booking.checkOutTime = now;
          await booking.save();

          logger.info(`[Booking Scheduler] Booking ${booking._id} auto-completed (endTime reached).`);

          const seat = await Seat.findById(booking.seatId);
          if (seat && (seat.status === 'occupied' || seat.status === 'reserved')) {
            seat.status = 'vacant';
            await seat.save();

            // Emit live websocket event
            io.emit('seat_updated', {
              seatId: seat._id,
              floorId: seat.floorId,
              status: seat.status,
              seatNumber: seat.seatNumber
            });
          }
        }

        // 3. Auto-reserve seats when booking starts immediately
        // Set seat status to 'reserved' when booking starts and is still pending
        const upcomingBookings = await Booking.find({
          status: 'pending',
          startTime: { $lte: now },
          endTime: { $gte: now }
        });

        for (const booking of upcomingBookings) {
          const seat = await Seat.findById(booking.seatId);
          if (seat && seat.status === 'vacant') {
            seat.status = 'reserved';
            await seat.save();

            io.emit('seat_updated', {
              seatId: seat._id,
              floorId: seat.floorId,
              status: seat.status,
              seatNumber: seat.seatNumber
            });
            logger.info(`[Booking Scheduler] Seat ${seat.seatNumber} set to reserved (booking slot started).`);
          }
        }
      } catch (err: any) {
        logger.error('Error in Booking Scheduler sweep process:', err.message);
      }
    }, checkIntervalMs);
  }

  /**
   * Stop booking scheduler sweeper loops (helpful for clean Jest shutdowns)
   */
  public static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
