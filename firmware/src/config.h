#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// GATEMATE ESP32 Firmware Configuration
// =============================================================================

// Device Information
#define DEVICE_NAME         "GATEMATE-001"
#define FIRMWARE_VERSION    "2.0.4"
#define MANUFACTURER        "Smart Gate Solutions"

// =============================================================================
// GPIO Pin Definitions
// =============================================================================

// Relay Control Pins
#define RELAY_OPEN          16    // GPIO16 - Open gate relay
#define RELAY_CLOSE         17    // GPIO17 - Close gate relay

// Status Indicators
#define STATUS_LED          2     // GPIO2 - Built-in LED
#define BUZZER_PIN          4     // GPIO4 - Optional buzzer

// Physical Buttons
#define BUTTON_OPEN         0     // GPIO0 - BOOT button for open
#define BUTTON_CLOSE        15    // GPIO15 - Close button
#define BUTTON_STOP         13    // GPIO13 - Emergency stop
#define BUTTON_RESET        12    // GPIO12 - Factory reset (hold 10s)

// Sensor Inputs (ADC)
#define CURRENT_SENSOR      34    // GPIO34 - ACS712 current sensor
#define VOLTAGE_SENSOR      35    // GPIO35 - Voltage divider
#define TEMP_SENSOR         32    // GPIO32 - Thermistor/DS18B20
#define OBSTACLE_SENSOR     33    // GPIO33 - IR obstacle detector

// Limit Switches
#define LIMIT_OPEN          25    // GPIO25 - Fully open limit switch
#define LIMIT_CLOSE         26    // GPIO26 - Fully closed limit switch

// =============================================================================
// Safety Parameters
// =============================================================================

// Timing (milliseconds)
#define GATE_TIMEOUT_MS         30000   // Max operation time (30s)
#define DEBOUNCE_DELAY_MS       50      // Button debounce
#define WATCHDOG_TIMEOUT_S      60      // Watchdog timer (seconds)
#define OBSTACLE_CHECK_MS       100     // Obstacle detection interval
#define SENSOR_READ_INTERVAL    1000    // Sensor reading interval

// Current Limits (Amps)
#define CURRENT_THRESHOLD_OPEN  5.0     // Max current during open
#define CURRENT_THRESHOLD_CLOSE 5.5     // Max current during close
#define CURRENT_THRESHOLD_STALL 7.0     // Stall detection threshold

// Temperature Limits (Celsius)
#define TEMP_WARNING            60.0    // Warning temperature
#define TEMP_SHUTDOWN           75.0    // Emergency shutdown temp

// =============================================================================
// Network Configuration
// =============================================================================

// WiFi AP Mode (fallback)
#define AP_SSID             "GATEMATE-SETUP"
#define AP_PASSWORD         "12345678"
#define AP_CHANNEL          1
#define AP_HIDDEN           false
#define AP_MAX_CONNECTIONS  4

// Web Server
#define WEB_SERVER_PORT     80
#define WS_PORT             81

// MQTT Broker
#define MQTT_SERVER         "mqtt.gatemate.local"
#define MQTT_PORT           1883
#define MQTT_USER           ""
#define MQTT_PASSWORD       ""
#define MQTT_CLIENT_ID      DEVICE_NAME
#define MQTT_RECONNECT_MS   5000

// MQTT Topics
#define MQTT_TOPIC_PREFIX       "gatemate/devices/"
#define MQTT_TOPIC_STATUS       "/status"
#define MQTT_TOPIC_COMMANDS     "/commands"
#define MQTT_TOPIC_SENSORS      "/sensors"
#define MQTT_TOPIC_OTA          "/ota"

// =============================================================================
// OTA Update Configuration
// =============================================================================

#define OTA_HOSTNAME        DEVICE_NAME
#define OTA_PASSWORD        ""
#define OTA_PORT            3232

// =============================================================================
// API Configuration
// =============================================================================

// Response Codes
#define API_SUCCESS         200
#define API_BAD_REQUEST     400
#define API_UNAUTHORIZED    401
#define API_NOT_FOUND       404
#define API_ERROR           500

// Rate Limiting
#define MAX_REQUESTS_PER_MIN    60
#define COMMAND_COOLDOWN_MS     1000

// =============================================================================
// Feature Flags
// =============================================================================

#define ENABLE_MQTT             true
#define ENABLE_OTA              true
#define ENABLE_HTTPS            false   // Requires certificate
#define ENABLE_LOGGING          true
#define ENABLE_SENSORS          true
#define ENABLE_OBSTACLE_DETECT  true
#define ENABLE_CURRENT_MONITOR  true
#define ENABLE_TEMP_MONITOR     true

#endif // CONFIG_H
