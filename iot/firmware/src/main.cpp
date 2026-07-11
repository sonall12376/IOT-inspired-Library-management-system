/**
 * SmartLibrary AI - ESP32 Firmware
 * Hardware: ESP32 + HC-SR04 Ultrasonic Distance Sensor or IR Presence Sensor
 * Protocol: MQTT over TCP (WiFi)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi Settings
const char* ssid = "CAMPUS_WIFI_SSID";
const char* password = "WIFI_PASSWORD_KEY";

// MQTT Broker Settings
const char* mqtt_server = "192.168.1.100"; // Replace with your production server IP/domain
const int mqtt_port = 1883;
const char* mqtt_user = "ESP32_SEAT_001";
const char* mqtt_pass = "device_token_key_abc123";

// Seat Mapping Metadata
const char* floor_num = "1";
const char* room_slug = "silent_zone";
const char* seat_num = "S-101";

// Hardware Pins (HC-SR04 Ultrasonic Sensor)
const int triggerPin = 5;
const int echoPin = 18;

// Threshold for physical presence in centimeters
const int occupancyThresholdCm = 80;
const int debounceIntervalMs = 5000; // 5 seconds debounce filter

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// State tracking variables
bool currentOccupancyState = false;
unsigned long lastStateChangeTime = 0;
unsigned long lastHeartbeatTime = 0;
char statusTopic[128];
char heartbeatTopic[128];
String macStr;

void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to SSID: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected successfully.");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  macStr = WiFi.macAddress();
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Create client ID based on MAC address
    String clientId = "ESP32Client-" + macStr;
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Connected to broker.");
    } else {
      Serial.print("Failed to connect, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

long getDistance() {
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  long distanceCm = duration * 0.034 / 2;
  return distanceCm;
}

void sendStatus(bool occupied, long distance) {
  StaticJsonDocument<256> doc;
  doc["macAddress"] = macStr;
  doc["occupied"] = occupied;
  doc["sensorDistanceCm"] = distance;
  doc["timestamp"] = millis() / 1000;

  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  mqttClient.publish(statusTopic, jsonBuffer, true);
  Serial.print("Status telemetry published: ");
  Serial.println(jsonBuffer);
}

void sendHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["status"] = "online";
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = "1.0.0";
  doc["uptimeSeconds"] = millis() / 1000;

  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);
  
  mqttClient.publish(heartbeatTopic, jsonBuffer, false);
  Serial.print("Heartbeat telemetry published: ");
  Serial.println(jsonBuffer);
}

void setup() {
  Serial.begin(115200);
  pinMode(triggerPin, OUTPUT);
  pinMode(echoPin, INPUT);

  setupWifi();
  mqttClient.setServer(mqtt_server, mqtt_port);

  // Formulate topics paths
  sprintf(statusTopic, "library/floors/%s/rooms/%s/seats/%s/status", floor_num, room_slug, seat_num);
  sprintf(heartbeatTopic, "library/devices/%s/heartbeat", macStr.c_str());
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  // Read sensor and check occupancy threshold
  long distance = getDistance();
  bool rawOccupancy = (distance > 0 && distance < occupancyThresholdCm);
  unsigned long now = millis();

  // Debounce logic: Status must stay stable for debounceIntervalMs before committing changes
  if (rawOccupancy != currentOccupancyState) {
    if (now - lastStateChangeTime > debounceIntervalMs) {
      currentOccupancyState = rawOccupancy;
      lastStateChangeTime = now;
      sendStatus(currentOccupancyState, distance);
    }
  } else {
    // Reset state change counter if reading goes back to match active state
    lastStateChangeTime = now;
  }

  // Publish heartbeat every 60 seconds
  if (now - lastHeartbeatTime > 60000 || lastHeartbeatTime == 0) {
    lastHeartbeatTime = now;
    sendHeartbeat();
  }

  delay(1000); // Poll distance sensor every second
}
