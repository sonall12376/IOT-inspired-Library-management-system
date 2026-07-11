import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../src/app';
import { User } from '../src/models/User';
import { Floor } from '../src/models/Floor';
import { Seat } from '../src/models/Seat';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  server.close();
}, 60000);

beforeEach(async () => {
  await User.deleteMany({});
  await Floor.deleteMany({});
  await Seat.deleteMany({});
});

describe('Floor Management API Integration Tests', () => {
  let adminToken: string;
  let studentToken: string;

  const testFloor = {
    floorNumber: 1,
    name: 'First Floor Study Wing',
    gridDimensions: { rows: 8, columns: 10 }
  };

  beforeEach(async () => {
    // 1. Create Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@library.edu',
        password: 'AdminPassword123'
      });
    
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@library.edu',
        password: 'AdminPassword123'
      });
    adminToken = adminLogin.body.token;

    // 2. Create Student
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@library.edu',
        password: 'StudentPassword123'
      });

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@library.edu',
        password: 'StudentPassword123'
      });
    studentToken = studentLogin.body.token;
  });

  describe('GET /api/floors', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/floors');
      expect(res.statusCode).toEqual(401);
    });

    it('should return an empty floor list initially', async () => {
      const res = await request(app)
        .get('/api/floors')
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.floors).toBeInstanceOf(Array);
      expect(res.body.floors.length).toEqual(0);
    });
  });

  describe('POST /api/floors', () => {
    it('should block non-admin users from creating a floor', async () => {
      const res = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(testFloor);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to create a new floor successfully', async () => {
      const res = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.floor).toHaveProperty('_id');
      expect(res.body.floor.floorNumber).toEqual(testFloor.floorNumber);
      expect(res.body.floor.name).toEqual(testFloor.name);
    });

    it('should fail when creating a floor with duplicate floor number', async () => {
      await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const res = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testFloor,
          name: 'Alternative Name'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject invalid input schemas', async () => {
      const res = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          floorNumber: 'not-a-number',
          name: '',
          gridDimensions: { rows: -5, columns: 0 }
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/floors/:id', () => {
    it('should retrieve a floor by its ID', async () => {
      const createRes = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const floorId = createRes.body.floor._id;

      const res = await request(app)
        .get(`/api/floors/${floorId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.floor.name).toEqual(testFloor.name);
    });

    it('should return 404 for a non-existent floor ID', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/floors/${randomId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/floors/:id', () => {
    it('should allow admin to update a floor', async () => {
      const createRes = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const floorId = createRes.body.floor._id;

      const res = await request(app)
        .put(`/api/floors/${floorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Renamed Floor Wing',
          gridDimensions: { rows: 12, columns: 12 }
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.floor.name).toEqual('Renamed Floor Wing');
      expect(res.body.floor.gridDimensions.rows).toEqual(12);
    });

    it('should block non-admin users from updating a floor', async () => {
      const createRes = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const floorId = createRes.body.floor._id;

      const res = await request(app)
        .put(`/api/floors/${floorId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Hack Attempt' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/floors/:id', () => {
    it('should delete floor and trigger cascading seat deletion', async () => {
      // 1. Create a floor
      const createRes = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const floorId = createRes.body.floor._id;

      // 2. Mock create a seat bound to this floor
      await Seat.create({
        seatNumber: 'S-100',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Silent Hall',
        seatType: 'desk',
        coordinates: { x: 1, y: 1 },
        status: 'vacant'
      });

      // 3. Delete floor
      const res = await request(app)
        .delete(`/api/floors/${floorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      // 4. Verify floor is gone
      const checkFloor = await Floor.findById(floorId);
      expect(checkFloor).toBeNull();

      // 5. Verify mapped seat is deleted (cascade delete check)
      const checkSeat = await Seat.findOne({ floorId });
      expect(checkSeat).toBeNull();
    });

    it('should block non-admin from deleting a floor', async () => {
      const createRes = await request(app)
        .post('/api/floors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testFloor);

      const floorId = createRes.body.floor._id;

      const res = await request(app)
        .delete(`/api/floors/${floorId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
