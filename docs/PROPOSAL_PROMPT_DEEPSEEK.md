
## INFORMASI PROYEK

### Nama Proyek
**GATEMATE - Smart IoT Gate Control System**

### Deskripsi Singkat
Sistem kontrol gerbang otomatis berbasis Internet of Things (IoT) yang memungkinkan pengguna mengontrol gerbang rumah/gedung dari jarak jauh melalui smartphone. Sistem ini mengintegrasikan mikrokontroler ESP32, berbagai sensor keamanan, motor penggerak gerbang, dan aplikasi mobile/web yang terhubung melalui WiFi.

---

## I. BAGIAN AWAL

Buatkan:
1. **Halaman Judul (Cover)** dengan:
   - Judul: "RANCANG BANGUN SISTEM KONTROL GERBANG OTOMATIS BERBASIS INTERNET OF THINGS (IoT) MENGGUNAKAN ESP32 DAN APLIKASI MOBILE"
   - Subjudul: Proyek Akhir/Tugas Akhir/Skripsi
   - Logo placeholder
   - Nama: Muhammad Fauzan
   - Program Studi: Teknik Informatika/Teknik Elektro

2. **Daftar Isi** lengkap
3. **Daftar Gambar** (untuk diagram yang akan dibuat)
4. **Daftar Tabel** (untuk tabel komponen dan budget)

---

## II. BAB I: PENDAHULUAN

### 1.1 Latar Belakang

Masalah yang ingin dipecahkan:
- Gerbang konvensional tidak efisien (harus turun dari kendaraan untuk membuka)
- Keamanan rendah (kunci fisik bisa diduplikasi)
- Tidak ada monitoring aktivitas gerbang
- Tidak ada notifikasi saat ada yang masuk/keluar
- Akses tamu membutuhkan koordinasi manual

Konteks teknologi:
- Perkembangan IoT memungkinkan kontrol jarak jauh
- ESP32 menyediakan WiFi+Bluetooth dalam satu chip dengan harga terjangkau
- Smartphone menjadi perangkat yang selalu dibawa

### 1.2 Rumusan Masalah

1. Bagaimana merancang sistem kontrol gerbang yang dapat dioperasikan secara remote melalui smartphone?
2. Bagaimana mengintegrasikan sensor keamanan (obstacle detection, current monitoring) untuk mencegah kecelakaan?
3. Bagaimana memastikan sistem tetap berfungsi saat koneksi internet terputus?
4. Bagaimana memberikan akses tamu secara aman tanpa memberikan akses permanen?

### 1.3 Tujuan Proyek

1. Merancang dan membangun sistem kontrol gerbang otomatis berbasis ESP32
2. Mengembangkan aplikasi mobile cross-platform (iOS & Android) untuk kontrol gerbang
3. Mengimplementasikan fitur keamanan: obstacle detection, current monitoring, limit switch
4. Membuat sistem penjadwalan otomatis buka/tutup gerbang
5. Mengembangkan fitur geo-fence untuk auto open/close berdasarkan lokasi

### 1.4 Manfaat/Signifikansi

**Bagi Pengguna:**
- Kenyamanan: kontrol gerbang tanpa turun dari kendaraan
- Keamanan: notifikasi real-time setiap aktivitas
- Efisiensi: penjadwalan otomatis

**Bagi Industri:**
- Proof of concept sistem smart home berbasis ESP32
- Template yang dapat dikembangkan untuk produk komersial

**Bagi Akademik:**
- Kontribusi pada bidang IoT dan embedded systems
- Dokumentasi lengkap untuk pembelajaran

### 1.5 Batasan Masalah

1. Sistem hanya untuk gerbang sliding (dorong) satu arah
2. Jarak maksimal kontrol: dalam jangkauan WiFi rumah
3. Motor yang didukung: DC motor 12V/24V atau AC motor 220V
4. Tidak mencakup instalasi mekanis gerbang (fokus pada sistem elektronik)
5. Aplikasi menggunakan Progressive Web App (tidak native)

---

## III. BAB II: TINJAUAN PUSTAKA

### 2.1 Teori Dasar

Jelaskan teori tentang:

**A. Mikrokontroler ESP32**
- Spesifikasi: Dual-core Xtensa LX6, WiFi 802.11 b/g/n, Bluetooth 4.2
- GPIO: 34 pin programmable
- ADC: 12-bit, 18 channel
- Fitur: Deep sleep mode, OTA update

**B. Komunikasi MQTT**
- Protokol publish-subscribe untuk IoT
- QoS levels
- Broker Mosquitto

**C. Sensor Arus ACS712**
- Prinsip kerja efek Hall
- Range: 5A/20A/30A
- Output: tegangan analog proporsional terhadap arus

**D. Sensor IR Obstacle (E18-D80NK)**
- Prinsip kerja refleksi inframerah
- Jarak deteksi: 3-80cm (adjustable)
- Output: digital HIGH/LOW

**E. Relay Elektromagnetik**
- Prinsip kerja electromagnet
- Optocoupler isolation
- Rating: 10A 250V AC

**F. Progressive Web App (PWA)**
- Service Worker
- Web App Manifest
- Offline capability

### 2.2 Penelitian Terkait

Bandingkan dengan:
1. Smart Gate menggunakan Arduino Uno + Bluetooth (terbatas jarak)
2. Gate berbasis SMS (biaya pulsa, delay tinggi)
3. Gate komersial (mahal, tidak customizable)

**Keunggulan GATEMATE:**
- Menggunakan WiFi (jangkauan lebih luas)
- Open source dan customizable
- Biaya terjangkau (mulai Rp 530.000)
- Multi-platform (iOS, Android, Web)
- Fitur keamanan lengkap

---

## IV. BAB III: METODOLOGI / PERANCANGAN ALAT

### 3.1 Diagram Blok Sistem

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARSITEKTUR SISTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ MOBILE APP  │    │ WEB DASHBOARD│   │     ESP32 DEVICE        │  │
│  │(React Native)│    │ (React+Vite)│   │      (Firmware)         │  │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│         │                   │                       │                │
│         └───────────────────┴───────────────────────┘                │
│                             │                                        │
│                     ┌───────▼───────┐                                │
│                     │     NGINX     │                                │
│                     │    (Proxy)    │                                │
│                     └───────┬───────┘                                │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                    │
│         │                   │                   │                    │
│    ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐              │
│    │ BACKEND │        │ MOSQUITTO │       │   REDIS   │              │
│    │ (Node.js)│◄──────│   (MQTT)  │       │  (Cache)  │              │
│    └────┬────┘        └───────────┘       └───────────┘              │
│         │                                                            │
│    ┌────▼────────┐                                                   │
│    │ POSTGRESQL  │                                                   │
│    │ (Database)  │                                                   │
│    └─────────────┘                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Desain Elektronik

**Skema Koneksi ESP32:**

```
ESP32 DevKit V1 - Pinout Mapping
=====================================

GPIO16 ────► RELAY_OPEN      (Output ke relay buka)
GPIO17 ────► RELAY_CLOSE     (Output ke relay tutup)
GPIO2  ────► STATUS_LED      (LED indikator built-in)
GPIO4  ────► BUZZER          (Buzzer alarm)

GPIO0  ────► BUTTON_OPEN     (Tombol buka manual)
GPIO15 ────► BUTTON_CLOSE    (Tombol tutup manual)
GPIO13 ────► BUTTON_STOP     (Tombol stop darurat)
GPIO12 ────► BUTTON_RESET    (Factory reset, tahan 10 detik)

GPIO34 ────► CURRENT_SENSOR  (ACS712 output - ADC)
GPIO35 ────► VOLTAGE_SENSOR  (Voltage divider - ADC)
GPIO32 ────► TEMP_SENSOR     (NTC Thermistor - ADC)
GPIO33 ────► OBSTACLE_SENSOR (IR sensor - Digital)

GPIO25 ────► LIMIT_OPEN      (Limit switch posisi terbuka)
GPIO26 ────► LIMIT_CLOSE     (Limit switch posisi tertutup)

VIN    ────► 5V Power Supply
GND    ────► Ground Common
```

### 3.3 Daftar Komponen dan Spesifikasi

**TABEL KOMPONEN UTAMA:**

| No | Komponen | Spesifikasi | Qty | Harga Satuan | Total |
|----|----------|-------------|-----|--------------|-------|
| 1 | ESP32 DevKit V1 | 30-pin, WiFi+BT, Dual Core | 1 | Rp 65.000 | Rp 65.000 |
| 2 | Module Relay 2 Channel | 5V, 10A, Optocoupler | 1 | Rp 25.000 | Rp 25.000 |
| 3 | ACS712 Current Sensor | 30A, Hall Effect | 1 | Rp 25.000 | Rp 25.000 |
| 4 | IR Obstacle Sensor | E18-D80NK, 3-80cm | 2 | Rp 20.000 | Rp 40.000 |
| 5 | Limit Switch | Micro switch NO/NC | 2 | Rp 5.000 | Rp 10.000 |
| 6 | Push Button | Momentary, 12mm | 3 | Rp 5.000 | Rp 15.000 |
| 7 | LED Indicator | 5mm, RGB | 2 | Rp 2.500 | Rp 5.000 |
| 8 | Buzzer Active | 5V | 1 | Rp 5.000 | Rp 5.000 |
| 9 | Power Supply | 5V 3A AC-DC | 1 | Rp 35.000 | Rp 35.000 |
| 10 | Project Box | 150x100x50mm ABS | 1 | Rp 30.000 | Rp 30.000 |
| 11 | Kabel AWG22 | 4 warna, 10m | 1 | Rp 50.000 | Rp 50.000 |
| 12 | Terminal Block | 2-pin, 5.08mm | 10 | Rp 1.500 | Rp 15.000 |
| 13 | Heat Shrink | Assorted | 1 set | Rp 15.000 | Rp 15.000 |
| | **SUBTOTAL CONTROLLER** | | | | **Rp 335.000** |

**OPSI MOTOR GERBANG:**

| Opsi | Motor | Spesifikasi | Harga |
|------|-------|-------------|-------|
| A | Motor DC + Driver | 12V/24V, 50W, L298N | Rp 200.000 |
| B | Motor Wiper Mobil | 12V DC, Daur ulang | Rp 150.000 |
| C | Motor AC + Kapasitor | 220V, 50W | Rp 400.000 |
| D | Sliding Gate Kit | Lengkap dengan rel | Rp 3.500.000 |

### 3.4 Prosedur Perakitan

**Step 1: Persiapan (1 hari)**
- Pengumpulan dan verifikasi semua komponen
- Testing individual (ESP32, relay, sensor)

**Step 2: Prototyping (2 hari)**
- Breadboard assembly
- Wiring sesuai skema
- Testing konektivitas

**Step 3: Soldering (1 hari)**
- Penyolderan komponen ke PCB/perfboard
- Heat shrink pada sambungan
- Quality check dengan multimeter

**Step 4: Box Assembly (1 hari)**
- Drilling untuk kabel, LED, tombol
- Mounting komponen
- Cable management

**Step 5: Installation (1 hari)**
- Pemasangan di lokasi gerbang
- Wiring ke motor
- Pemasangan sensor dan limit switch

### 3.5 Prosedur Pengujian

**A. Pengujian Fungsional:**
| No | Test Case | Expected Result | Pass/Fail |
|----|-----------|-----------------|-----------|
| 1 | Buka gerbang via app | Motor berputar CW, gerbang terbuka | |
| 2 | Tutup gerbang via app | Motor berputar CCW, gerbang tertutup | |
| 3 | Stop saat moving | Motor berhenti segera | |
| 4 | Obstacle detected | Motor berhenti, buzzer berbunyi | |
| 5 | Limit switch open | Motor berhenti di posisi terbuka penuh | |
| 6 | Limit switch close | Motor berhenti di posisi tertutup penuh | |

**B. Pengujian Keamanan:**
| No | Test Case | Expected Result |
|----|-----------|-----------------|
| 1 | Current > 7A (stall) | Motor stop otomatis |
| 2 | Temperature > 75°C | Emergency shutdown |
| 3 | Timeout 30 detik | Motor stop otomatis |

**C. Pengujian Konektivitas:**
| No | Test Case | Expected Result |
|----|-----------|-----------------|
| 1 | WiFi disconnected | Fallback ke AP mode |
| 2 | MQTT broker down | Local control tetap jalan |
| 3 | App response time | < 500ms |

---

## V. BAB IV: JADWAL DAN ANGGARAN

### 4.1 Jadwal Kegiatan (Gantt Chart)

```
MINGGU           1    2    3    4    5    6    7    8
─────────────────────────────────────────────────────
Perencanaan      ████
Pembelian        ████ ████
Perakitan             ████ ████
Pemrograman               ████ ████ ████
Pengujian                           ████ ████
Dokumentasi                                   ████ ████
Presentasi                                         ████
```

**Detail Kegiatan:**
- Minggu 1-2: Perencanaan & pembelian komponen
- Minggu 2-4: Perakitan hardware
- Minggu 3-6: Pemrograman firmware & aplikasi
- Minggu 5-7: Pengujian sistem
- Minggu 7-8: Dokumentasi & presentasi

### 4.2 Rencana Anggaran Biaya (RAB)

**TABEL RINCIAN ANGGARAN:**

| No | Kategori | Item | Jumlah | Harga | Total |
|----|----------|------|--------|-------|-------|
| **A** | **HARDWARE** | | | | |
| 1 | Controller | ESP32, Relay, Sensor, dll | 1 set | Rp 335.000 | Rp 335.000 |
| 2 | Motor | DC Motor 24V + Driver | 1 set | Rp 200.000 | Rp 200.000 |
| 3 | Kabel & Instalasi | Power cable, mounting | 1 set | Rp 100.000 | Rp 100.000 |
| 4 | Cadangan | Komponen backup | 1 set | Rp 50.000 | Rp 50.000 |
| | **Subtotal Hardware** | | | | **Rp 685.000** |
| **B** | **SOFTWARE** | | | | |
| 5 | Hosting | Vercel (free tier) | 12 bulan | Rp 0 | Rp 0 |
| 6 | Database | Firebase (free tier) | 12 bulan | Rp 0 | Rp 0 |
| 7 | Domain | Vercel subdomain | - | Rp 0 | Rp 0 |
| | **Subtotal Software** | | | | **Rp 0** |
| **C** | **OPERASIONAL** | | | | |
| 8 | Transportasi | Pembelian komponen | 3x | Rp 25.000 | Rp 75.000 |
| 9 | Dokumentasi | Print, binding | 1 set | Rp 50.000 | Rp 50.000 |
| 10 | Tak Terduga | 10% dari total | - | - | Rp 81.000 |
| | **Subtotal Operasional** | | | | **Rp 206.000** |
| | | | | | |
| | **GRAND TOTAL** | | | | **Rp 891.000** |

---

## VI. BAGIAN AKHIR

### Daftar Pustaka

Gunakan format IEEE. Referensi yang dibutuhkan:
1. Datasheet ESP32 (Espressif)
2. Datasheet ACS712 (Allegro MicroSystems)
3. Dokumentasi Arduino Framework
4. Dokumentasi React Native/Expo
5. MQTT Protocol Specification
6. Jurnal terkait smart home / IoT gate

### Lampiran

Sertakan:
1. Datasheet ESP32 DevKit V1
2. Datasheet ACS712-30A
3. Skema rangkaian lengkap (format PDF)
4. Source code (GitHub link)
5. Screenshot aplikasi
6. Foto prototype

---

## INSTRUKSI TAMBAHAN

1. **Bahasa:** Gunakan Bahasa Indonesia formal akademik
2. **Format:** Sesuai standar penulisan tugas akhir/skripsi
3. **Margin:** 4-3-3-3 cm
4. **Font:** Times New Roman 12pt
5. **Spasi:** 1.5
6. **Halaman:** Nomor halaman romawi (bagian awal), arab (bab)
7. **Visualisasi:** Sertakan placeholder untuk diagram dan foto
8. **Referensi:** Minimal 10 referensi (5 jurnal, 5 buku/datasheet)

---

## OUTPUT YANG DIHARAPKAN

Buatkan proposal lengkap dalam format markdown dengan:
- Semua section terisi lengkap
- Tabel yang rapi dan informatif
- Diagram dijelaskan dengan detail
- Bahasa formal akademik
- Total minimal 20-30 halaman konten

---

**CATATAN:**
Proyek ini adalah proyek nyata yang sudah dalam tahap pengembangan. Repository GitHub: https://github.com/Muhammad-Fauzan22/gatemate-iot

Aplikasi web tersedia di: https://gatemate-iot-1ztr.vercel.app
