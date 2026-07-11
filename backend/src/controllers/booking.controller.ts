import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../config/logger';

export class BookingController {
  /**
   * Get list of bookings
   */
  public static async getBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      
      const bookings = await BookingService.getBookings(userId, role);
      res.status(200).json({ success: true, bookings });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single booking details
   */
  public static async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      const bookingId = req.params.id as string;

      const booking = await BookingService.getBookingById(bookingId, userId, role);
      res.status(200).json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new reservation
   */
  public static async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      const { seatId, startTime, endTime, targetStudentEmail } = req.body;

      logger.info(`User ${userId} reserving seat ${seatId} (${startTime} to ${endTime})`);
      const booking = await BookingService.createBooking(
        { seatId, startTime, endTime },
        userId,
        role,
        targetStudentEmail
      );

      // Emit live updates to Socket.io clients
      const io = req.app.get('io');
      if (io) {
        const seat = await mongoose.model('Seat').findById(seatId);
        if (seat) {
          io.emit('seat_updated', {
            seatId: seat._id,
            floorId: seat.floorId,
            status: seat.status,
            seatNumber: seat.seatNumber
          });
        }
      }

      res.status(201).json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an existing booking
   */
  public static async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      const bookingId = req.params.id as string;

      logger.info(`User ${userId} requested cancellation of booking ${bookingId}`);
      const booking = await BookingService.cancelBooking(bookingId, userId, role);

      // Emit live updates to Socket.io clients
      const io = req.app.get('io');
      if (io) {
        const seat = await mongoose.model('Seat').findById(booking.seatId);
        if (seat) {
          io.emit('seat_updated', {
            seatId: seat._id,
            floorId: seat.floorId,
            status: seat.status,
            seatNumber: seat.seatNumber
          });
        }
      }

      res.status(200).json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Check-in
   */
  public static async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      const bookingId = req.params.id as string;

      logger.info(`User ${userId} manual check-in for booking ${bookingId}`);
      const booking = await BookingService.checkIn(bookingId, userId, role);

      // Emit live updates to Socket.io clients
      const io = req.app.get('io');
      if (io) {
        const seat = await mongoose.model('Seat').findById(booking.seatId);
        if (seat) {
          io.emit('seat_updated', {
            seatId: seat._id,
            floorId: seat.floorId,
            status: seat.status,
            seatNumber: seat.seatNumber
          });
        }
      }

      res.status(200).json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Check-out
   */
  public static async checkOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.role as string;
      const bookingId = req.params.id as string;

      logger.info(`User ${userId} manual check-out for booking ${bookingId}`);
      const booking = await BookingService.checkOut(bookingId, userId, role);

      // Emit live updates to Socket.io clients
      const io = req.app.get('io');
      if (io) {
        const seat = await mongoose.model('Seat').findById(booking.seatId);
        if (seat) {
          io.emit('seat_updated', {
            seatId: seat._id,
            floorId: seat.floorId,
            status: seat.status,
            seatNumber: seat.seatNumber
          });
        }
      }

      res.status(200).json({ success: true, booking });
    } catch (error) {
      next(error);
    }
  }
}
