// =============================================================================
// GATEMATE ESP32 Firmware - Main Entry Point
// Version: 2.0.4
// =============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <WiFiManager.h>
#include <PubSubClient.h>
#include <ElegantOTA.h>
#include "config.h"

// =============================================================================
// Global Objects
// =============================================================================

WebServer server(WEB_SERVER_PORT);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
WiFiManager wifiManager;

// =============================================================================
// State Variables
// =============================================================================

enum GateState {
  GATE_CLOSED = 0,
  GATE_OPENING = 1,
  GATE_OPEN = 2,
  GATE_CLOSING = 3,
  GATE_STOPPED = 4,
  GATE_ERROR = 5
};

struct DeviceState {
  GateState gateState = GATE_CLOSED;
  uint8_t percentage = 0;
  bool isOnline = true;
  bool obstacleDetected = false;
  unsigned long lastActivity = 0;
  unsigned long operationStartTime = 0;
};

struct SensorData {
  float current = 0.0;
  float voltage = 0.0;
  float temperature = 0.0;
  int wifiSignal = 0;
};

DeviceState deviceState;
SensorData sensorData;
unsigned long lastSensorRead = 0;
unsigned long lastMqttReconnect = 0;
unsigned long lastCommandTime = 0;

// =============================================================================
// Function Prototypes
// =============================================================================

void setupGPIO();
void setupWiFi();
void setupMQTT();
void setupWebServer();
void setupOTA();
void handleRoot();
void handleStatus();
void handleOpen();
void handleClose();
void handleStop();
void handlePartial();
void handleConfig();
void handleFactoryReset();
void sendJsonResponse(int code, const char* status, const char* message);
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void publishStatus();
void publishSensors();
void readSensors();
void updateGatePosition();
void checkSafetyConditions();
void stopGate();
void openGate();
void closeGate();
void setGatePercentage(uint8_t percent);
String getStateString(GateState state);

// =============================================================================
// Setup
// =============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("   GATEMATE Smart Gate Controller");
  Serial.printf("   Firmware: %s\n", FIRMWARE_VERSION);
  Serial.println("========================================\n");

  // Initialize GPIO
  setupGPIO();
  
  // Initialize WiFi
  setupWiFi();
  
  // Initialize MQTT
  if (ENABLE_MQTT) {
    setupMQTT();
  }
  
  // Initialize Web Server
  setupWebServer();
  
  // Initialize OTA
  if (ENABLE_OTA) {
    setupOTA();
  }
  
  // Enable watchdog
  esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
  esp_task_wdt_add(NULL);
  
  Serial.println("✓ System initialization complete");
  Serial.printf("  IP Address: %s\n", WiFi.localIP().toString().c_str());
}

// =============================================================================
// Main Loop
// =============================================================================

void loop() {
  // Reset watchdog
  esp_task_wdt_reset();
  
  // Handle web server requests
  server.handleClient();
  
  // Handle OTA updates
  if (ENABLE_OTA) {
    ElegantOTA.loop();
  }
  
  // Handle MQTT
  if (ENABLE_MQTT) {
    if (!mqttClient.connected()) {
      reconnectMQTT();
    }
    mqttClient.loop();
  }
  
  // Read sensors periodically
  if (millis() - lastSensorRead >= SENSOR_READ_INTERVAL) {
    readSensors();
    lastSensorRead = millis();
    
    // Publish to MQTT
    if (ENABLE_MQTT && mqttClient.connected()) {
      publishSensors();
    }
  }
  
  // Update gate position during movement
  if (deviceState.gateState == GATE_OPENING || deviceState.gateState == GATE_CLOSING) {
    updateGatePosition();
    checkSafetyConditions();
  }
  
  // Blink status LED based on state
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink >= (WiFi.status() == WL_CONNECTED ? 1000 : 200)) {
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
    lastBlink = millis();
  }
}

// =============================================================================
// GPIO Setup
// =============================================================================

void setupGPIO() {
  // Relay outputs
  pinMode(RELAY_OPEN, OUTPUT);
  pinMode(RELAY_CLOSE, OUTPUT);
  digitalWrite(RELAY_OPEN, LOW);
  digitalWrite(RELAY_CLOSE, LOW);
  
  // Status LED
  pinMode(STATUS_LED, OUTPUT);
  
  // Buttons with pull-up
  pinMode(BUTTON_OPEN, INPUT_PULLUP);
  pinMode(BUTTON_CLOSE, INPUT_PULLUP);
  pinMode(BUTTON_STOP, INPUT_PULLUP);
  pinMode(BUTTON_RESET, INPUT_PULLUP);
  
  // Sensor inputs
  pinMode(CURRENT_SENSOR, INPUT);
  pinMode(VOLTAGE_SENSOR, INPUT);
  pinMode(TEMP_SENSOR, INPUT);
  pinMode(OBSTACLE_SENSOR, INPUT);
  
  // Limit switches
  pinMode(LIMIT_OPEN, INPUT_PULLUP);
  pinMode(LIMIT_CLOSE, INPUT_PULLUP);
  
  Serial.println("✓ GPIO initialized");
}

// =============================================================================
// WiFi Setup
// =============================================================================

void setupWiFi() {
  wifiManager.setConfigPortalBlocking(false);
  wifiManager.setConfigPortalTimeout(180);
  wifiManager.setConnectTimeout(30);
  
  // Custom parameters could be added here
  WiFi.setHostname(DEVICE_NAME);
  
  if (wifiManager.autoConnect(AP_SSID, AP_PASSWORD)) {
    Serial.println("✓ WiFi connected");
  } else {
    Serial.println("⚠ Running in AP mode: " AP_SSID);
  }
}

// =============================================================================
// MQTT Setup
// =============================================================================

void setupMQTT() {
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
  Serial.println("✓ MQTT configured");
}

void reconnectMQTT() {
  if (millis() - lastMqttReconnect < MQTT_RECONNECT_MS) return;
  lastMqttReconnect = millis();
  
  Serial.print("Connecting to MQTT...");
  String clientId = String(MQTT_CLIENT_ID) + "-" + String(random(0xffff), HEX);
  
  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("connected");
    
    // Subscribe to command topic
    String cmdTopic = String(MQTT_TOPIC_PREFIX) + DEVICE_NAME + MQTT_TOPIC_COMMANDS;
    mqttClient.subscribe(cmdTopic.c_str());
    
    // Publish online status
    publishStatus();
  } else {
    Serial.printf("failed (rc=%d)\n", mqttClient.state());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("MQTT: %s -> %s\n", topic, message.c_str());
  
  JsonDocument doc;
  if (deserializeJson(doc, message)) return;
  
  const char* command = doc["command"];
  if (!command) return;
  
  if (strcmp(command, "open") == 0) {
    openGate();
  } else if (strcmp(command, "close") == 0) {
    closeGate();
  } else if (strcmp(command, "stop") == 0) {
    stopGate();
  } else if (strcmp(command, "partial") == 0) {
    uint8_t percent = doc["percentage"] | 50;
    setGatePercentage(percent);
  }
  
  publishStatus();
}

void publishStatus() {
  if (!mqttClient.connected()) return;
  
  JsonDocument doc;
  doc["deviceId"] = DEVICE_NAME;
  doc["state"] = getStateString(deviceState.gateState);
  doc["percentage"] = deviceState.percentage;
  doc["online"] = deviceState.isOnline;
  doc["obstacle"] = deviceState.obstacleDetected;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  
  String topic = String(MQTT_TOPIC_PREFIX) + DEVICE_NAME + MQTT_TOPIC_STATUS;
  mqttClient.publish(topic.c_str(), output.c_str(), true);
}

void publishSensors() {
  if (!mqttClient.connected()) return;
  
  JsonDocument doc;
  doc["deviceId"] = DEVICE_NAME;
  doc["current"] = sensorData.current;
  doc["voltage"] = sensorData.voltage;
  doc["temperature"] = sensorData.temperature;
  doc["wifiSignal"] = sensorData.wifiSignal;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  
  String topic = String(MQTT_TOPIC_PREFIX) + DEVICE_NAME + MQTT_TOPIC_SENSORS;
  mqttClient.publish(topic.c_str(), output.c_str());
}

// =============================================================================
// Web Server Setup
// =============================================================================

void setupWebServer() {
  // API Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/open", HTTP_GET, handleOpen);
  server.on("/open", HTTP_POST, handleOpen);
  server.on("/close", HTTP_GET, handleClose);
  server.on("/close", HTTP_POST, handleClose);
  server.on("/stop", HTTP_GET, handleStop);
  server.on("/stop", HTTP_POST, handleStop);
  server.on("/partial", HTTP_POST, handlePartial);
  server.on("/config", HTTP_GET, handleConfig);
  server.on("/factory-reset", HTTP_POST, handleFactoryReset);
  
  // Enable CORS
  server.enableCORS(true);
  
  server.begin();
  Serial.println("✓ Web server started");
}

void setupOTA() {
  ElegantOTA.begin(&server);
  Serial.println("✓ OTA enabled at /update");
}

// =============================================================================
// API Handlers
// =============================================================================

void handleRoot() {
  JsonDocument doc;
  doc["device"] = DEVICE_NAME;
  doc["version"] = FIRMWARE_VERSION;
  doc["uptime"] = millis() / 1000;
  doc["ip"] = WiFi.localIP().toString();
  
  JsonObject endpoints = doc["endpoints"].to<JsonObject>();
  endpoints["status"] = "/status";
  endpoints["open"] = "/open";
  endpoints["close"] = "/close";
  endpoints["stop"] = "/stop";
  endpoints["partial"] = "/partial";
  endpoints["config"] = "/config";
  endpoints["ota"] = "/update";
  
  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleStatus() {
  JsonDocument doc;
  doc["state"] = getStateString(deviceState.gateState);
  doc["percentage"] = deviceState.percentage;
  doc["online"] = deviceState.isOnline;
  doc["obstacle"] = deviceState.obstacleDetected;
  
  JsonObject sensors = doc["sensors"].to<JsonObject>();
  sensors["current"] = sensorData.current;
  sensors["voltage"] = sensorData.voltage;
  sensors["temperature"] = sensorData.temperature;
  sensors["wifiSignal"] = sensorData.wifiSignal;
  
  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleOpen() {
  if (millis() - lastCommandTime < COMMAND_COOLDOWN_MS) {
    sendJsonResponse(429, "error", "Too many requests");
    return;
  }
  lastCommandTime = millis();
  
  openGate();
  sendJsonResponse(200, "success", "Gate opening");
}

void handleClose() {
  if (millis() - lastCommandTime < COMMAND_COOLDOWN_MS) {
    sendJsonResponse(429, "error", "Too many requests");
    return;
  }
  lastCommandTime = millis();
  
  closeGate();
  sendJsonResponse(200, "success", "Gate closing");
}

void handleStop() {
  stopGate();
  sendJsonResponse(200, "success", "Gate stopped");
}

void handlePartial() {
  if (!server.hasArg("plain")) {
    sendJsonResponse(400, "error", "Missing body");
    return;
  }
  
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    sendJsonResponse(400, "error", "Invalid JSON");
    return;
  }
  
  uint8_t percent = doc["percentage"] | 50;
  if (percent > 100) percent = 100;
  
  setGatePercentage(percent);
  sendJsonResponse(200, "success", "Moving to position");
}

void handleConfig() {
  JsonDocument doc;
  doc["device"] = DEVICE_NAME;
  doc["version"] = FIRMWARE_VERSION;
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();
  doc["ssid"] = WiFi.SSID();
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"] = millis() / 1000;
  
  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleFactoryReset() {
  sendJsonResponse(200, "success", "Resetting...");
  delay(1000);
  wifiManager.resetSettings();
  ESP.restart();
}

void sendJsonResponse(int code, const char* status, const char* message) {
  JsonDocument doc;
  doc["status"] = status;
  doc["message"] = message;
  doc["timestamp"] = millis();
  
  String output;
  serializeJson(doc, output);
  server.send(code, "application/json", output);
}

// =============================================================================
// Gate Control Functions
// =============================================================================

void openGate() {
  if (deviceState.gateState == GATE_OPENING || deviceState.percentage == 100) return;
  
  Serial.println(">> Opening gate");
  deviceState.gateState = GATE_OPENING;
  deviceState.operationStartTime = millis();
  deviceState.lastActivity = millis();
  
  digitalWrite(RELAY_CLOSE, LOW);
  delay(50); // Interlock delay
  digitalWrite(RELAY_OPEN, HIGH);
  
  publishStatus();
}

void closeGate() {
  if (deviceState.gateState == GATE_CLOSING || deviceState.percentage == 0) return;
  
  Serial.println(">> Closing gate");
  deviceState.gateState = GATE_CLOSING;
  deviceState.operationStartTime = millis();
  deviceState.lastActivity = millis();
  
  digitalWrite(RELAY_OPEN, LOW);
  delay(50); // Interlock delay
  digitalWrite(RELAY_CLOSE, HIGH);
  
  publishStatus();
}

void stopGate() {
  Serial.println(">> Stopping gate");
  deviceState.gateState = GATE_STOPPED;
  deviceState.lastActivity = millis();
  
  digitalWrite(RELAY_OPEN, LOW);
  digitalWrite(RELAY_CLOSE, LOW);
  
  publishStatus();
}

void setGatePercentage(uint8_t percent) {
  Serial.printf(">> Setting gate to %d%%\n", percent);
  
  if (percent > deviceState.percentage) {
    openGate();
  } else if (percent < deviceState.percentage) {
    closeGate();
  }
  
  // Target percentage stored for updateGatePosition()
  // In production, use encoder/timer to track actual position
}

void updateGatePosition() {
  // Simulate position update (in production, use encoder or timing)
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate < 300) return;
  lastUpdate = millis();
  
  if (deviceState.gateState == GATE_OPENING) {
    if (deviceState.percentage < 100) {
      deviceState.percentage += 5;
      if (deviceState.percentage >= 100) {
        deviceState.percentage = 100;
        deviceState.gateState = GATE_OPEN;
        stopGate();
      }
    }
  } else if (deviceState.gateState == GATE_CLOSING) {
    if (deviceState.percentage > 0) {
      deviceState.percentage -= 5;
      if (deviceState.percentage == 0) {
        deviceState.gateState = GATE_CLOSED;
        stopGate();
      }
    }
  }
}

void checkSafetyConditions() {
  // Check timeout
  if (millis() - deviceState.operationStartTime > GATE_TIMEOUT_MS) {
    Serial.println("⚠ Safety timeout - stopping");
    stopGate();
    return;
  }
  
  // Check obstacle
  if (ENABLE_OBSTACLE_DETECT && digitalRead(OBSTACLE_SENSOR) == LOW) {
    Serial.println("⚠ Obstacle detected - stopping");
    deviceState.obstacleDetected = true;
    stopGate();
    return;
  } else {
    deviceState.obstacleDetected = false;
  }
  
  // Check current overload
  if (ENABLE_CURRENT_MONITOR && sensorData.current > CURRENT_THRESHOLD_STALL) {
    Serial.println("⚠ Current overload - stopping");
    stopGate();
    return;
  }
  
  // Check temperature
  if (ENABLE_TEMP_MONITOR && sensorData.temperature > TEMP_SHUTDOWN) {
    Serial.println("⚠ Overheating - stopping");
    stopGate();
    return;
  }
  
  // Check limit switches
  if (deviceState.gateState == GATE_OPENING && digitalRead(LIMIT_OPEN) == LOW) {
    deviceState.percentage = 100;
    deviceState.gateState = GATE_OPEN;
    stopGate();
  }
  if (deviceState.gateState == GATE_CLOSING && digitalRead(LIMIT_CLOSE) == LOW) {
    deviceState.percentage = 0;
    deviceState.gateState = GATE_CLOSED;
    stopGate();
  }
}

// =============================================================================
// Sensor Functions
// =============================================================================

void readSensors() {
  // Read current sensor (ACS712)
  int rawCurrent = analogRead(CURRENT_SENSOR);
  sensorData.current = ((rawCurrent * 3.3 / 4095) - 2.5) / 0.066; // 30A version
  if (sensorData.current < 0) sensorData.current = 0;
  
  // Read voltage (voltage divider)
  int rawVoltage = analogRead(VOLTAGE_SENSOR);
  sensorData.voltage = (rawVoltage * 3.3 / 4095) * 11.0; // 10:1 divider
  
  // Read temperature (NTC thermistor approximation)
  int rawTemp = analogRead(TEMP_SENSOR);
  sensorData.temperature = (rawTemp * 3.3 / 4095) * 100; // Simplified
  
  // WiFi signal
  sensorData.wifiSignal = WiFi.RSSI();
}

// =============================================================================
// Utility Functions
// =============================================================================

String getStateString(GateState state) {
  switch (state) {
    case GATE_CLOSED: return "closed";
    case GATE_OPENING: return "opening";
    case GATE_OPEN: return "open";
    case GATE_CLOSING: return "closing";
    case GATE_STOPPED: return "stopped";
    case GATE_ERROR: return "error";
    default: return "unknown";
  }
}
