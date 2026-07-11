import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../src/app';
import { User } from '../src/models/User';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Close any existing mongoose connections and connect to the mock server
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  // Clean up database connection and stop server
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  // Close the Express HTTP server connection to release ports
  server.close();
}, 60000);

beforeEach(async () => {
  // Clear collections before each test run
  await User.deleteMany({});
});

describe('Authentication API Integration Tests', () => {
  const testStudent = {
    name: 'Student User',
    email: 'student@library.edu',
    password: 'SecurePassword123'
  };

  describe('POST /api/auth/register', () => {
    it('should successfully register a new student user and return 201', async () => {
      // Register a dummy first user so that the test student is the second user (assigned 'student' role)
      await request(app).post('/api/auth/register').send({
        name: 'First User',
        email: 'first@library.edu',
        password: 'FirstPassword123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body.user.email).toEqual(testStudent.email);
      expect(res.body.user.role).toEqual('student'); // Successfully registered as student
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should assign Admin role to the first registered user', async () => {
      // First registration
      const firstRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First Admin',
          email: 'admin@library.edu',
          password: 'AdminPassword123'
        });

      expect(firstRes.statusCode).toEqual(201);
      expect(firstRes.body.user.role).toEqual('admin');
    });

    it('should refuse registration with overlapping emails', async () => {
      await request(app).post('/api/auth/register').send(testStudent);
      const res = await request(app).post('/api/auth/register').send(testStudent);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register user before login testing
      await request(app).post('/api/auth/register').send(testStudent);
    });

    it('should login successfully with correct credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toEqual(testStudent.email);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: 'IncorrectPassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      // Setup active user session
      await request(app).post('/api/auth/register').send(testStudent);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });
      token = loginRes.body.token;
    });

    it('should fetch user profile details when supplied valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toEqual(testStudent.email);
      expect(res.body.user.name).toEqual(testStudent.name);
    });

    it('should refuse access when token is missing', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testStudent);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });
      refreshToken = loginRes.body.refreshToken;
    });

    it('should issue new access and refresh tokens when supplied valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toEqual(refreshToken); // Rotation verified!
    });

    it('should refuse rotation when token is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token_string_here' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testStudent);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });
      refreshToken = loginRes.body.refreshToken;
    });

    it('should successfully logout and revoke the refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // Verify token is revoked by attempting to refresh again
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.statusCode).toEqual(401);
    });
  });

  describe('Password Recovery and Reset', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testStudent);
    });

    it('should generate a reset token on forgot-password request', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testStudent.email });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('resetToken'); // Present in test/dev mode
    });

    it('should fail reset-password with expired or invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/invalid_reset_token')
        .send({ password: 'NewSecurePassword123' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('invalid or has expired');
    });

    it('should successfully reset password with valid token and allow login with new password', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testStudent.email });

      const resetToken = forgotRes.body.resetToken;

      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'NewSecurePassword123' });

      expect(resetRes.statusCode).toEqual(200);
      expect(resetRes.body.success).toBe(true);

      // Verify old password fails login
      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password
        });
      expect(oldLoginRes.statusCode).toEqual(401);

      // Verify new password succeeds login
      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: 'NewSecurePassword123'
        });
      expect(newLoginRes.statusCode).toEqual(200);
      expect(newLoginRes.body.success).toBe(true);
    });
  });
});

