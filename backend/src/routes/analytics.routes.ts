import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { validateJWT, requireRole } from '../middlewares/auth';

const router = Router();

// Retrieve live seat occupancy stats (Librarians & Admins)
router.get(
  '/occupancy',
  validateJWT,
  requireRole(['librarian', 'admin']),
  AnalyticsController.getOccupancyAnalytics
);

// Retrieve historical booking statistics & peak hour trends (Librarians & Admins)
router.get(
  '/bookings',
  validateJWT,
  requireRole(['librarian', 'admin']),
  AnalyticsController.getBookingAnalytics
);

// Export bookings statistics as downloadable CSV (Librarians & Admins)
router.get(
  '/export',
  validateJWT,
  requireRole(['librarian', 'admin']),
  AnalyticsController.exportReport
);

export default router;
