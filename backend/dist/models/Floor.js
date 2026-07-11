"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Floor = void 0;
const mongoose_1 = require("mongoose");
const FloorSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true
});
exports.Floor = (0, mongoose_1.model)('Floor', FloorSchema);
exports.default = exports.Floor;
