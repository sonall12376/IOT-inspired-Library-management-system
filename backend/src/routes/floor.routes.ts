import { Router } from 'express';
import { FloorController } from '../controllers/floor.controller';
import { SeatController } from '../controllers/seat.controller';
import { validateRequest } from '../middlewares/validation';
import { validateJWT, requireRole } from '../middlewares/auth';
import { createFloorSchema, updateFloorSchema } from '../validations/schemas';

const router = Router();

// Retrieve all floors (accessible by students, librarians, admins)
router.get('/', validateJWT, requireRole(['student', 'librarian', 'admin']), FloorController.getFloors);

// Retrieve details for a single floor
router.get('/:id', validateJWT, requireRole(['student', 'librarian', 'admin']), FloorController.getFloorById);

// Retrieve seats for a floor
router.get('/:floorId/seats', validateJWT, requireRole(['student', 'librarian', 'admin']), SeatController.getSeatsByFloor);

// Create new floor (Admin only)
router.post('/', validateJWT, requireRole(['admin']), validateRequest(createFloorSchema), FloorController.createFloor);

// Update floor parameters (Admin only)
router.put('/:id', validateJWT, requireRole(['admin']), validateRequest(updateFloorSchema), FloorController.updateFloor);

// Delete floor and cascading seats (Admin only)
router.delete('/:id', validateJWT, requireRole(['admin']), FloorController.deleteFloor);

export default router;
