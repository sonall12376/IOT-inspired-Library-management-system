import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '../interfaces/models.interface'; // Let's define the TS interface too!

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
      type: String,
      enum: ['student', 'librarian', 'admin'],
      default: 'student'
    },
    dailyBookingCount: {
      type: Number,
      default: 0
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;
  if (this.password) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Helper method to compare password
UserSchema.methods.comparePassword = async function (this: IUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

export const User = model<IUser>('User', UserSchema);
export default User;
