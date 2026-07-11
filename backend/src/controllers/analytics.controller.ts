import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../config/logger';

export class AnalyticsController {
  /**
   * Responds with current live seat occupancy rates and counts.
   */
  static async getOccupancyAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getOccupancyStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      logger.error('Failed to get occupancy analytics:', err);
      next(err);
    }
  }

  /**
   * Responds with booking volume breakdown and peak hourly distributions.
   */
  static async getBookingAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AnalyticsService.getBookingStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      logger.error('Failed to get booking analytics:', err);
      next(err);
    }
  }

  /**
   * Generates and streams all booking data as a downloadable CSV attachment.
   */
  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info(`User ${req.user?.email} requested booking statistics CSV export.`);
      const csvContent = await AnalyticsService.exportBookingsCSV();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="smartlibrary-booking-report.csv"');
      return res.status(200).send(csvContent);
    } catch (err) {
      logger.error('Failed to export bookings report:', err);
      next(err);
    }
  }
}
