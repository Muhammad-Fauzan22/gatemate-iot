# BAB II
# TINJAUAN PUSTAKA

## 2.1 Landasan Teori

### 2.1.1 Internet of Things (IoT)

Internet of Things (IoT) adalah konsep di mana objek fisik ("things") dilengkapi dengan sensor, software, dan teknologi lainnya untuk terhubung dan bertukar data dengan perangkat dan sistem lain melalui internet. Konsep IoT memungkinkan objek sehari-hari untuk "cerdas" dan dapat dikendalikan serta dimonitor dari jarak jauh.

Komponen utama dalam sistem IoT meliputi:
- **Sensor/Aktuator:** Mengumpulkan data dari lingkungan atau melakukan aksi fisik
- **Konektivitas:** WiFi, Bluetooth, LoRa, atau protokol komunikasi lainnya
- **Data Processing:** Pemrosesan data baik di edge device maupun cloud
- **User Interface:** Aplikasi atau dashboard untuk interaksi dengan pengguna

### 2.1.2 Mikrokontroler ESP32

ESP32 adalah mikrokontroler yang dikembangkan oleh Espressif Systems, merupakan penerus dari ESP8266 dengan kemampuan yang lebih tinggi. ESP32 memiliki keunggulan utama yaitu integrasi WiFi dan Bluetooth dalam satu chip dengan harga yang terjangkau.

**Tabel 2.1 Spesifikasi ESP32 DevKit V1**

| Parameter | Spesifikasi |
|-----------|-------------|
| CPU | Xtensa Dual-Core LX6, 240 MHz |
| RAM | 520 KB SRAM |
| Flash | 4 MB (external) |
| WiFi | 802.11 b/g/n, 2.4 GHz |
| Bluetooth | v4.2 BR/EDR dan BLE |
| GPIO | 34 pin programmable |
| ADC | 12-bit, 18 channel |
| DAC | 8-bit, 2 channel |
| UART | 3 |
| SPI | 4 |
| I2C | 2 |
| PWM | 16 channel |
| Operating Voltage | 3.3V |
| Input Voltage | 5V (via USB/VIN) |

Fitur-fitur ESP32 yang relevan untuk proyek ini:
- **WiFi Station Mode:** Menghubungkan ESP32 ke jaringan WiFi rumah
- **WiFi AP Mode:** Membuat hotspot untuk konfigurasi awal
- **Deep Sleep:** Mode hemat daya untuk aplikasi battery-powered
- **OTA Update:** Kemampuan update firmware melalui jarinagan
- **Watchdog Timer:** Sistem recovery otomatis jika terjadi hang

### 2.1.3 Sensor Arus ACS712

ACS712 adalah sensor arus berbasis efek Hall yang dapat mengukur arus AC maupun DC. Sensor ini menghasilkan output tegangan analog yang proporsional terhadap arus yang mengalir melaluinya.

**Prinsip kerja:**
1. Arus yang diukur mengalir melalui jalur konduktor di dalam IC
2. Medan magnet yang dihasilkan oleh arus dideteksi oleh elemen Hall
3. Sinyal dari elemen Hall diperkuat dan dikeluarkan sebagai tegangan analog
4. Pada kondisi tanpa arus (0A), output adalah VCC/2 (2.5V pada VCC 5V)

**Karakteristik ACS712-30A:**
- Range pengukuran: -30A sampai +30A
- Sensitivitas: 66 mV/A
- Bandwidth: 80 kHz
- Supply voltage: 5V

Dalam proyek ini, ACS712 digunakan untuk:
- Mendeteksi kondisi motor stall (arus berlebih)
- Monitoring konsumsi daya motor
- Proteksi overcurrent otomatis

### 2.1.4 Sensor Infrared Obstacle

Sensor IR obstacle seperti E18-D80NK menggunakan prinsip refleksi cahaya inframerah untuk mendeteksi objek. Sensor ini terdiri dari LED inframerah (transmitter) dan photodiode (receiver).

**Prinsip kerja:**
1. LED inframerah memancarkan cahaya IR
2. Jika ada objek di depan sensor, cahaya dipantulkan kembali
3. Photodiode mendeteksi cahaya pantulan
4. Circuit comparator menghasilkan output digital (HIGH/LOW)

**Spesifikasi E18-D80NK:**
- Jarak deteksi: 3-80 cm (adjustable dengan potensiometer)
- Supply voltage: 5V DC
- Output: NPN open-collector (active LOW)
- Sudut deteksi: ±15°

### 2.1.5 Relay Elektromagnetik

Relay adalah saklar elektromagnetik yang memungkinkan rangkaian bertegangan rendah (5V) mengontrol rangkaian bertegangan tinggi (220V AC). Relay bekerja dengan prinsip elektromagnet yang menggerakkan kontak mekanis.

**Relay module 2 channel:**
- Trigger voltage: 5V
- Rating contact: 10A 250V AC / 10A 30V DC
- Optocoupler isolation: Ya (untuk proteksi mikrokontroler)
- LED indicator: Ada untuk setiap channel

### 2.1.6 Protokol MQTT

MQTT (Message Queuing Telemetry Transport) adalah protokol messaging ringan yang dirancang untuk kondisi bandwidth terbatas dan koneksi tidak stabil. MQTT menggunakan model publish-subscribe.

**Komponen MQTT:**
- **Broker:** Server yang menerima semua pesan dan mendistribusikannya
- **Publisher:** Client yang mengirim pesan ke topic tertentu
- **Subscriber:** Client yang menerima pesan dari topic yang di-subscribe
- **Topic:** Hierarki string untuk routing pesan

### 2.1.7 Progressive Web App (PWA)

Progressive Web App adalah aplikasi web yang menggunakan teknologi modern untuk memberikan pengalaman seperti aplikasi native. PWA dapat diinstall di home screen, bekerja offline, dan menerima push notification.

**Teknologi kunci PWA:**
- **Service Worker:** Script yang berjalan di background untuk caching dan offline support
- **Web App Manifest:** File JSON yang mendeskripsikan aplikasi (nama, icon, theme)
- **HTTPS:** Required untuk keamanan dan fitur PWA

---

## 2.2 Penelitian Terkait

### 2.2.1 Sistem Gerbang Otomatis Berbasis Arduino

Penelitian oleh Pratama et al. (2020) mengembangkan sistem gerbang otomatis menggunakan Arduino Uno dan Bluetooth HC-05. Sistem ini memungkinkan kontrol gerbang melalui smartphone Android dengan jangkauan hingga 10 meter.

**Kelebihan:** Biaya rendah, implementasi sederhana  
**Kekurangan:** Jangkauan terbatas (Bluetooth), tidak bisa diakses dari jarak jauh

### 2.2.2 Smart Gate dengan SMS Gateway

Penelitian oleh Hidayat et al. (2019) menggunakan modul GSM SIM800L untuk kontrol gerbang via SMS. Pengguna dapat mengirim SMS dengan format tertentu untuk membuka/menutup gerbang.

**Kelebihan:** Tidak bergantung pada WiFi, jangkauan luas  
**Kekurangan:** Biaya pulsa, delay tinggi (5-30 detik), tidak real-time

### 2.2.3 IoT Gate Control dengan NodeMCU

Penelitian oleh Rahman et al. (2021) mengembangkan sistem kontrol gerbang menggunakan NodeMCU ESP8266 dan platform Blynk. Sistem dapat dikontrol melalui aplikasi Blynk di smartphone.

**Kelebihan:** Kontrol via internet, interface siap pakai  
**Kekurangan:** Bergantung pada layanan Blynk (berbayar untuk fitur lengkap)

### 2.2.4 Perbandingan dengan Proyek GATEMATE

**Tabel 2.2 Perbandingan dengan Penelitian Terkait**

| Fitur | Arduino+BT | SMS Gateway | NodeMCU+Blynk | **GATEMATE** |
|-------|------------|-------------|---------------|--------------|
| Konektivitas | Bluetooth | GSM | WiFi | **WiFi** |
| Jangkauan | 10m | Unlimited | Unlimited | **Unlimited** |
| Biaya operasional | Gratis | Rp 500/SMS | Gratis-$5/bln | **Gratis** |
| Response time | <100ms | 5-30s | 500ms-2s | **<500ms** |
| Obstacle detection | ❌ | ❌ | ❌ | **✅** |
| Current monitoring | ❌ | ❌ | ❌ | **✅** |
| Scheduling | ❌ | ❌ | ✅ | **✅** |
| Guest access | ❌ | ❌ | ❌ | **✅** |
| Open source | ❌ | ❌ | ❌ | **✅** |
| Estimasi biaya | Rp 200K | Rp 300K | Rp 250K | **Rp 530K-890K** |

**Keunggulan GATEMATE:**
1. Fitur keamanan lengkap (obstacle, current, temperature monitoring)
2. Tidak bergantung pada layanan pihak ketiga yang berbayar
3. Open source dan fully customizable
4. PWA yang dapat diakses dari berbagai platform
5. Fallback ke mode lokal jika internet terputus

---
