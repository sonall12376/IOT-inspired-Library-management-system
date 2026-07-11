"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID reference is required']
    },
    seatId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true
});
// Index to prevent overlapping bookings on the same seat
BookingSchema.index({ seatId: 1, startTime: 1, endTime: 1 });
// Index to fetch user's booking history
BookingSchema.index({ studentId: 1, status: 1 });
exports.Booking = (0, mongoose_1.model)('Booking', BookingSchema);
exports.default = exports.Booking;
