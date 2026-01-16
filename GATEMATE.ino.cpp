// GATEMATE v1.0 - Firmware untuk ESP32
#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>

const char* ap_ssid = "GATEMATE-SETUP";
const char* ap_password = "12345678";

WebServer server(80);

#define RELAY_OPEN 16   // GPIO16 untuk BUKA
#define RELAY_CLOSE 17  // GPIO17 untuk TUTUP
#define STATUS_LED 2    // GPIO2 (LED built-in)

String saved_ssid = "";
String saved_password = "";
bool gateMoving = false;

void handleRoot() {
  String html = "<html><body>";
  html += "<h1>GATEMATE Controller</h1>";
  html += "<p><a href='/open'>🔓 BUKA GERBANG</a></p>";
  html += "<p><a href='/close'>🔒 TUTUP GERBANG</a></p>";
  html += "<p><a href='/stop'>🛑 STOP</a></p>";
  html += "<p><a href='/wifi'>📶 Setup WiFi</a></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void openGate() {
  digitalWrite(RELAY_CLOSE, LOW);
  digitalWrite(RELAY_OPEN, HIGH);
  gateMoving = true;
  server.send(200, "text/plain", "Gerbang membuka...");
  delay(30000); // Safety timeout 30 detik
  stopGate();
}

void closeGate() {
  digitalWrite(RELAY_OPEN, LOW);
  digitalWrite(RELAY_CLOSE, HIGH);
  gateMoving = true;
  server.send(200, "text/plain", "Gerbang menutup...");
  delay(30000); // Safety timeout 30 detik
  stopGate();
}

void stopGate() {
  digitalWrite(RELAY_OPEN, LOW);
  digitalWrite(RELAY_CLOSE, LOW);
  gateMoving = false;
  server.send(200, "text/plain", "Gerbang berhenti");
}

void setupWiFiPage() {
  String html = "<html><body>";
  html += "<h1>Setup WiFi</h1>";
  html += "<form action='/savewifi' method='POST'>";
  html += "SSID: <input type='text' name='ssid'><br>";
  html += "Password: <input type='password' name='password'><br>";
  html += "<input type='submit' value='Simpan'>";
  html += "</form>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void saveWiFi() {
  saved_ssid = server.arg("ssid");
  saved_password = server.arg("password");
  
  EEPROM.begin(512);
  EEPROM.writeString(0, saved_ssid);
  EEPROM.writeString(100, saved_password);
  EEPROM.end();
  
  server.send(200, "text/plain", "WiFi tersimpan! Restarting...");
  delay(2000);
  ESP.restart();
}

void setup() {
  Serial.begin(115200);
  
  pinMode(RELAY_OPEN, OUTPUT);
  pinMode(RELAY_CLOSE, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  digitalWrite(RELAY_OPEN, LOW);
  digitalWrite(RELAY_CLOSE, LOW);
  
  // Setup Access Point mode
  WiFi.softAP(ap_ssid, ap_password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);
  
  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/open", openGate);
  server.on("/close", closeGate);
  server.on("/stop", stopGate);
  server.on("/wifi", setupWiFiPage);
  server.on("/savewifi", HTTP_POST, saveWiFi);
  
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  digitalWrite(STATUS_LED, HIGH);
  delay(500);
  digitalWrite(STATUS_LED, LOW);
  delay(500);
}