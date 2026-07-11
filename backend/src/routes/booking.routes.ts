import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validateRequest } from '../middlewares/validation';
import { validateJWT } from '../middlewares/auth';
import { createBookingSchema } from '../validations/schemas';

const router = Router();

// Retrieve bookings (Personal history for student, all bookings for librarian/admin)
router.get('/', validateJWT, BookingController.getBookings);

// Get single booking details
router.get('/:id', validateJWT, BookingController.getBookingById);

// Create new seat reservation
router.post('/', validateJWT, validateRequest(createBookingSchema), BookingController.createBooking);

// Cancel a booking
router.put('/:id/cancel', validateJWT, BookingController.cancelBooking);

// Manual check-in
router.put('/:id/check-in', validateJWT, BookingController.checkIn);

// Manual check-out
router.put('/:id/check-out', validateJWT, BookingController.checkOut);

export default router;
