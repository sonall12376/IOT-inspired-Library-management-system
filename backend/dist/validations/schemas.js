"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeviceSchema = exports.updateSeatOverrideSchema = exports.createBookingSchema = exports.createSeatSchema = exports.createFloorSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ message: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string({ message: 'Email is required' }).email('Invalid email address'),
        password: zod_1.z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters')
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ message: 'Email is required' }).email('Invalid email address'),
        password: zod_1.z.string({ message: 'Password is required' }).min(1, 'Password is required')
    })
});
exports.createFloorSchema = zod_1.z.object({
    body: zod_1.z.object({
        floorNumber: zod_1.z.number({ message: 'Floor number is required' }).int(),
        name: zod_1.z.string({ message: 'Floor name is required' }).min(1, 'Floor name cannot be empty'),
        gridDimensions: zod_1.z.object({
            rows: zod_1.z.number({ message: 'Rows count is required' }).int().positive(),
            columns: zod_1.z.number({ message: 'Columns count is required' }).int().positive()
        }),
        svgLayoutPath: zod_1.z.string().optional()
    })
});
exports.createSeatSchema = zod_1.z.object({
    body: zod_1.z.object({
        seatNumber: zod_1.z.string({ message: 'Seat number is required' }).min(1),
        floorId: zod_1.z.string({ message: 'Floor ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Floor ID'),
        roomName: zod_1.z.string({ message: 'Room name is required' }).min(1),
        seatType: zod_1.z.enum(['desk', 'pc', 'collaborative']).default('desk'),
        hasPowerOutlet: zod_1.z.boolean().default(false),
        isNearWindow: zod_1.z.boolean().default(false),
        coordinates: zod_1.z.object({
            x: zod_1.z.number().int().nonnegative(),
            y: zod_1.z.number().int().nonnegative()
        }),
        deviceId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Device ID').optional()
    })
});
exports.createBookingSchema = zod_1.z.object({
    body: zod_1.z.object({
        seatId: zod_1.z.string({ message: 'Seat ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Seat ID'),
        startTime: zod_1.z.string({ message: 'Start time is required' }).datetime('Invalid start date-time format'),
        endTime: zod_1.z.string({ message: 'End time is required' }).datetime('Invalid end date-time format')
    })
});
exports.updateSeatOverrideSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['vacant', 'occupied', 'reserved', 'maintenance', 'offline']),
        reason: zod_1.z.string().min(1, 'Override reason is required').optional()
    })
});
exports.registerDeviceSchema = zod_1.z.object({
    body: zod_1.z.object({
        macAddress: zod_1.z.string({ message: 'MAC address is required' }).regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC format'),
        deviceName: zod_1.z.string({ message: 'Device name is required' }).min(1)
    })
});
