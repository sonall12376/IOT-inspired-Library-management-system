import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../middlewares/error';
import { IUser } from '../interfaces/models.interface';
import { logger } from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_session_token_key_19283';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

export class AuthService {
  /**
   * Generate access and refresh tokens for a user
   */
  private static async generateTokens(user: IUser): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshTokenStr = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

    // Save refresh token to database
    await RefreshToken.create({
      token: refreshTokenStr,
      userId: user._id,
      expiresAt
    });

    return { accessToken, refreshToken: refreshTokenStr };
  }

  /**
   * Register a new user
   */
  public static async register(payload: Partial<IUser>): Promise<IUser> {
    const { email } = payload;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 400);
    }

    // Default first registered user to Admin for bootstrapping, otherwise Student
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : (payload.role || 'student');

    const newUser = new User({
      ...payload,
      role: assignedRole
    });

    await newUser.save();
    
    // Clean password from return object
    newUser.password = undefined;
    return newUser;
  }

  /**
   * Authenticate a user, sign JWT access token, and generate refresh token
   */
  public static async login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: IUser }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.password = undefined;
    return { token: accessToken, refreshToken, user };
  }

  /**
   * Rotate refresh token and issue new access token
   */
  public static async refreshToken(tokenStr: string): Promise<{ accessToken: string; refreshToken: string }> {
    const existingToken = await RefreshToken.findOne({ token: tokenStr });
    if (!existingToken) {
      throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
    }

    // Check if refresh token has expired
    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: existingToken._id });
      throw new AppError('Refresh token expired. Please sign in again.', 401);
    }

    const user = await User.findById(existingToken.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: existingToken._id });
      throw new AppError('Session user no longer exists.', 401);
    }

    // Rotate tokens (delete old refresh token, create new access/refresh tokens)
    await RefreshToken.deleteOne({ _id: existingToken._id });
    const tokens = await this.generateTokens(user);

    return tokens;
  }

  /**
   * Revoke refresh token (Logout)
   */
  public static async logout(tokenStr: string): Promise<void> {
    await RefreshToken.deleteOne({ token: tokenStr });
  }

  /**
   * Generate password recovery token and save to user
   */
  public static async forgotPassword(email: string): Promise<string> {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('No account associated with this email address.', 404);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration

    await user.save();

    // Log the token so developers/tests can verify it
    logger.info(`Password reset token generated for user ${email}: ${resetToken}`);

    return resetToken;
  }

  /**
   * Verify recovery token and update user password
   */
  public static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Revoke all active sessions on password change for security
    await RefreshToken.deleteMany({ userId: user._id });
  }

  /**
   * Fetch profile by ID
   */
  public static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User profile not found', 404);
    }
    return user;
  }
}

