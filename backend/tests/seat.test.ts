import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../src/app';
import { User } from '../src/models/User';
import { Floor } from '../src/models/Floor';
import { Seat } from '../src/models/Seat';
import { AuditLog } from '../src/models/AuditLog';

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
  await AuditLog.deleteMany({});
});

describe('Seat Management API Integration Tests', () => {
  let adminToken: string;
  let librarianToken: string;
  let studentToken: string;
  let floorId: string;

  beforeEach(async () => {
    // 1. Create Admin
    await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@library.edu',
      password: 'AdminPassword123'
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@library.edu',
      password: 'AdminPassword123'
    });
    adminToken = adminLogin.body.token;

    // 2. Create Librarian
    await request(app).post('/api/auth/register').send({
      name: 'Librarian User',
      email: 'librarian@library.edu',
      password: 'LibrarianPassword123',
      role: 'librarian'
    });
    const librarianLogin = await request(app).post('/api/auth/login').send({
      email: 'librarian@library.edu',
      password: 'LibrarianPassword123'
    });
    librarianToken = librarianLogin.body.token;

    // 3. Create Student
    await request(app).post('/api/auth/register').send({
      name: 'Student User',
      email: 'student@library.edu',
      password: 'StudentPassword123'
    });
    const studentLogin = await request(app).post('/api/auth/login').send({
      email: 'student@library.edu',
      password: 'StudentPassword123'
    });
    studentToken = studentLogin.body.token;

    // 4. Create a dummy Floor
    const floorRes = await request(app)
      .post('/api/floors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        floorNumber: 1,
        name: 'Main Reading Level',
        gridDimensions: { rows: 10, columns: 10 }
      });
    floorId = floorRes.body.floor._id;
  });

  describe('GET /api/seats', () => {
    it('should block student requests to fetch all seats', async () => {
      const res = await request(app)
        .get('/api/seats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should allow librarian requests to fetch all seats', async () => {
      const res = await request(app)
        .get('/api/seats')
        .set('Authorization', `Bearer ${librarianToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seats).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/seats', () => {
    const testSeat = (num: string) => ({
      seatNumber: num,
      floorId,
      roomName: 'Silent Zone',
      seatType: 'desk',
      coordinates: { x: 2, y: 3 }
    });

    it('should block non-admin users from creating seats', async () => {
      const res = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send(testSeat('S-001'));
      expect(res.statusCode).toEqual(403);
    });

    it('should allow admin to create a new seat', async () => {
      const res = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSeat('S-001'));
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.seat.seatNumber).toEqual('S-001');
      expect(res.body.seat.status).toEqual('vacant');
    });

    it('should fail when creating a seat with duplicate seatNumber on same floor', async () => {
      await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSeat('S-001'));

      const res = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSeat('S-001'));

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/floors/:floorId/seats', () => {
    it('should allow students to fetch seats on a floor', async () => {
      // Create seat
      await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seatNumber: 'S-002',
          floorId,
          roomName: 'Main Room',
          coordinates: { x: 5, y: 5 }
        });

      const res = await request(app)
        .get(`/api/floors/${floorId}/seats`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seats.length).toEqual(1);
      expect(res.body.seats[0].seatNumber).toEqual('S-002');
    });
  });

  describe('PUT /api/seats/:id', () => {
    it('should allow admin to update seat config details', async () => {
      const createRes = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seatNumber: 'S-003',
          floorId,
          roomName: 'Main Room',
          coordinates: { x: 5, y: 5 }
        });
      const seatId = createRes.body.seat._id;

      const res = await request(app)
        .put(`/api/seats/${seatId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomName: 'Collaborative Lab',
          hasPowerOutlet: true,
          coordinates: { x: 10, y: 15 }
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seat.roomName).toEqual('Collaborative Lab');
      expect(res.body.seat.hasPowerOutlet).toBe(true);
      expect(res.body.seat.coordinates.x).toEqual(10);
    });
  });

  describe('PUT /api/seats/:id/override', () => {
    it('should allow librarian to override status and write audit log', async () => {
      const createRes = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seatNumber: 'S-004',
          floorId,
          roomName: 'Main Room',
          coordinates: { x: 5, y: 5 }
        });
      const seatId = createRes.body.seat._id;

      const res = await request(app)
        .put(`/api/seats/${seatId}/override`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          status: 'maintenance',
          reason: 'Broken power outlet unit'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.seat.status).toEqual('maintenance');

      // Verify Audit Log was generated
      const logs = await AuditLog.find({});
      expect(logs.length).toEqual(1);
      expect(logs[0].action).toEqual('SEAT_OVERRIDE');
      expect(logs[0].details).toContain('maintenance');
      expect(logs[0].details).toContain('Broken power outlet unit');
    });

    it('should block students from overriding seat status', async () => {
      const createRes = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seatNumber: 'S-005',
          floorId,
          roomName: 'Main Room',
          coordinates: { x: 5, y: 5 }
        });
      const seatId = createRes.body.seat._id;

      const res = await request(app)
        .put(`/api/seats/${seatId}/override`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'maintenance',
          reason: 'Hacking status'
        });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/seats/:id', () => {
    it('should allow admin to delete a seat', async () => {
      const createRes = await request(app)
        .post('/api/seats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seatNumber: 'S-006',
          floorId,
          roomName: 'Main Room',
          coordinates: { x: 5, y: 5 }
        });
      const seatId = createRes.body.seat._id;

      const res = await request(app)
        .delete(`/api/seats/${seatId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const check = await Seat.findById(seatId);
      expect(check).toBeNull();
    });
  });
});
