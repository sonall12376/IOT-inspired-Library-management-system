import { beforeAll, afterAll, beforeEach, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server, io } from '../src/app';
import { User } from '../src/models/User';
import { Floor } from '../src/models/Floor';
import { Seat } from '../src/models/Seat';
import { Booking } from '../src/models/Booking';
import { BookingSchedulerService } from '../src/services/booking-scheduler.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);

  // Start scheduler with short intervals for testing
  BookingSchedulerService.initialize(io, 50);
}, 60000);

afterAll(async () => {
  BookingSchedulerService.stop();
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Seat Reservation API Integration Tests', () => {
  let adminToken: string;
  let librarianToken: string;
  let student1Token: string;
  let student2Token: string;
  let seatId: string;
  let floorId: string;

  beforeEach(async () => {
    // 1. Create Users
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

    await request(app).post('/api/auth/register').send({
      name: 'Student One',
      email: 'student1@library.edu',
      password: 'StudentPassword123'
    });
    const s1Login = await request(app).post('/api/auth/login').send({
      email: 'student1@library.edu',
      password: 'StudentPassword123'
    });
    student1Token = s1Login.body.token;

    await request(app).post('/api/auth/register').send({
      name: 'Student Two',
      email: 'student2@library.edu',
      password: 'StudentPassword123'
    });
    const s2Login = await request(app).post('/api/auth/login').send({
      email: 'student2@library.edu',
      password: 'StudentPassword123'
    });
    student2Token = s2Login.body.token;

    // 2. Setup Floor
    const floorRes = await request(app)
      .post('/api/floors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        floorNumber: 1,
        name: 'Study Zone',
        gridDimensions: { rows: 5, columns: 5 }
      });
    floorId = floorRes.body.floor._id;

    // 3. Setup Seat
    const seatRes = await request(app)
      .post('/api/seats')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        seatNumber: 'S-001',
        floorId,
        roomName: 'Quiet Area',
        coordinates: { x: 1, y: 1 }
      });
    seatId = seatRes.body.seat._id;
  });

  describe('POST /api/bookings (Create Reservation)', () => {
    it('should successfully reserve a vacant seat for student', async () => {
      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 70 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.status).toEqual('pending');
    });

    it('should refuse booking if requested slot overlaps with active booking', async () => {
      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 70 * 60 * 1000).toISOString();

      // First booking
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });

      // Overlapping second booking
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ seatId, startTime: start, endTime: end });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already reserved');
    });

    it('should enforce 2 active bookings/day quota rule for student users', async () => {
      const start1 = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end1 = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const start2 = new Date(Date.now() + 50 * 60 * 1000).toISOString();
      const end2 = new Date(Date.now() + 80 * 60 * 1000).toISOString();

      const start3 = new Date(Date.now() + 90 * 60 * 1000).toISOString();
      const end3 = new Date(Date.now() + 120 * 60 * 1000).toISOString();

      // Create a second seat so student can request a second booking
      const secondSeat = await Seat.create({
        seatNumber: 'S-002',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Quiet Area',
        coordinates: { x: 1, y: 2 }
      });

      // Create a third seat
      const thirdSeat = await Seat.create({
        seatNumber: 'S-003',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Quiet Area',
        coordinates: { x: 1, y: 3 }
      });

      // Booking 1 (Vacant seat 1)
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start1, endTime: end1 });

      // Booking 2 (Vacant seat 2)
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId: secondSeat._id.toString(), startTime: start2, endTime: end2 });

      // Booking 3 (Exceeds daily quota limit)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId: thirdSeat._id.toString(), startTime: start3, endTime: end3 });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('quota exceeded');
    });

    it('should refuse booking if target seat is under maintenance or offline', async () => {
      const seatM = await Seat.create({
        seatNumber: 'S-Maint',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Quiet Area',
        coordinates: { x: 3, y: 3 },
        status: 'maintenance'
      });

      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId: seatM._id.toString(), startTime: start, endTime: end });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('under maintenance');
    });
  });

  describe('PUT /api/bookings/:id/cancel (Cancel booking)', () => {
    it('should allow student owner to cancel booking', async () => {
      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });
      const bookingId = createRes.body.booking._id;

      const res = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.booking.status).toEqual('cancelled');

      // Check seat released
      const checkSeat = await Seat.findById(seatId);
      expect(checkSeat?.status).toEqual('vacant');
    });

    it('should refuse cancellation request from another student user', async () => {
      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });
      const bookingId = createRes.body.booking._id;

      const res = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should allow librarians to override and cancel any booking', async () => {
      const start = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });
      const bookingId = createRes.body.booking._id;

      const res = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${librarianToken}`);

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('PUT /api/bookings/:id/check-in & check-out', () => {
    it('should check in student when requested within grace check-in window', async () => {
      const start = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // starts in 2 minutes
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });
      const bookingId = createRes.body.booking._id;

      const checkInRes = await request(app)
        .put(`/api/bookings/${bookingId}/check-in`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(checkInRes.statusCode).toEqual(200);
      expect(checkInRes.body.booking.status).toEqual('active');
      expect(checkInRes.body.booking).toHaveProperty('checkInTime');

      // Seat status becomes occupied
      const checkSeat = await Seat.findById(seatId);
      expect(checkSeat?.status).toEqual('occupied');
    });

    it('should checkout active booking and release seat', async () => {
      const start = new Date(Date.now() + 1 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 40 * 60 * 1000).toISOString();

      const createRes = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ seatId, startTime: start, endTime: end });
      const bookingId = createRes.body.booking._id;

      // Check-in
      await request(app)
        .put(`/api/bookings/${bookingId}/check-in`)
        .set('Authorization', `Bearer ${student1Token}`);

      // Check-out
      const checkOutRes = await request(app)
        .put(`/api/bookings/${bookingId}/check-out`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(checkOutRes.statusCode).toEqual(200);
      expect(checkOutRes.body.booking.status).toEqual('completed');

      // Seat released
      const checkSeat = await Seat.findById(seatId);
      expect(checkSeat?.status).toEqual('vacant');
    });
  });

  describe('BookingSchedulerService Expiring Sweeps', () => {
    it('should automatically flag pending bookings as no-show when grace period expires', async () => {
      const student = await User.create({
        name: 'Test Student',
        email: 'test@library.edu',
        password: 'Password123',
        role: 'student'
      });

      // Create booking that started 20 minutes ago
      const expiredBooking = await Booking.create({
        studentId: student._id,
        seatId: new mongoose.Types.ObjectId(seatId),
        startTime: new Date(Date.now() - 20 * 60 * 1000),
        endTime: new Date(Date.now() + 30 * 60 * 1000),
        status: 'pending'
      });

      // Update seat to reserved
      await Seat.findByIdAndUpdate(seatId, { status: 'reserved' });

      // Wait for scheduler sweep (configured to run every 50ms)
      await sleep(150);

      // Verify booking status is now no-show
      const checkBooking = await Booking.findById(expiredBooking._id);
      expect(checkBooking?.status).toEqual('no-show');

      // Verify seat released
      const checkSeat = await Seat.findById(seatId);
      expect(checkSeat?.status).toEqual('vacant');
    });

    it('should auto-complete active bookings when end time is reached', async () => {
      const student = await User.create({
        name: 'Test Student',
        email: 'test@library.edu',
        password: 'Password123',
        role: 'student'
      });

      // Create active booking that ended 1 minute ago
      const staleBooking = await Booking.create({
        studentId: student._id,
        seatId: new mongoose.Types.ObjectId(seatId),
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(Date.now() - 60 * 1000),
        status: 'active'
      });

      await Seat.findByIdAndUpdate(seatId, { status: 'occupied' });

      await sleep(150);

      const checkBooking = await Booking.findById(staleBooking._id);
      expect(checkBooking?.status).toEqual('completed');

      const checkSeat = await Seat.findById(seatId);
      expect(checkSeat?.status).toEqual('vacant');
    });
  });
});
