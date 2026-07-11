/**
 * SmartLibrary AI - Mock IoT Seat Sensor Simulator
 * Simulates multiple ESP32 clients reporting status updates and heartbeats to the MQTT Broker.
 */

const mqtt = require('mqtt');

const BROKER_URL = process.argv[2] || 'mqtt://localhost:1883';
const CLIENT_COUNT = parseInt(process.argv[3]) || 5;

console.log(`Starting SmartLibrary AI IoT Simulator...`);
console.log(`Connecting to broker: ${BROKER_URL}`);
console.log(`Simulating ${CLIENT_COUNT} seats...`);

const clients = [];

// Sample details
const seats = Array.from({ length: CLIENT_COUNT }, (_, index) => {
  const seatId = index + 1;
  const floor = 1;
  const room = 'main_hall';
  const pad = String(seatId).padStart(3, '0');
  const mac = `24:0A:C4:8B:${String(seatId.toString(16)).toUpperCase().padStart(2, '0')}:FC`;
  
  return {
    seatNumber: `S-${pad}`,
    floor,
    room,
    macAddress: mac,
    topicStatus: `library/floors/${floor}/rooms/${room}/seats/S-${pad}/status`,
    topicHeartbeat: `library/devices/${mac}/heartbeat`,
    occupied: false,
    rssi: -50 - Math.floor(Math.random() * 30),
    battery: 100 - Math.floor(Math.random() * 20),
    firmware: '1.0.4'
  };
});

// Setup connection for each mock node
seats.forEach((seat) => {
  const client = mqtt.connect(BROKER_URL, {
    clientId: `esp32_${seat.macAddress.replace(/:/g, '')}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000
  });

  client.on('connect', () => {
    console.log(`[Sensor ${seat.seatNumber}] Connected to broker. MAC: ${seat.macAddress}`);
    
    // Publish initial online heartbeat
    sendHeartbeat(client, seat);
    // Publish initial status (vacant)
    sendStatus(client, seat);

    // Schedule regular heartbeat (every 30s for testing speed)
    setInterval(() => {
      sendHeartbeat(client, seat);
    }, 30000);

    // Random status updates (every 10s to 60s)
    scheduleRandomStatusChange(client, seat);
  });

  client.on('error', (err) => {
    console.error(`[Sensor ${seat.seatNumber}] Connection error:`, err.message);
  });

  clients.push(client);
});

function sendHeartbeat(client, seat) {
  const payload = {
    status: 'online',
    rssi: seat.rssi + Math.floor(Math.random() * 6) - 3, // slightly fluctuating RSSI
    batteryPercentage: seat.battery,
    firmwareVersion: seat.firmware,
    uptimeSeconds: Math.floor(process.uptime())
  };
  client.publish(seat.topicHeartbeat, JSON.stringify(payload), { qos: 0 });
}

function sendStatus(client, seat) {
  const payload = {
    macAddress: seat.macAddress,
    occupied: seat.occupied,
    sensorDistanceCm: seat.occupied ? Math.floor(Math.random() * 20) + 10 : 150,
    timestamp: Math.floor(Date.now() / 1000)
  };
  client.publish(seat.topicStatus, JSON.stringify(payload), { qos: 1 });
  console.log(`[Sensor ${seat.seatNumber}] Published state: ${seat.occupied ? 'Occupied' : 'Vacant'}`);
}

function scheduleRandomStatusChange(client, seat) {
  const delay = Math.floor(Math.random() * 30000) + 15000; // 15-45 seconds
  setTimeout(() => {
    seat.occupied = !seat.occupied;
    sendStatus(client, seat);
    scheduleRandomStatusChange(client, seat);
  }, delay);
}

// Clean shutdown on exit
process.on('SIGINT', () => {
  console.log('\nShutting down simulated sensors...');
  clients.forEach((c) => c.end());
  process.exit(0);
});
