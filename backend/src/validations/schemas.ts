import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email address'),
    password: z.string({ message: 'Password is required' }).min(1, 'Password is required')
  })
});

export const createFloorSchema = z.object({
  body: z.object({
    floorNumber: z.number({ message: 'Floor number is required' }).int(),
    name: z.string({ message: 'Floor name is required' }).min(1, 'Floor name cannot be empty'),
    gridDimensions: z.object({
      rows: z.number({ message: 'Rows count is required' }).int().positive(),
      columns: z.number({ message: 'Columns count is required' }).int().positive()
    }),
    svgLayoutPath: z.string().optional()
  })
});

export const createSeatSchema = z.object({
  body: z.object({
    seatNumber: z.string({ message: 'Seat number is required' }).min(1),
    floorId: z.string({ message: 'Floor ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Floor ID'),
    roomName: z.string({ message: 'Room name is required' }).min(1),
    seatType: z.enum(['desk', 'pc', 'collaborative']).default('desk'),
    hasPowerOutlet: z.boolean().default(false),
    isNearWindow: z.boolean().default(false),
    coordinates: z.object({
      x: z.number().int().nonnegative(),
      y: z.number().int().nonnegative()
    }),
    deviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Device ID').optional()
  })
});

export const createBookingSchema = z.object({
  body: z.object({
    seatId: z.string({ message: 'Seat ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Seat ID'),
    startTime: z.string({ message: 'Start time is required' }).datetime('Invalid start date-time format'),
    endTime: z.string({ message: 'End time is required' }).datetime('Invalid end date-time format')
  })
});

export const updateSeatOverrideSchema = z.object({
  body: z.object({
    status: z.enum(['vacant', 'occupied', 'reserved', 'maintenance', 'offline']),
    reason: z.string().min(1, 'Override reason is required').optional()
  })
});

export const registerDeviceSchema = z.object({
  body: z.object({
    macAddress: z.string({ message: 'MAC address is required' }).regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC format'),
    deviceName: z.string({ message: 'Device name is required' }).min(1)
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ message: 'Refresh token is required' }).min(1, 'Refresh token cannot be empty')
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email is required' }).email('Invalid email address')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters')
  }),
  params: z.object({
    token: z.string({ message: 'Reset token is required' }).min(1, 'Reset token cannot be empty')
  })
});

