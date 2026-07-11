"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
});
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
exports.default = exports.AuditLog;
