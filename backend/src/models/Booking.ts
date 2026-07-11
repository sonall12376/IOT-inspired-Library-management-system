import { Schema, model } from 'mongoose';
import { IBooking } from '../interfaces/models.interface';

const BookingSchema = new Schema<IBooking>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required']
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: [true, 'Seat ID reference is required']
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled', 'no-show'],
      default: 'pending'
    },
    checkInTime: {
      type: Date
    },
    checkOutTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index to prevent overlapping bookings on the same seat
BookingSchema.index({ seatId: 1, startTime: 1, endTime: 1 });
// Index to fetch user's booking history
BookingSchema.index({ studentId: 1, status: 1 });

export const Booking = model<IBooking>('Booking', BookingSchema);
export default Booking;
