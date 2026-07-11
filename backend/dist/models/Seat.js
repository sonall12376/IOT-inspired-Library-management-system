"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seat = void 0;
const mongoose_1 = require("mongoose");
const SeatSchema = new mongoose_1.Schema({
    seatNumber: {
        type: String,
        required: [true, 'Seat number is required'],
        trim: true
    },
    floorId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Device'
    }
}, {
    timestamps: true
});
// Compound unique index so a seat number cannot exist twice on the same floor
SeatSchema.index({ seatNumber: 1, floorId: 1 }, { unique: true });
// Queries targeting map updates
SeatSchema.index({ floorId: 1, status: 1 });
// Ingestion checks
SeatSchema.index({ deviceId: 1 });
exports.Seat = (0, mongoose_1.model)('Seat', SeatSchema);
exports.default = exports.Seat;
