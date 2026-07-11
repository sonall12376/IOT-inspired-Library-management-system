import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'librarian' | 'admin';
  dailyBookingCount: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IFloor extends Document {
  floorNumber: number;
  name: string;
  gridDimensions: {
    rows: number;
    columns: number;
  };
  svgLayoutPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISeat extends Document {
  seatNumber: string;
  floorId: Types.ObjectId;
  roomName: string;
  seatType: 'desk' | 'pc' | 'collaborative';
  hasPowerOutlet: boolean;
  isNearWindow: boolean;
  coordinates: {
    x: number;
    y: number;
  };
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'offline';
  deviceId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  studentId: Types.ObjectId;
  seatId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'no-show';
  checkInTime?: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDevice extends Document {
  macAddress: string;
  deviceName: string;
  status: 'online' | 'offline' | 'maintenance';
  rssi: number;
  batteryPercentage?: number;
  firmwareVersion: string;
  lastHeartbeat: Date;
}

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: Date;
}
