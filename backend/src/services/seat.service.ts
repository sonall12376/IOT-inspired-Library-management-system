import { Seat } from '../models/Seat';
import { Floor } from '../models/Floor';
import { AuditLog } from '../models/AuditLog';
import { ISeat } from '../interfaces/models.interface';
import { AppError } from '../middlewares/error';
import { Types } from 'mongoose';

export class SeatService {
  /**
   * Get all seats with populated floor reference
   */
  public static async getAllSeats(): Promise<ISeat[]> {
    return Seat.find().populate('floorId', 'floorNumber name');
  }

  /**
   * Get seats belonging to a specific Floor
   */
  public static async getSeatsByFloor(floorId: string): Promise<ISeat[]> {
    const floorExists = await Floor.findById(floorId);
    if (!floorExists) {
      throw new AppError('Floor reference not found', 404);
    }
    return Seat.find({ floorId }).sort({ seatNumber: 1 });
  }

  /**
   * Get single seat details by ID
   */
  public static async getSeatById(id: string): Promise<ISeat> {
    const seat = await Seat.findById(id).populate('floorId', 'floorNumber name');
    if (!seat) {
      throw new AppError('Seat not found', 404);
    }
    return seat;
  }

  /**
   * Create a new seat node (Admin only)
   */
  public static async createSeat(payload: Partial<ISeat>): Promise<ISeat> {
    const { seatNumber, floorId } = payload;
    
    // Verify referenced floor exists
    const floor = await Floor.findById(floorId);
    if (!floor) {
      throw new AppError('Floor reference not found', 404);
    }

    // Verify duplicate seat numbering on the same level
    const existing = await Seat.findOne({ seatNumber, floorId });
    if (existing) {
      throw new AppError(`Seat number ${seatNumber} already exists on floor ${floor.floorNumber}`, 400);
    }

    const newSeat = new Seat(payload);
    await newSeat.save();
    return newSeat;
  }

  /**
   * Update seat configuration details (Admin only)
   */
  public static async updateSeat(id: string, payload: Partial<ISeat>): Promise<ISeat> {
    const { seatNumber, floorId } = payload;
    const seat = await Seat.findById(id);
    if (!seat) {
      throw new AppError('Seat not found', 404);
    }

    const targetFloorId = floorId || seat.floorId;
    const targetSeatNumber = seatNumber || seat.seatNumber;

    if (seatNumber !== undefined || floorId !== undefined) {
      const existing = await Seat.findOne({
        seatNumber: targetSeatNumber,
        floorId: targetFloorId,
        _id: { $ne: id }
      });
      if (existing) {
        throw new AppError(`Seat number ${targetSeatNumber} already exists on floor ${targetFloorId}`, 400);
      }
    }

    const updatedSeat = await Seat.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updatedSeat) {
      throw new AppError('Seat not found', 404);
    }
    return updatedSeat;
  }

  /**
   * Override a seat's physical occupancy status (Librarian/Admin only)
   * This generates a tracking entry in the Audit Log collection.
   */
  public static async overrideSeatStatus(
    id: string,
    status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline',
    reason: string | undefined,
    userId: string,
    ipAddress?: string
  ): Promise<ISeat> {
    const seat = await Seat.findById(id);
    if (!seat) {
      throw new AppError('Seat not found', 404);
    }

    const oldStatus = seat.status;
    seat.status = status;
    await seat.save();

    // Create Audit Log record
    await AuditLog.create({
      userId: new Types.ObjectId(userId),
      action: 'SEAT_OVERRIDE',
      details: `Overrode seat ${seat.seatNumber} status from ${oldStatus} to ${status}. Reason: ${reason || 'N/A'}`,
      ipAddress,
      timestamp: new Date()
    });

    return seat;
  }

  /**
   * Delete a seat node (Admin only)
   */
  public static async deleteSeat(id: string): Promise<void> {
    const seat = await Seat.findByIdAndDelete(id);
    if (!seat) {
      throw new AppError('Seat not found', 404);
    }
  }
}
