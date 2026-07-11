import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../config/logger';

export class AuthController {
  /**
   * Register User Handler
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info(`Attempting to register user: ${req.body.email}`);
      const user = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login User Handler
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      logger.info(`User login attempt: ${email}`);
      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access Token Handler
   */
  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      logger.info('Attempting to refresh access token');
      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        token: result.accessToken,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout User Handler
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      logger.info('User logging out');
      await AuthService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password Handler
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      logger.info(`Request password reset for email: ${email}`);
      const resetToken = await AuthService.forgotPassword(email);

      const response: any = {
        success: true,
        message: 'Password reset instructions have been logged/sent successfully.'
      };

      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        response.resetToken = resetToken;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password Handler
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.params.token as string;
      const { password } = req.body;
      logger.info('Attempting to reset password with recovery token');
      await AuthService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successful. Please sign in with your new credentials.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Profile Handler
   */
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      next(error);
    }
  }
}
