import { Request, Response, NextFunction } from 'express';
import { SeatService } from '../services/seat.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../config/logger';

export class SeatController {
  /**
   * Get all seats (Librarian/Admin only)
   */
  public static async getSeats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seats = await SeatService.getAllSeats();
      res.status(200).json({ success: true, seats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all seats for a specific floor (Student/Librarian/Admin)
   */
  public static async getSeatsByFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floorId = req.params.floorId as string;
      const seats = await SeatService.getSeatsByFloor(floorId);
      res.status(200).json({ success: true, seats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get seat by ID
   */
  public static async getSeatById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatId = req.params.id as string;
      const seat = await SeatService.getSeatById(seatId);
      res.status(200).json({ success: true, seat });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new seat (Admin only)
   */
  public static async createSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Creating seat ${req.body.seatNumber} on floor ${req.body.floorId}`);
      const seat = await SeatService.createSeat(req.body);
      res.status(201).json({ success: true, seat });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update seat parameters (Admin only)
   */
  public static async updateSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatId = req.params.id as string;
      logger.info(`Updating seat ID: ${seatId}`);
      const seat = await SeatService.updateSeat(seatId, req.body);

      // Emit live updates to connected websockets
      const io = req.app.get('io');
      if (io) {
        io.emit('seat_updated', {
          seatId: seat._id,
          floorId: seat.floorId,
          status: seat.status,
          seatNumber: seat.seatNumber
        });
      }

      res.status(200).json({ success: true, seat });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Override a seat's status (Librarian/Admin only)
   */
  public static async overrideSeat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatId = req.params.id as string;
      const { status, reason } = req.body;
      const userId = req.user?.id as string;
      const ipAddress = req.ip;

      logger.info(`Status override triggered by ${userId} for seat ${seatId} -> ${status}`);
      const seat = await SeatService.overrideSeatStatus(seatId, status, reason, userId, ipAddress);

      // Emit live updates to connected websockets
      const io = req.app.get('io');
      if (io) {
        io.emit('seat_updated', {
          seatId: seat._id,
          floorId: seat.floorId,
          status: seat.status,
          seatNumber: seat.seatNumber
        });
      }

      res.status(200).json({ success: true, seat });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a seat (Admin only)
   */
  public static async deleteSeat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatId = req.params.id as string;
      logger.info(`Deleting seat ID: ${seatId}`);
      await SeatService.deleteSeat(seatId);
      res.status(200).json({ success: true, message: 'Seat deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
