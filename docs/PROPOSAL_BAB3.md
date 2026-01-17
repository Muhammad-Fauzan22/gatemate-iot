# BAB III
# METODOLOGI PERANCANGAN

## 3.1 Diagram Blok Sistem

Sistem GATEMATE terdiri dari beberapa komponen utama yang saling terintegrasi. Diagram blok berikut menunjukkan arsitektur keseluruhan sistem:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARSITEKTUR SISTEM GATEMATE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────────────┐ │
│  │  MOBILE APP  │    │ WEB DASHBOARD│    │      ESP32 CONTROLLER      │ │
│  │(React Native)│    │ (React+Vite) │    │        (Firmware)          │ │
│  │              │    │              │    │                            │ │
│  │ • Dashboard  │    │ • Dashboard  │    │ • Motor Control            │ │
│  │ • Gate Ctrl  │    │ • Gate Ctrl  │    │ • Sensor Reading           │ │
│  │ • Schedule   │    │ • Schedule   │    │ • WiFi/MQTT Communication  │ │
│  │ • Settings   │    │ • Settings   │    │ • Safety Logic             │ │
│  └──────┬───────┘    └──────┬───────┘    └─────────────┬──────────────┘ │
│         │                    │                          │                │
│         └────────────────────┴──────────────────────────┘                │
│                              │                                           │
│                       ┌──────▼──────┐                                    │
│                       │    NGINX    │                                    │
│                       │   (Proxy)   │                                    │
│                       └──────┬──────┘                                    │
│                              │                                           │
│         ┌────────────────────┼────────────────────┐                      │
│         │                    │                    │                      │
│    ┌────▼────┐         ┌─────▼─────┐        ┌─────▼─────┐                │
│    │ BACKEND │         │ MOSQUITTO │        │   REDIS   │                │
│    │(Node.js)│◄───────►│   (MQTT)  │        │  (Cache)  │                │
│    └────┬────┘         └───────────┘        └───────────┘                │
│         │                                                                │
│    ┌────▼────────┐    ┌───────────────┐                                  │
│    │ POSTGRESQL  │    │   FIREBASE    │                                  │
│    │ (Database)  │    │ (Auth/Store)  │                                  │
│    └─────────────┘    └───────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Alur Kerja Sistem:**

1. **User Action:** Pengguna menekan tombol "Open" di aplikasi mobile/web
2. **API Request:** Aplikasi mengirim request ke backend server
3. **MQTT Publish:** Backend mem-publish command ke MQTT broker
4. **Device Receive:** ESP32 menerima command dari MQTT topic
5. **Motor Control:** ESP32 mengaktifkan relay untuk menggerakkan motor
6. **Sensor Monitoring:** ESP32 terus membaca sensor selama operasi
7. **Status Update:** ESP32 publish status terbaru ke MQTT
8. **UI Update:** Aplikasi menerima update dan menampilkan status

---

## 3.2 Perancangan Hardware

### 3.2.1 Skema Rangkaian Controller

**Gambar 3.3 Skema Koneksi ESP32**

```
                         ┌────────────────────────────────────────┐
                         │           ESP32 DevKit V1              │
                         │                                        │
     ┌───────────────────┼── 3.3V                      VIN ───────┼─── 5V Power
     │                   │                                        │
     │  ┌────────────────┼── GND                       GND ───────┼─── GND Common
     │  │                │                                        │
     │  │  ┌─────────────┼── GPIO16 (RELAY_OPEN)      GPIO34 ─────┼─── Current Sensor
     │  │  │             │                                        │
     │  │  │  ┌──────────┼── GPIO17 (RELAY_CLOSE)     GPIO35 ─────┼─── Voltage Sensor
     │  │  │  │          │                                        │
     │  │  │  │   ┌──────┼── GPIO2 (STATUS_LED)       GPIO32 ─────┼─── Temp Sensor
     │  │  │  │   │      │                                        │
     │  │  │  │   │      │                            GPIO33 ─────┼─── Obstacle Sensor
     │  │  │  │   │      │                                        │
     │  │  │  │   │      │   GPIO0 (BUTTON_OPEN)      GPIO25 ─────┼─── Limit Open
     │  │  │  │   │      │                                        │
     │  │  │  │   │      │   GPIO15 (BUTTON_CLOSE)    GPIO26 ─────┼─── Limit Close
     │  │  │  │   │      │                                        │
     │  │  │  │   │      │   GPIO13 (BUTTON_STOP)     GPIO4 ──────┼─── Buzzer
     │  │  │  │   │      │                                        │
     │  │  │  │   │      │   GPIO12 (BUTTON_RESET)                │
     │  │  │  │   │      │                                        │
     │  │  │  │   │      └────────────────────────────────────────┘
     │  │  │  │   │
     │  │  │  │   └────────── LED Status (Built-in GPIO2)
     │  │  │  │
     │  │  │  └── ┌─────────────┐
     │  │  │      │ RELAY 2CH   │
     │  │  └─────►│ IN2 ════════╪═══► Motor Close (-)
     │  │         │             │
     │  └────────►│ IN1 ════════╪═══► Motor Open (+)
     │            │             │
     └───────────►│ VCC         │
                  │ GND         │
                  └─────────────┘
```

### 3.2.2 Tabel Pin Mapping

**Tabel 3.1 Pin Mapping ESP32**

| GPIO | Fungsi | Mode | Keterangan |
|------|--------|------|------------|
| GPIO16 | RELAY_OPEN | Output | Relay untuk buka gerbang |
| GPIO17 | RELAY_CLOSE | Output | Relay untuk tutup gerbang |
| GPIO2 | STATUS_LED | Output | LED indikator built-in |
| GPIO4 | BUZZER | Output | Buzzer alarm |
| GPIO0 | BUTTON_OPEN | Input Pullup | Tombol buka manual |
| GPIO15 | BUTTON_CLOSE | Input Pullup | Tombol tutup manual |
| GPIO13 | BUTTON_STOP | Input Pullup | Tombol stop darurat |
| GPIO12 | BUTTON_RESET | Input Pullup | Factory reset (10 detik) |
| GPIO34 | CURRENT_SENSOR | ADC Input | Sensor arus ACS712 |
| GPIO35 | VOLTAGE_SENSOR | ADC Input | Voltage divider |
| GPIO32 | TEMP_SENSOR | ADC Input | NTC Thermistor |
| GPIO33 | OBSTACLE_SENSOR | Digital Input | IR obstacle detector |
| GPIO25 | LIMIT_OPEN | Input Pullup | Limit switch posisi terbuka |
| GPIO26 | LIMIT_CLOSE | Input Pullup | Limit switch posisi tertutup |

### 3.2.3 Daftar Komponen

**Tabel 3.2 Daftar Komponen Controller**

| No | Komponen | Spesifikasi | Qty | Harga | Total |
|----|----------|-------------|-----|-------|-------|
| 1 | ESP32 DevKit V1 | 30-pin, Dual Core | 1 | Rp 65.000 | Rp 65.000 |
| 2 | Relay Module 2CH | 5V, Optocoupler | 1 | Rp 25.000 | Rp 25.000 |
| 3 | ACS712-30A | Current Sensor | 1 | Rp 25.000 | Rp 25.000 |
| 4 | E18-D80NK | IR Obstacle | 2 | Rp 20.000 | Rp 40.000 |
| 5 | Limit Switch | Micro NO/NC | 2 | Rp 5.000 | Rp 10.000 |
| 6 | Push Button 12mm | Momentary | 3 | Rp 5.000 | Rp 15.000 |
| 7 | LED RGB 5mm | Indicator | 2 | Rp 2.500 | Rp 5.000 |
| 8 | Buzzer 5V | Active | 1 | Rp 5.000 | Rp 5.000 |
| 9 | Power Supply | 5V 3A | 1 | Rp 35.000 | Rp 35.000 |
| 10 | Project Box | 150x100x50mm | 1 | Rp 30.000 | Rp 30.000 |
| 11 | Kabel AWG22 | 10m, 4 warna | 1 | Rp 50.000 | Rp 50.000 |
| 12 | Terminal Block | 2-pin | 10 | Rp 1.500 | Rp 15.000 |
| 13 | Heat Shrink | Assorted | 1 set | Rp 15.000 | Rp 15.000 |
| | **SUBTOTAL** | | | | **Rp 335.000** |

**Tabel 3.3 Opsi Motor Gerbang**

| Opsi | Jenis Motor | Spesifikasi | Harga |
|------|-------------|-------------|-------|
| A | Motor DC 24V | 50W dengan gearbox | Rp 200.000 |
| B | Motor Wiper | 12V, daur ulang | Rp 150.000 |
| C | Motor AC | 220V 50W | Rp 400.000 |
| D | Sliding Gate Kit | Lengkap dengan rel | Rp 3.500.000 |

---

## 3.3 Perancangan Software

### 3.3.1 Flowchart Firmware ESP32

```
                    ┌─────────────┐
                    │    START    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Init GPIO  │
                    │  Init WiFi  │
                    │  Init MQTT  │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │      MAIN LOOP          │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │  Check  │       │  Check  │       │  Check  │
    │ Buttons │       │  MQTT   │       │ Sensors │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
    │ Command │       │ Command │       │ Safety  │
    │ Handler │       │ Handler │       │  Check  │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Update Gate │
                    │   Position  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Publish    │
                    │   Status    │
                    └──────┬──────┘
                           │
                           └───────────► (Loop)
```

### 3.3.2 API Endpoints

**Tabel 3.4 API Endpoints ESP32**

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Info device dan daftar endpoint |
| GET | `/status` | Status gerbang dan sensor |
| GET/POST | `/open` | Membuka gerbang |
| GET/POST | `/close` | Menutup gerbang |
| GET/POST | `/stop` | Menghentikan gerbang |
| POST | `/partial` | Partial open (persentase) |
| GET | `/config` | Konfigurasi device |
| POST | `/factory-reset` | Reset ke pengaturan awal |
| GET | `/update` | OTA firmware update page |

### 3.3.3 Struktur Aplikasi PWA

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # Header, Sidebar, Layout
│   │   ├── pwa/             # Install Prompt, iOS Guide
│   │   └── ui/              # Button, Card, Input
│   ├── pages/
│   │   ├── Dashboard.tsx    # Halaman utama
│   │   ├── GateControl.tsx  # Kontrol gerbang
│   │   ├── Schedule.tsx     # Penjadwalan
│   │   └── Settings.tsx     # Pengaturan
│   ├── services/
│   │   ├── firebase/        # Auth & Firestore
│   │   └── api.ts           # API calls
│   ├── stores/
│   │   ├── authStore.ts     # State autentikasi
│   │   └── gateStore.ts     # State gerbang
│   └── main.tsx             # Entry point
├── public/
│   ├── icons/               # PWA icons
│   └── manifest.json        # PWA manifest
└── vite.config.ts           # Vite + PWA config
```

---

## 3.4 Prosedur Pengujian

### 3.4.1 Pengujian Fungsional

**Tabel 3.5 Test Case Pengujian Fungsional**

| No | Test Case | Prosedur | Expected Result | Status |
|----|-----------|----------|-----------------|--------|
| 1 | Buka via App | Tap "Open" di aplikasi | Motor berputar CW, gerbang terbuka | |
| 2 | Tutup via App | Tap "Close" di aplikasi | Motor berputar CCW, gerbang tertutup | |
| 3 | Stop | Tap "Stop" saat moving | Motor berhenti segera | |
| 4 | Button Open | Tekan tombol fisik OPEN | Gerbang terbuka | |
| 5 | Button Close | Tekan tombol fisik CLOSE | Gerbang tertutup | |
| 6 | Button Stop | Tekan tombol fisik STOP | Motor berhenti | |
| 7 | Limit Open | Gerbang sampai posisi max | Motor stop otomatis | |
| 8 | Limit Close | Gerbang sampai posisi min | Motor stop otomatis | |
| 9 | Partial Open | Set ke 50% | Gerbang buka setengah | |
| 10 | Schedule | Set jadwal buka 07:00 | Gerbang buka jam 07:00 | |

### 3.4.2 Pengujian Keamanan (Safety)

**Tabel 3.6 Test Case Pengujian Keamanan**

| No | Test Case | Prosedur | Expected Result | Status |
|----|-----------|----------|-----------------|--------|
| 1 | Obstacle Detection | Letakkan objek di jalur | Motor stop, buzzer bunyi | |
| 2 | Current Overload | Tahan gerbang (stall) | Motor stop < 3 detik | |
| 3 | Timeout | Biarkan motor > 30 detik | Motor stop otomatis | |
| 4 | Temperature | Panaskan sensor > 75°C | Emergency shutdown | |
| 5 | WiFi Disconnect | Putus koneksi WiFi | Fallback ke AP mode | |
| 6 | Power Failure | Cabut power, pasang lagi | System recovery normal | |

### 3.4.3 Pengujian Performa

| Parameter | Target | Metode Pengukuran |
|-----------|--------|-------------------|
| Response Time | < 500ms | Timestamp log |
| Uptime | > 99% | Monitoring 7 hari |
| Current Accuracy | ±0.5A | Perbandingan dengan clamp meter |
| WiFi Range | > 20m | Test di berbagai jarak |

---
