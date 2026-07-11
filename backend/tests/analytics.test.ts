import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server } from '../src/app';
import { User } from '../src/models/User';
import { Floor } from '../src/models/Floor';
import { Seat } from '../src/models/Seat';
import { Booking } from '../src/models/Booking';

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
  await Booking.deleteMany({});
});

describe('Analytics & Reports API Integration Tests', () => {
  let adminToken: string;
  let studentToken: string;
  let studentId: string;
  let floorId: string;
  let seatId: string;

  beforeEach(async () => {
    // 1. Create Admin (first user is auto admin)
    await request(app)
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
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@library.edu',
        password: 'StudentPassword123'
      });
    studentId = studentRes.body.user.id || studentRes.body.user._id;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@library.edu',
        password: 'StudentPassword123'
      });
    studentToken = studentLogin.body.token;

    // 3. Create Floor
    const floor = await Floor.create({
      floorNumber: 1,
      name: 'Main Reading Room',
      gridDimensions: { rows: 5, columns: 5 }
    });
    floorId = floor._id.toString();

    // 4. Create Seats with different statuses
    const seat1 = await Seat.create({
      seatNumber: 'S-01',
      floorId: floor._id,
      roomName: 'Main Room',
      seatType: 'desk',
      hasPowerOutlet: true,
      isNearWindow: false,
      coordinates: { x: 1, y: 1 },
      status: 'occupied'
    });
    seatId = seat1._id.toString();

    await Seat.create({
      seatNumber: 'S-02',
      floorId: floor._id,
      roomName: 'Main Room',
      seatType: 'pc',
      hasPowerOutlet: true,
      isNearWindow: true,
      coordinates: { x: 2, y: 1 },
      status: 'vacant'
    });

    await Seat.create({
      seatNumber: 'S-03',
      floorId: floor._id,
      roomName: 'Main Room',
      seatType: 'collaborative',
      hasPowerOutlet: false,
      isNearWindow: false,
      coordinates: { x: 3, y: 1 },
      status: 'maintenance'
    });

    // 5. Create Booking record
    await Booking.create({
      studentId: new mongoose.Types.ObjectId(studentId),
      seatId: seat1._id,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      checkInTime: new Date().toISOString()
    });
  });

  describe('GET /api/analytics/occupancy', () => {
    it('should allow admin to fetch current occupancy statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/occupancy')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statusBreakdown).toBeDefined();
      expect(res.body.data.statusBreakdown.occupied).toBe(1);
      expect(res.body.data.statusBreakdown.vacant).toBe(1);
      expect(res.body.data.statusBreakdown.maintenance).toBe(1);
      expect(res.body.data.floorStats.length).toBe(1);
      expect(res.body.data.floorStats[0].floorName).toBe('Main Reading Room');
      expect(res.body.data.floorStats[0].occupancyRate).toBe(33.33); // 1 out of 3 total seats
    });

    it('should refuse access for student role', async () => {
      const res = await request(app)
        .get('/api/analytics/occupancy')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should refuse access when token is missing', async () => {
      const res = await request(app)
        .get('/api/analytics/occupancy');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/analytics/bookings', () => {
    it('should allow admin to fetch historical bookings statistics', async () => {
      const res = await request(app)
        .get('/api/analytics/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBookings).toBe(1);
      expect(res.body.data.statusStats.active).toBe(1);
      expect(res.body.data.hourlyTrends.length).toBe(24);
    });

    it('should refuse access for student role', async () => {
      const res = await request(app)
        .get('/api/analytics/bookings')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should download bookings data in CSV format', async () => {
      const res = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="smartlibrary-booking-report.csv"');
      expect(res.text).toContain('"Booking ID","Student Name","Student Email","Seat Number","Room Name","Start Time","End Time","Status","Check-In Time","Check-Out Time"');
      expect(res.text).toContain('student@library.edu');
      expect(res.text).toContain('S-01');
    });

    it('should refuse access for student role', async () => {
      const res = await request(app)
        .get('/api/analytics/export')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
