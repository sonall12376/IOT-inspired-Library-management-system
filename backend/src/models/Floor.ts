import { Schema, model } from 'mongoose';
import { IFloor } from '../interfaces/models.interface';

const FloorSchema = new Schema<IFloor>(
  {
    floorNumber: {
      type: Number,
      required: [true, 'Floor number is required'],
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Floor name is required'],
      trim: true
    },
    gridDimensions: {
      rows: {
        type: Number,
        required: [true, 'Rows count is required'],
        min: [1, 'Rows must be at least 1']
      },
      columns: {
        type: Number,
        required: [true, 'Columns count is required'],
        min: [1, 'Columns must be at least 1']
      }
    },
    svgLayoutPath: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const Floor = model<IFloor>('Floor', FloorSchema);
export default Floor;
