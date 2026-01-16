// =============================================================================
// GATEMATE ESP32 Firmware - Safety Monitor Module
// =============================================================================

#ifndef SAFETY_H
#define SAFETY_H

#include <Arduino.h>
#include <esp_task_wdt.h>
#include <Preferences.h>
#include "config.h"

// =============================================================================
// Safety Event Codes
// =============================================================================

enum SafetyEvent {
  SAFETY_OK = 0,
  SAFETY_TIMEOUT = 1,
  SAFETY_OBSTACLE = 2,
  SAFETY_CURRENT_OVERLOAD = 3,
  SAFETY_OVERHEAT = 4,
  SAFETY_LIMIT_SWITCH = 5,
  SAFETY_WATCHDOG = 6,
  SAFETY_MANUAL_STOP = 7,
};

// =============================================================================
// Safety Monitor Class
// =============================================================================

class SafetyMonitor {
private:
  Preferences preferences;
  
  // Operation tracking
  unsigned long operationStartTime = 0;
  bool operationInProgress = false;
  
  // Safety thresholds (can be adjusted via config)
  unsigned long maxOperationTime = GATE_TIMEOUT_MS;
  float maxCurrent = CURRENT_THRESHOLD_STALL;
  float maxTemperature = TEMP_SHUTDOWN;
  float warningTemperature = TEMP_WARNING;
  
  // Failure counters
  uint8_t consecutiveFailures = 0;
  const uint8_t MAX_CONSECUTIVE_FAILURES = 3;
  
  // Last safety event
  SafetyEvent lastEvent = SAFETY_OK;
  String lastEventMessage = "";
  
  // Relay control callback
  void (*stopCallback)() = nullptr;
  
public:
  // =============================================================================
  // Initialization
  // =============================================================================
  
  void begin(void (*onStop)()) {
    stopCallback = onStop;
    
    // Initialize watchdog timer (5 seconds)
    esp_task_wdt_init(WATCHDOG_TIMEOUT_S, true);
    esp_task_wdt_add(NULL);
    
    // Load saved thresholds from preferences
    preferences.begin("safety", false);
    maxOperationTime = preferences.getULong("maxOpTime", GATE_TIMEOUT_MS);
    maxCurrent = preferences.getFloat("maxCurrent", CURRENT_THRESHOLD_STALL);
    maxTemperature = preferences.getFloat("maxTemp", TEMP_SHUTDOWN);
    preferences.end();
    
    Serial.println("✓ Safety monitor initialized");
    Serial.printf("  Max operation time: %lu ms\n", maxOperationTime);
    Serial.printf("  Max current: %.2f A\n", maxCurrent);
    Serial.printf("  Max temperature: %.1f °C\n", maxTemperature);
  }
  
  // =============================================================================
  // Watchdog Management
  // =============================================================================
  
  void feedWatchdog() {
    esp_task_wdt_reset();
  }
  
  // =============================================================================
  // Operation Tracking
  // =============================================================================
  
  void startOperation() {
    operationStartTime = millis();
    operationInProgress = true;
    lastEvent = SAFETY_OK;
    lastEventMessage = "";
    Serial.println("[Safety] Operation started");
  }
  
  void endOperation(bool success = true) {
    operationInProgress = false;
    operationStartTime = 0;
    
    if (success) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        Serial.println("[Safety] Too many consecutive failures - entering safe mode");
        enterSafeMode();
      }
    }
    
    Serial.println("[Safety] Operation ended");
  }
  
  // =============================================================================
  // Safety Checks
  // =============================================================================
  
  SafetyEvent checkAll(float current, float temperature, bool obstacleDetected) {
    feedWatchdog();
    
    // Check operation timeout
    if (checkOperationTimeout()) {
      return lastEvent;
    }
    
    // Check obstacle
    if (checkObstacle(obstacleDetected)) {
      return lastEvent;
    }
    
    // Check current overload
    if (checkCurrentOverload(current)) {
      return lastEvent;
    }
    
    // Check temperature
    if (checkOverheat(temperature)) {
      return lastEvent;
    }
    
    return SAFETY_OK;
  }
  
  bool checkOperationTimeout() {
    if (!operationInProgress) return false;
    
    if (millis() - operationStartTime > maxOperationTime) {
      triggerSafetyStop(SAFETY_TIMEOUT, "Operation timeout exceeded");
      return true;
    }
    return false;
  }
  
  bool checkObstacle(bool detected) {
    if (detected && ENABLE_OBSTACLE_DETECT) {
      triggerSafetyStop(SAFETY_OBSTACLE, "Obstacle detected in gate path");
      return true;
    }
    return false;
  }
  
  bool checkCurrentOverload(float current) {
    if (current > maxCurrent && ENABLE_CURRENT_MONITOR) {
      triggerSafetyStop(SAFETY_CURRENT_OVERLOAD, 
        String("Current overload: ") + String(current, 2) + "A");
      return true;
    }
    return false;
  }
  
  bool checkOverheat(float temperature) {
    if (!ENABLE_TEMP_MONITOR) return false;
    
    if (temperature > maxTemperature) {
      triggerSafetyStop(SAFETY_OVERHEAT, 
        String("Overheat: ") + String(temperature, 1) + "°C");
      return true;
    }
    
    if (temperature > warningTemperature) {
      Serial.printf("[Safety] Warning: Temperature high (%.1f°C)\n", temperature);
    }
    
    return false;
  }
  
  // =============================================================================
  // Limit Switch Handling
  // =============================================================================
  
  bool checkLimitSwitches(bool openLimit, bool closeLimit, bool isOpening) {
    if (isOpening && openLimit) {
      Serial.println("[Safety] Open limit switch triggered");
      return true;
    }
    if (!isOpening && closeLimit) {
      Serial.println("[Safety] Close limit switch triggered");
      return true;
    }
    return false;
  }
  
  // =============================================================================
  // Emergency Stop
  // =============================================================================
  
  void triggerSafetyStop(SafetyEvent event, const String& message) {
    lastEvent = event;
    lastEventMessage = message;
    
    Serial.printf("[Safety] EMERGENCY STOP - Event: %d, Message: %s\n", 
                  event, message.c_str());
    
    // Call the stop callback
    if (stopCallback) {
      stopCallback();
    }
    
    endOperation(false);
    
    // Log the event
    logSafetyEvent(event, message);
  }
  
  void manualStop() {
    triggerSafetyStop(SAFETY_MANUAL_STOP, "Manual emergency stop activated");
  }
  
  // =============================================================================
  // Safe Mode
  // =============================================================================
  
  void enterSafeMode() {
    Serial.println("[Safety] Entering SAFE MODE - all operations disabled");
    
    // Disable all relays
    digitalWrite(RELAY_OPEN, LOW);
    digitalWrite(RELAY_CLOSE, LOW);
    
    // Save safe mode flag
    preferences.begin("safety", false);
    preferences.putBool("safeMode", true);
    preferences.putString("safeModeReason", lastEventMessage);
    preferences.end();
    
    // Could trigger notification here
  }
  
  bool isInSafeMode() {
    preferences.begin("safety", true);
    bool safeMode = preferences.getBool("safeMode", false);
    preferences.end();
    return safeMode;
  }
  
  void exitSafeMode() {
    preferences.begin("safety", false);
    preferences.putBool("safeMode", false);
    preferences.remove("safeModeReason");
    preferences.end();
    
    consecutiveFailures = 0;
    Serial.println("[Safety] Exited safe mode");
  }
  
  // =============================================================================
  // Event Logging
  // =============================================================================
  
  void logSafetyEvent(SafetyEvent event, const String& message) {
    // Store in preferences for persistence
    preferences.begin("safety", false);
    
    // Keep last 10 events
    String key = "event_" + String(millis() % 10);
    String eventData = String(event) + "|" + String(millis()) + "|" + message;
    preferences.putString(key.c_str(), eventData);
    
    preferences.end();
  }
  
  // =============================================================================
  // Getters
  // =============================================================================
  
  SafetyEvent getLastEvent() { return lastEvent; }
  String getLastEventMessage() { return lastEventMessage; }
  bool isOperating() { return operationInProgress; }
  uint8_t getFailureCount() { return consecutiveFailures; }
  
  // =============================================================================
  // Configuration
  // =============================================================================
  
  void setMaxOperationTime(unsigned long ms) {
    maxOperationTime = ms;
    preferences.begin("safety", false);
    preferences.putULong("maxOpTime", ms);
    preferences.end();
  }
  
  void setMaxCurrent(float amps) {
    maxCurrent = amps;
    preferences.begin("safety", false);
    preferences.putFloat("maxCurrent", amps);
    preferences.end();
  }
  
  void setMaxTemperature(float celsius) {
    maxTemperature = celsius;
    preferences.begin("safety", false);
    preferences.putFloat("maxTemp", celsius);
    preferences.end();
  }
};

#endif // SAFETY_H
