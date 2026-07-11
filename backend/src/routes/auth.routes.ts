import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation';
import { validateJWT } from '../middlewares/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validations/schemas';

const router = Router();

// Registration route
router.post('/register', validateRequest(registerSchema), AuthController.register);

// Login route
router.post('/login', validateRequest(loginSchema), AuthController.login);

// Refresh Token route
router.post('/refresh', validateRequest(refreshTokenSchema), AuthController.refreshToken);

// Logout route
router.post('/logout', validateRequest(refreshTokenSchema), AuthController.logout);

// Forgot Password route
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);

// Reset Password route
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Profile route (requires JWT authentication)
router.get('/profile', validateJWT, AuthController.getProfile);

export default router;

