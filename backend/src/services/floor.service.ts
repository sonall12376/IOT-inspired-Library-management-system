import { Floor } from '../models/Floor';
import { Seat } from '../models/Seat';
import { IFloor } from '../interfaces/models.interface';
import { AppError } from '../middlewares/error';

export class FloorService {
  /**
   * Get all floors
   */
  public static async getAllFloors(): Promise<IFloor[]> {
    return Floor.find().sort({ floorNumber: 1 });
  }

  /**
   * Get floor by ID
   */
  public static async getFloorById(id: string): Promise<IFloor> {
    const floor = await Floor.findById(id);
    if (!floor) {
      throw new AppError('Floor not found', 404);
    }
    return floor;
  }

  /**
   * Create a new floor
   */
  public static async createFloor(payload: Partial<IFloor>): Promise<IFloor> {
    const { floorNumber } = payload;
    const existing = await Floor.findOne({ floorNumber });
    if (existing) {
      throw new AppError(`Floor number ${floorNumber} already exists`, 400);
    }
    const newFloor = new Floor(payload);
    await newFloor.save();
    return newFloor;
  }

  /**
   * Update an existing floor
   */
  public static async updateFloor(id: string, payload: Partial<IFloor>): Promise<IFloor> {
    const { floorNumber } = payload;
    if (floorNumber !== undefined) {
      const existing = await Floor.findOne({ floorNumber, _id: { $ne: id } });
      if (existing) {
        throw new AppError(`Floor number ${floorNumber} already exists`, 400);
      }
    }

    const floor = await Floor.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!floor) {
      throw new AppError('Floor not found', 404);
    }
    return floor;
  }

  /**
   * Delete a floor and all seats bound to it (cascading delete)
   */
  public static async deleteFloor(id: string): Promise<void> {
    const floor = await Floor.findByIdAndDelete(id);
    if (!floor) {
      throw new AppError('Floor not found', 404);
    }
    // Cascading delete seats mapped to this floor
    await Seat.deleteMany({ floorId: id });
  }
}
