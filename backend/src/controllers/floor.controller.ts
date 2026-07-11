import { Request, Response, NextFunction } from 'express';
import { FloorService } from '../services/floor.service';
import { logger } from '../config/logger';

export class FloorController {
  /**
   * Get list of all floors
   */
  public static async getFloors(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floors = await FloorService.getAllFloors();
      res.status(200).json({
        success: true,
        floors
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single floor details by ID
   */
  public static async getFloorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floorId = req.params.id as string;
      const floor = await FloorService.getFloorById(floorId);
      res.status(200).json({
        success: true,
        floor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new floor (Admin only)
   */
  public static async createFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Creating new floor: ${req.body.name} (Floor #${req.body.floorNumber})`);
      const floor = await FloorService.createFloor(req.body);
      res.status(201).json({
        success: true,
        floor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update floor parameters (Admin only)
   */
  public static async updateFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floorId = req.params.id as string;
      logger.info(`Updating floor ID: ${floorId}`);
      const floor = await FloorService.updateFloor(floorId, req.body);
      res.status(200).json({
        success: true,
        floor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a floor and all its seats (Admin only)
   */
  public static async deleteFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floorId = req.params.id as string;
      logger.info(`Deleting floor ID: ${floorId}`);
      await FloorService.deleteFloor(floorId);
      res.status(200).json({
        success: true,
        message: 'Floor and all its mapped seats have been deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
