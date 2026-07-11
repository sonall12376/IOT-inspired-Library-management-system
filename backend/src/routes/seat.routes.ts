import { Router } from 'express';
import { SeatController } from '../controllers/seat.controller';
import { validateRequest } from '../middlewares/validation';
import { validateJWT, requireRole } from '../middlewares/auth';
import { createSeatSchema, updateSeatSchema, updateSeatOverrideSchema } from '../validations/schemas';

const router = Router();

// Retrieve all seats (Librarian, Admin only)
router.get('/', validateJWT, requireRole(['librarian', 'admin']), SeatController.getSeats);

// Create new seat (Admin only)
router.post('/', validateJWT, requireRole(['admin']), validateRequest(createSeatSchema), SeatController.createSeat);

// Update seat parameters (Admin only)
router.put('/:id', validateJWT, requireRole(['admin']), validateRequest(updateSeatSchema), SeatController.updateSeat);

// Override seat status (Librarian, Admin only)
router.put('/:id/override', validateJWT, requireRole(['librarian', 'admin']), validateRequest(updateSeatOverrideSchema), SeatController.overrideSeat);

// Delete seat (Admin only)
router.delete('/:id', validateJWT, requireRole(['admin']), SeatController.deleteSeat);

export default router;
