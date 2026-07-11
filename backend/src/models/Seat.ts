import { Schema, model } from 'mongoose';
import { ISeat } from '../interfaces/models.interface';

const SeatSchema = new Schema<ISeat>(
  {
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor reference is required']
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true
    },
    seatType: {
      type: String,
      enum: ['desk', 'pc', 'collaborative'],
      default: 'desk'
    },
    hasPowerOutlet: {
      type: Boolean,
      default: false
    },
    isNearWindow: {
      type: Boolean,
      default: false
    },
    coordinates: {
      x: {
        type: Number,
        required: [true, 'X coordinate coordinate is required']
      },
      y: {
        type: Number,
        required: [true, 'Y coordinate coordinate is required']
      }
    },
    status: {
      type: String,
      enum: ['vacant', 'occupied', 'reserved', 'maintenance', 'offline'],
      default: 'vacant'
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index so a seat number cannot exist twice on the same floor
SeatSchema.index({ seatNumber: 1, floorId: 1 }, { unique: true });
// Queries targeting map updates
SeatSchema.index({ floorId: 1, status: 1 });
// Ingestion checks
SeatSchema.index({ deviceId: 1 });

export const Seat = model<ISeat>('Seat', SeatSchema);
export default Seat;
