# 🔧 GATEMATE Hardware Setup Guide

Panduan lengkap untuk merakit sistem GATEMATE dari nol - mulai dari pembelian komponen hingga pemasangan dan konfigurasi.

## 📑 Daftar Isi

- [Daftar Komponen](#-daftar-komponen-bill-of-materials)
- [Total Estimasi Biaya](#-total-estimasi-biaya)
- [Diagram Wiring](#-diagram-wiring)
- [Langkah Perakitan](#-langkah-perakitan)
- [Setup WiFi & Firmware](#-setup-wifi--firmware)
- [Setup CCTV](#-setup-cctv-esp32-cam)
- [Koneksi dengan Mobile App](#-koneksi-dengan-mobile-app)
- [Konfigurasi Keamanan](#-konfigurasi-keamanan)
- [Troubleshooting](#-troubleshooting)

---

## 📋 Daftar Komponen (Bill of Materials)

### 🧠 Komponen Utama (Controller)

| No | Komponen | Spesifikasi | Qty | Perkiraan Harga | Link Pembelian |
|----|----------|-------------|-----|-----------------|----------------|
| 1 | **ESP32 DevKit V1** | 30-pin, WiFi+BT | 1 | Rp 65.000 | [Tokopedia](https://tokopedia.com/search?q=esp32%20devkit) |
| 2 | **Module Relay 2 Channel** | 5V, Optocoupler | 1 | Rp 25.000 | [Tokopedia](https://tokopedia.com/search?q=relay%202%20channel) |
| 3 | **Power Supply 5V 3A** | AC-DC Adapter | 1 | Rp 35.000 | [Tokopedia](https://tokopedia.com/search?q=adaptor%205v%203a) |
| 4 | **Project Box** | 150x100x50mm | 1 | Rp 30.000 | [Tokopedia](https://tokopedia.com/search?q=box%20elektronik) |

### ⚡ Sensor & Safety

| No | Komponen | Spesifikasi | Qty | Perkiraan Harga |
|----|----------|-------------|-----|-----------------|
| 5 | **ACS712 Current Sensor** | 30A | 1 | Rp 25.000 |
| 6 | **IR Obstacle Sensor** | E18-D80NK | 2 | Rp 40.000 |
| 7 | **Limit Switch** | Micro switch NO/NC | 2 | Rp 10.000 |
| 8 | **Push Button** | Momentary, 12mm | 3 | Rp 15.000 |
| 9 | **LED Indicator** | 5mm RGB | 2 | Rp 5.000 |
| 10 | **Buzzer** | 5V Active | 1 | Rp 5.000 |

### 🚪 Motor Gerbang

| Opsi | Komponen | Spesifikasi | Perkiraan Harga |
|------|----------|-------------|-----------------|
| A | **Motor DC 24V** + Driver | 30W, dengan gearbox | Rp 500.000 |
| B | **Motor Wiper Mobil** | 12V DC, Daur ulang | Rp 150.000 |
| C | **AC Motor + Capacitor** | 220V AC, 50W | Rp 400.000 |
| D | **Motor Sliding Gate Kit** | Lengkap dengan rail | Rp 3.500.000 |

### 🔌 Kabel & Konektor

| No | Komponen | Spesifikasi | Qty | Perkiraan Harga |
|----|----------|-------------|-----|-----------------|
| 11 | **Kabel AWG22** | 4 warna, 10m | 1 | Rp 50.000 |
| 12 | **Kabel Power 2x1.5mm** | 10m | 1 | Rp 35.000 |
| 13 | **Terminal Block** | 2-pin, 5.08mm | 10 | Rp 15.000 |
| 14 | **Konektor JST** | 4-pin | 5 | Rp 10.000 |
| 15 | **Heat Shrink Tube** | Assorted | 1 set | Rp 15.000 |

### 📹 CCTV (Opsional)

| No | Komponen | Spesifikasi | Perkiraan Harga |
|----|----------|-------------|-----------------|
| 16 | **ESP32-CAM** | OV2640, WiFi | Rp 85.000 |
| 17 | **Camera Lens** | Wide angle 160° | Rp 25.000 |
| 18 | **Waterproof Housing** | Outdoor | Rp 45.000 |

### 🛠️ Alat yang Dibutuhkan

- Solder + Timah
- Multimeter
- Obeng set (+/-)
- Tang potong & tang lancip
- Bor listrik (untuk mounting)
- Kabel ties
- Double tape & lem

---

## 📊 Total Estimasi Biaya

| Kategori | Budget Hemat | Budget Standar | Budget Premium |
|----------|--------------|----------------|----------------|
| Controller | Rp 155.000 | Rp 200.000 | Rp 300.000 |
| Sensor & Safety | Rp 100.000 | Rp 150.000 | Rp 250.000 |
| Motor | Rp 150.000 | Rp 500.000 | Rp 3.500.000 |
| Kabel & Konektor | Rp 125.000 | Rp 175.000 | Rp 300.000 |
| CCTV | Rp 0 | Rp 155.000 | Rp 500.000 |
| **TOTAL** | **Rp 530.000** | **Rp 1.180.000** | **Rp 4.850.000** |

---

## 🔌 Diagram Wiring

### Skema Koneksi ESP32

```
                    ┌─────────────────────────────────────┐
                    │           ESP32 DevKit              │
                    │                                     │
    ┌───────────────┼── 3.3V                    VIN ──────┼───── 5V Power
    │               │                                     │
    │  ┌────────────┼── GND                     GND ──────┼───── GND Common
    │  │            │                                     │
    │  │  ┌─────────┼── GPIO16 (RELAY_OPEN)    GPIO34 ────┼───── Current Sensor
    │  │  │         │                                     │
    │  │  │  ┌──────┼── GPIO17 (RELAY_CLOSE)   GPIO35 ────┼───── Voltage Sensor
    │  │  │  │      │                                     │
    │  │  │  │   ┌──┼── GPIO2 (STATUS_LED)     GPIO32 ────┼───── Temp Sensor
    │  │  │  │   │  │                                     │
    │  │  │  │   │  │                          GPIO33 ────┼───── Obstacle Sensor
    │  │  │  │   │  │                                     │
    │  │  │  │   │  │   GPIO0 (BUTTON_OPEN)    GPIO25 ────┼───── Limit Switch Open
    │  │  │  │   │  │                                     │
    │  │  │  │   │  │   GPIO15 (BUTTON_CLOSE)  GPIO26 ────┼───── Limit Switch Close
    │  │  │  │   │  │                                     │
    │  │  │  │   │  │   GPIO13 (BUTTON_STOP)   GPIO4 ─────┼───── Buzzer
    │  │  │  │   │  │                                     │
    │  │  │  │   │  │   GPIO12 (BUTTON_RESET)             │
    │  │  │  │   │  │                                     │
    │  │  │  │   │  └─────────────────────────────────────┘
    │  │  │  │   │
    │  │  │  │   └──────────── LED Status (Built-in)
    │  │  │  │
    │  │  │  └── ┌────────────┐
    │  │  │      │ RELAY 2CH  │
    │  │  └────► │ IN2 ═══════╪═══► Motor Close (-)
    │  │         │            │
    │  └───────► │ IN1 ═══════╪═══► Motor Open (+)
    │            │            │
    └──────────► │ VCC        │
                 │ GND        │
                 └────────────┘
```

### Detail Koneksi Relay ke Motor

```
    220V AC ──────┬────────────────────────┬──────── Motor Common
                  │                        │
            ┌─────┴─────┐            ┌─────┴─────┐
            │  RELAY 1  │            │  RELAY 2  │
            │   (OPEN)  │            │  (CLOSE)  │
            └─────┬─────┘            └─────┬─────┘
                  │                        │
                  ├────────────────────────┤
                  │     Motor Terminals    │
                  │   (Forward/Reverse)    │
                  └────────────────────────┘
```

### Koneksi Sensor Arus (ACS712)

```
    ┌──────────────────┐
    │     ACS712       │
    │                  │
    │  VCC ───────────►│ ESP32 5V
    │  GND ───────────►│ ESP32 GND
    │  OUT ───────────►│ ESP32 GPIO34
    │                  │
    │  IP+ ════════════│ Motor Power Line (+)
    │  IP- ════════════│ Motor Power Line (Through)
    └──────────────────┘
```

### Koneksi Limit Switch

```
    Limit Switch (Normally Open)
    ┌─────────────────────┐
    │                     │
    │   ┌──────┐          │
    │   │ NO   ├──────────┼───► ESP32 GPIO25/26
    │   │      │          │
    │   │ COM  ├──────────┼───► ESP32 GND
    │   └──────┘          │
    │                     │
    └─────────────────────┘
    
    * Saat gerbang mencapai limit, switch tertutup
    * GPIO membaca LOW (karena pull-up internal)
```

---

## 🔨 Langkah Perakitan

### Step 1: Persiapan Komponen

1. **Cek semua komponen** sesuai daftar
2. **Tes ESP32** - colokkan ke USB, pastikan LED berkedip
3. **Tes relay** - ukur kontinuitas dengan multimeter
4. **Tes motor** - hubungkan langsung ke power, pastikan berputar

### Step 2: Siapkan Box Controller

```
    ┌─────────────────────────────────────────┐
    │            PROJECT BOX                  │
    │  ┌─────────┐  ┌─────────┐  ┌────────┐  │
    │  │         │  │         │  │        │  │
    │  │  ESP32  │  │ RELAY   │  │ POWER  │  │
    │  │         │  │         │  │ SUPPLY │  │
    │  └─────────┘  └─────────┘  └────────┘  │
    │                                         │
    │  [LED] [BTN] [BTN] [BTN]               │
    └─────────────────────────────────────────┘
```

1. Bor lubang untuk:
   - Kabel masuk (power, motor, sensor)
   - LED indicator
   - Push button
   - Ventilasi

2. Pasang komponen dengan spacer/double tape

### Step 3: Solder & Wiring

```
Urutan soldering:
1. Power supply → ESP32 (VIN, GND)
2. ESP32 → Relay module (GPIO16, GPIO17, 5V, GND)
3. Relay → Terminal block motor
4. Sensor → ESP32 (sesuai pinout)
5. Button → ESP32 (dengan GND)
6. LED → ESP32 GPIO2
```

**Tips Soldering:**
- Gunakan timah 0.8mm
- Panaskan pad dulu, baru masukkan timah
- Jangan terlalu lama (max 3 detik)
- Pastikan joint mengkilat, bukan kusam

### Step 4: Pasang di Lokasi

```
    ┌────────────────────────────────────────────────────┐
    │                    GERBANG                         │
    │                                                    │
    │   [LIMIT OPEN]───────┬───────[LIMIT CLOSE]        │
    │                      │                            │
    │                  ┌───┴───┐                        │
    │                  │ MOTOR │                        │
    │                  └───┬───┘                        │
    │                      │                            │
    │   [OBSTACLE]─────────┼─────────[OBSTACLE]         │
    │                      │                            │
    │                 ┌────┴────┐                       │
    │                 │CONTROLLER│                      │
    │                 │   BOX    │                      │
    │                 └──────────┘                      │
    └────────────────────────────────────────────────────┘
```

1. Mount controller box di tempat terlindung (tidak kena hujan langsung)
2. Pasang limit switch di ujung rel gerbang
3. Pasang obstacle sensor setinggi 30-50cm dari tanah
4. Arahkan sensor ke area yang sering dilewati

---

## 📱 Setup WiFi & Firmware

### Step 1: Flash Firmware

```bash
# Install PlatformIO CLI atau gunakan VS Code + PlatformIO Extension

# Clone repository
git clone https://github.com/Muhammad-Fauzan22/gatemate-iot.git
cd gatemate-iot/firmware

# Upload firmware
pio run -t upload
```

**Atau gunakan Web Flasher:**
1. Buka https://web.esphome.io
2. Connect ESP32 via USB
3. Upload file `.bin` dari release

### Step 2: Koneksi WiFi Pertama Kali

1. **Power ON** controller
2. ESP32 akan membuat hotspot: **`GATEMATE-SETUP`**
3. Hubungkan HP/laptop ke hotspot tersebut
4. Password: **`12345678`**
5. Browser akan otomatis terbuka, atau buka: **`192.168.4.1`**
6. Pilih WiFi rumah Anda
7. Masukkan password
8. Klik Save, ESP32 akan restart

### Step 3: Cari IP Address ESP32

```bash
# Cara 1: Cek di router (DHCP client list)

# Cara 2: Gunakan app Fing (Android/iOS)

# Cara 3: Serial monitor
pio device monitor
# Output: IP Address: 192.168.1.xxx
```

### Step 4: Test API

```bash
# Cek status
curl http://192.168.1.xxx/status

# Buka gerbang
curl http://192.168.1.xxx/open

# Tutup gerbang
curl http://192.168.1.xxx/close

# Stop
curl http://192.168.1.xxx/stop
```

---

## 📹 Setup CCTV (ESP32-CAM)

### Komponen Tambahan

| Komponen | Qty | Harga |
|----------|-----|-------|
| ESP32-CAM | 1 | Rp 85.000 |
| FTDI Programmer | 1 | Rp 25.000 |
| Power 5V 2A | 1 | Rp 30.000 |

### Wiring ESP32-CAM

```
    FTDI USB-TTL          ESP32-CAM
    ┌──────────┐         ┌──────────┐
    │          │         │          │
    │    3.3V ├─────────┤ 3.3V     │
    │    GND  ├─────────┤ GND      │
    │    TX   ├─────────┤ U0R      │
    │    RX   ├─────────┤ U0T      │
    │         │         │          │
    │         │    ┌────┤ IO0 ─────┤ GND (saat flash)
    │         │    │    │          │
    └──────────┘    │    └──────────┘
                    │
                    └── Lepaskan setelah flash, lalu reset
```

### Flash & Configure

```bash
cd gatemate-iot/firmware/camera

# Edit kredensial WiFi
nano src/main.cpp
# Ubah: const char* ssid = "WiFi_Anda";
# Ubah: const char* password = "Password_Anda";

# Upload
pio run -t upload
```

### Akses Stream

```
http://192.168.1.xxx:81/stream
```

---

## 📱 Koneksi dengan Mobile App

### Opsi 1: PWA (Progressive Web App) - RECOMMENDED

Tidak perlu install dari Play Store/App Store. Cukup buka browser!

**Langkah:**

1. Buka browser di HP Anda
2. Kunjungi: **https://gatemate-iot-1ztr.vercel.app**
3. Login dengan akun Anda

**Install ke Home Screen (iPhone):**
1. Buka URL di Safari
2. Tap tombol Share (⬆️)
3. Scroll ke bawah → "Add to Home Screen"
4. Tap "Add"

**Install ke Home Screen (Android):**
1. Buka URL di Chrome
2. Tap menu (⋮) → "Install app" atau "Add to Home Screen"
3. Tap "Install"

### Opsi 2: APK Android

```bash
# Build APK menggunakan Expo EAS
cd mobile
npx eas build --profile preview --platform android

# Download APK dan install di HP Android
```

### Opsi 3: Expo Go (Development)

```bash
# Install Expo Go dari Play Store/App Store
# Lalu jalankan:
cd mobile
npx expo start

# Scan QR code dengan Expo Go
```

### Konfigurasi Koneksi

Edit file `.env` di mobile app:

```env
# Untuk koneksi lokal (dalam WiFi yang sama)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:80

# Ganti XXX dengan IP ESP32 Anda
# Cek IP di router atau serial monitor
```

### Test Koneksi

Setelah app terinstall:

1. Buka app GATEMATE
2. Login atau Register
3. Tap "Add Device" atau "Pairing"
4. Masukkan IP ESP32: `192.168.1.XXX`
5. App akan mendeteksi device
6. Coba tap "Open" untuk membuka gerbang

---

## 🔒 Konfigurasi Keamanan

### 1. Ganti Password Default

Edit `firmware/src/config.h`:

```cpp
#define AP_PASSWORD     "GantiPasswordIni123"
#define MQTT_PASSWORD   "mqtt_password_aman"
#define OTA_PASSWORD    "ota_password_aman"
```

### 2. Setup Firewall (Router)

```
Rekomendasi:
- Jangan expose port 80 ke internet
- Gunakan VPN jika perlu akses remote
- Batasi akses MAC address
```

### 3. Update Berkala

```bash
# OTA Update via web browser
http://192.168.1.xxx/update

# Upload file .bin baru
```

---

## 🔧 Troubleshooting

### ❌ ESP32 tidak konek WiFi

| Problem | Solution |
|---------|----------|
| Password salah | Reset WiFi: tahan tombol RESET 10 detik |
| Jarak terlalu jauh | Tambah WiFi extender/repeater |
| Interference | Pindahkan channel WiFi router |

### ❌ Motor tidak bergerak

| Problem | Solution |
|---------|----------|
| Relay tidak click | Cek koneksi GPIO16/17 ke relay |
| Motor tidak dapat power | Ukur voltage di terminal motor |
| Overload protection trip | Tunggu 5 menit, coba lagi |

### ❌ Sensor tidak membaca

| Problem | Solution |
|---------|----------|
| Current sensor = 0 | Cek koneksi ke GPIO34 |
| Obstacle selalu trigger | Bersihkan lensa sensor |
| Limit switch tidak work | Cek mekanis & kabel |

### ❌ App tidak bisa connect

| Problem | Solution |
|---------|----------|
| IP berubah | Set static IP di router |
| CORS error | Pastikan `server.enableCORS(true)` |
| Timeout | Cek koneksi WiFi ESP32 |

---

## 📞 Support

**Email:** support@gatemate.io  
**GitHub Issues:** [Create Issue](https://github.com/Muhammad-Fauzan22/gatemate-iot/issues)  
**WhatsApp:** +62 xxx-xxxx-xxxx

---

## 📜 Lisensi & Disclaimer

⚠️ **PERINGATAN KEAMANAN:**
- Instalasi listrik harus dilakukan oleh teknisi berlisensi
- Pastikan motor gerbang memiliki fitur safety
- Test obstacle detection sebelum digunakan
- Jangan biarkan anak-anak bermain di area gerbang otomatis

Proyek ini dilisensikan di bawah **MIT License**. Penggunaan di luar tanggung jawab pengembang.
