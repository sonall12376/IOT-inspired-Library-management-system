import { Schema, model } from 'mongoose';
import { IAuditLog } from '../interfaces/models.interface';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true
    },
    details: {
      type: String,
      required: [true, 'Log details are required'],
      trim: true
    },
    ipAddress: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
