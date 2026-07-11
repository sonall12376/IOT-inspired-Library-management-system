import { beforeAll, afterAll, beforeEach, describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, server, io } from '../src/app';
import { User } from '../src/models/User';
import { Floor } from '../src/models/Floor';
import { Seat } from '../src/models/Seat';
import { Device } from '../src/models/Device';
import { MQTTService } from '../src/services/mqtt.service';
import { WatchdogService } from '../src/services/watchdog.service';
import mqtt from 'mqtt';

// Mock MQTT connection
jest.mock('mqtt', () => {
  let messageCallback: ((topic: string, message: Buffer) => void) | null = null;
  
  const mockClient = {
    on: jest.fn((event: string, cb: any) => {
      if (event === 'connect') {
        setTimeout(cb, 10);
      } else if (event === 'message') {
        messageCallback = cb;
      }
    }),
    subscribe: jest.fn((topic: string, cb: any) => {
      if (cb) cb(null);
    }),
    publish: jest.fn()
  };

  return {
    connect: jest.fn(() => mockClient),
    __simulateIncomingMessage: (topic: string, payload: any) => {
      if (messageCallback) {
        messageCallback(topic, Buffer.from(JSON.stringify(payload)));
      }
    }
  };
});

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);

  // Initialize MQTT and Watchdog manually for testing
  MQTTService.initialize(io);
  // watchdog sweeps every 50ms, timeouts stale after 100ms
  WatchdogService.initialize(io, 50, 100);
}, 60000);

afterAll(async () => {
  WatchdogService.stop();
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
  await Device.deleteMany({});
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('IoT Integration & Telemetry Ingestion Tests', () => {
  let floorId: string;
  let adminToken: string;

  beforeEach(async () => {
    // Register & login admin
    await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@library.edu',
      password: 'AdminPassword123'
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@library.edu',
      password: 'AdminPassword123'
    });
    adminToken = login.body.token;

    // Create Floor Level
    const floorRes = await request(app)
      .post('/api/floors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        floorNumber: 1,
        name: 'Main Reading Area',
        gridDimensions: { rows: 10, columns: 10 }
      });
    floorId = floorRes.body.floor._id;
  });

  describe('Seat Occupancy Telemetry Ingestion', () => {
    it('should update seat status to occupied on receiving occupied status message', async () => {
      // 1. Create a seat S-100
      const seat = await Seat.create({
        seatNumber: 'S-100',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Main Zone',
        coordinates: { x: 1, y: 1 },
        status: 'vacant'
      });

      // 2. Simulate MQTT push occupied: true
      (mqtt as any).__simulateIncomingMessage('library/floors/1/rooms/main_zone/seats/S-100/status', {
        macAddress: '24:0A:C4:8B:01:FC',
        occupied: true,
        sensorDistanceCm: 22,
        timestamp: Math.floor(Date.now() / 1000)
      });

      await sleep(100);

      // 3. Verify database reflects occupied status
      const updatedSeat = await Seat.findById(seat._id);
      expect(updatedSeat?.status).toEqual('occupied');
    });

    it('should ignore status telemetry when seat is locked under maintenance status', async () => {
      // 1. Create a seat under maintenance status
      const seat = await Seat.create({
        seatNumber: 'S-101',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Main Zone',
        coordinates: { x: 1, y: 2 },
        status: 'maintenance'
      });

      // 2. Simulate occupied: true
      (mqtt as any).__simulateIncomingMessage('library/floors/1/rooms/main_zone/seats/S-101/status', {
        macAddress: '24:0A:C4:8B:02:FC',
        occupied: true,
        sensorDistanceCm: 15,
        timestamp: Math.floor(Date.now() / 1000)
      });

      await sleep(100);

      // 3. Status should remain maintenance
      const checkSeat = await Seat.findById(seat._id);
      expect(checkSeat?.status).toEqual('maintenance');
    });
  });

  describe('Device Discovery & Heartbeats Ingestion', () => {
    it('should auto-register and discover device on receiving first heartbeat message', async () => {
      const mac = '24:0A:C4:8B:99:FC';
      
      // 1. Send heartbeat for non-existent device
      (mqtt as any).__simulateIncomingMessage(`library/devices/${mac}/heartbeat`, {
        status: 'online',
        rssi: -62,
        batteryPercentage: 92,
        firmwareVersion: '1.0.8',
        uptimeSeconds: 500
      });

      await sleep(100);

      // 2. Verify device was discovered and saved in collection
      const device = await Device.findOne({ macAddress: mac });
      expect(device).not.toBeNull();
      expect(device?.status).toEqual('online');
      expect(device?.rssi).toEqual(-62);
      expect(device?.batteryPercentage).toEqual(92);
      expect(device?.firmwareVersion).toEqual('1.0.8');
    });
  });

  describe('Watchdog Device Sweeper sweeps', () => {
    it('should set online devices and bound seats to offline on missed heartbeats', async () => {
      const mac = '24:0A:C4:8B:88:FC';

      // 1. Create online device
      const device = await Device.create({
        macAddress: mac,
        deviceName: 'Watchdog Target Sensor',
        status: 'online',
        rssi: -50,
        firmwareVersion: '1.0.0',
        lastHeartbeat: new Date(Date.now() - 500) // Missed threshold (timeout=100ms)
      });

      // 2. Create seat bound to this device
      const seat = await Seat.create({
        seatNumber: 'S-200',
        floorId: new mongoose.Types.ObjectId(floorId),
        roomName: 'Main Zone',
        coordinates: { x: 4, y: 4 },
        status: 'vacant',
        deviceId: device._id
      });

      // 3. Sleep to let watchdog sweep (interval=50ms)
      await sleep(150);

      // 4. Verify device and seat statuses are updated to offline
      const checkDevice = await Device.findById(device._id);
      expect(checkDevice?.status).toEqual('offline');

      const checkSeat = await Seat.findById(seat._id);
      expect(checkSeat?.status).toEqual('offline');
    });
  });
});
