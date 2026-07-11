"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
const mongoose_1 = require("mongoose");
const DeviceSchema = new mongoose_1.Schema({
    macAddress: {
        type: String,
        required: [true, 'MAC address is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Please use a valid MAC address (e.g. 24:0A:C4:8B:58:FC)']
    },
    deviceName: {
        type: String,
        required: [true, 'Device name is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'maintenance'],
        default: 'offline'
    },
    rssi: {
        type: Number,
        default: 0
    },
    batteryPercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    firmwareVersion: {
        type: String,
        default: '1.0.0'
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
exports.Device = (0, mongoose_1.model)('Device', DeviceSchema);
exports.default = exports.Device;
