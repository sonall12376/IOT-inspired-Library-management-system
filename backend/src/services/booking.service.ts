import { Booking } from '../models/Booking';
import { Seat } from '../models/Seat';
import { User } from '../models/User';
import { IBooking } from '../interfaces/models.interface';
import { AppError } from '../middlewares/error';
import { Types } from 'mongoose';

export class BookingService {
  /**
   * Get all bookings (Librarian/Admin only) or a student's personal bookings
   */
  public static async getBookings(userId: string, role: string): Promise<IBooking[]> {
    if (role === 'admin' || role === 'librarian') {
      return Booking.find()
        .populate('studentId', 'name email')
        .populate({
          path: 'seatId',
          populate: { path: 'floorId', select: 'floorNumber name' }
        })
        .sort({ startTime: -1 });
    } else {
      return Booking.find({ studentId: userId })
        .populate({
          path: 'seatId',
          populate: { path: 'floorId', select: 'floorNumber name' }
        })
        .sort({ startTime: -1 });
    }
  }

  /**
   * Get booking details by ID
   */
  public static async getBookingById(id: string, userId: string, role: string): Promise<IBooking> {
    const booking = await Booking.findById(id)
      .populate('studentId', 'name email')
      .populate({
        path: 'seatId',
        populate: { path: 'floorId', select: 'floorNumber name' }
      });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Role checks: Students can only view their own bookings
    if (role === 'student' && booking.studentId._id.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    return booking;
  }

  /**
   * Create a new seat reservation
   */
  public static async createBooking(
    payload: { seatId: string; startTime: string; endTime: string },
    userId: string,
    role: string,
    targetStudentEmail?: string // Librarians/Admins can reserve for another student
  ): Promise<IBooking> {
    const start = new Date(payload.startTime);
    const end = new Date(payload.endTime);

    if (start >= end) {
      throw new AppError('End time must be after start time', 400);
    }

    if (start < new Date(Date.now() - 5 * 60 * 1000)) {
      throw new AppError('Start time cannot be in the past', 400);
    }

    // Determine target student ID
    let studentId = userId;
    if ((role === 'admin' || role === 'librarian') && targetStudentEmail) {
      const student = await User.findOne({ email: targetStudentEmail });
      if (!student) {
        throw new AppError(`Student with email ${targetStudentEmail} not found`, 404);
      }
      studentId = student._id.toString();
    }

    // 1. Quota Check (Students are limited to 2 active/pending bookings per day)
    const targetUser = await User.findById(studentId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    if (targetUser.role === 'student') {
      const startOfDay = new Date(start);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(start);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const activeBookingsCount = await Booking.countDocuments({
        studentId,
        status: { $in: ['pending', 'active'] },
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });

      if (activeBookingsCount >= 2) {
        throw new AppError('Daily reservation quota exceeded (maximum 2 active bookings per day)', 400);
      }
    }

    // 2. Validate seat availability
    const seat = await Seat.findById(payload.seatId);
    if (!seat) {
      throw new AppError('Seat not found', 404);
    }

    if (seat.status === 'maintenance') {
      throw new AppError('Seat is currently under maintenance and cannot be reserved', 400);
    }

    if (seat.status === 'offline') {
      throw new AppError('Seat is offline and cannot be reserved', 400);
    }

    // 3. Overlap Collision Check
    const overlappingBooking = await Booking.findOne({
      seatId: payload.seatId,
      status: { $in: ['pending', 'active'] },
      startTime: { $lte: end },
      endTime: { $gte: start }
    });

    if (overlappingBooking) {
      throw new AppError('This seat is already reserved for the requested time slot', 400);
    }

    // 4. Save reservation
    const booking = new Booking({
      studentId: new Types.ObjectId(studentId),
      seatId: new Types.ObjectId(payload.seatId),
      startTime: start,
      endTime: end,
      status: 'pending'
    });
    await booking.save();

    // Update seat status to 'reserved' if the booking starts immediately or is the next active booking
    const now = new Date();
    if (start <= now && end >= now) {
      seat.status = 'reserved';
      await seat.save();
    }

    return booking;
  }

  /**
   * Cancel an existing booking
   */
  public static async cancelBooking(id: string, userId: string, role: string): Promise<IBooking> {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Auth validation
    if (role === 'student' && booking.studentId.toString() !== userId) {
      throw new AppError('Access denied. You cannot cancel someone else\'s booking.', 403);
    }

    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no-show') {
      throw new AppError(`Cannot cancel a booking that is already ${booking.status}`, 400);
    }

    booking.status = 'cancelled';
    booking.checkOutTime = new Date();
    await booking.save();

    // Release seat
    const seat = await Seat.findById(booking.seatId);
    if (seat && (seat.status === 'reserved' || seat.status === 'occupied')) {
      seat.status = 'vacant';
      await seat.save();
    }

    return booking;
  }

  /**
   * Manual Check-in
   */
  public static async checkIn(id: string, userId: string, role: string): Promise<IBooking> {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (role === 'student' && booking.studentId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (booking.status !== 'pending') {
      throw new AppError(`Cannot check-in booking with status ${booking.status}`, 400);
    }

    const now = new Date();
    // Validate window check-in limits: check-in is allowed up to 15m before and after startTime
    const checkInStart = new Date(booking.startTime.getTime() - 15 * 60 * 1000);
    const checkInEnd = new Date(booking.startTime.getTime() + 15 * 60 * 1000);

    if (now < checkInStart) {
      throw new AppError('Check-in window has not started yet', 400);
    }

    if (now > checkInEnd) {
      throw new AppError('Check-in window has expired', 400);
    }

    booking.status = 'active';
    booking.checkInTime = now;
    await booking.save();

    const seat = await Seat.findById(booking.seatId);
    if (seat && seat.status !== 'maintenance' && seat.status !== 'offline') {
      seat.status = 'occupied';
      await seat.save();
    }

    return booking;
  }

  /**
   * Manual Check-out / early release
   */
  public static async checkOut(id: string, userId: string, role: string): Promise<IBooking> {
    const booking = await Booking.findById(id);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (role === 'student' && booking.studentId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    if (booking.status !== 'active') {
      throw new AppError(`Cannot check-out booking with status ${booking.status}`, 400);
    }

    booking.status = 'completed';
    booking.checkOutTime = new Date();
    await booking.save();

    const seat = await Seat.findById(booking.seatId);
    if (seat && seat.status !== 'maintenance' && seat.status !== 'offline') {
      seat.status = 'vacant';
      await seat.save();
    }

    return booking;
  }
}
