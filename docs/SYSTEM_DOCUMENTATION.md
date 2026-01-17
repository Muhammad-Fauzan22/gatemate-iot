# 🚪 GATEMATE IoT - Dokumentasi Lengkap Sistem

## Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Hardware yang Dibutuhkan](#hardware-yang-dibutuhkan)
3. [Panduan Instalasi Hardware](#panduan-instalasi-hardware)
4. [Panduan Penggunaan Aplikasi](#panduan-penggunaan-aplikasi)
5. [Troubleshooting](#troubleshooting)

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                     GATEMATE SYSTEM ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐         ┌──────────────────┐                    │
│   │  Mobile  │◄───────►│    Firebase      │                    │
│   │   App    │  HTTPS  │  Firestore+Auth  │                    │
│   └────┬─────┘         └────────┬─────────┘                    │
│        │                        │                               │
│        │ WiFi                   │ Sync                          │
│        │                        ▼                               │
│        │               ┌──────────────────┐                    │
│        └──────────────►│  Backend Server  │                    │
│                        │  Node.js+Express │                    │
│                        └────────┬─────────┘                    │
│                                 │                               │
│   ┌─────────────────────────────┼─────────────────────────────┐│
│   │             LOCAL NETWORK   │                              ││
│   │                             ▼                              ││
│   │  ┌───────────┐    ┌──────────────────┐    ┌───────────┐  ││
│   │  │   ESP32   │◄──►│   WiFi Router    │◄──►│  Mobile   │  ││
│   │  │Controller │    │                  │    │   App     │  ││
│   │  └─────┬─────┘    └──────────────────┘    └───────────┘  ││
│   │        │                                                   ││
│   │        ▼                                                   ││
│   │  ┌───────────┐    ┌───────────┐    ┌───────────┐         ││
│   │  │   Relay   │───►│  Motor DC │───►│   PAGAR   │         ││
│   │  │  Module   │    │  Driver   │    │           │         ││
│   │  └───────────┘    └───────────┘    └───────────┘         ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hardware yang Dibutuhkan

### 1. Komponen Elektronik

| Komponen | Spesifikasi | Qty | Harga Est. |
|----------|-------------|-----|------------|
| **ESP32 DevKit V1** | 38 pin, WiFi + Bluetooth | 1 | Rp 75.000 |
| **Relay Module 2 Channel** | 5V, optocoupler isolasi | 1 | Rp 25.000 |
| **Motor Driver L298N** | Dual H-Bridge, 2A per channel | 1 | Rp 35.000 |
| **Power Supply 12V 5A** | AC-DC Adaptor switching | 1 | Rp 50.000 |
| **Step Down LM2596** | 12V to 5V, 3A output | 1 | Rp 15.000 |
| **Limit Switch** | Micro switch lever arm | 2 | Rp 10.000 |
| **Kabel Jumper** | Male-Female 20cm | 1 set | Rp 15.000 |
| **Project Box** | Waterproof IP65, 15x10cm | 1 | Rp 50.000 |
| **Terminal Block** | 2 pin, untuk koneksi motor | 2 | Rp 5.000 |

**Total Estimasi Komponen Elektronik: Rp 280.000**

### 2. Komponen Mekanik Gerbang

#### Untuk Pagar Sliding (Geser):

| Komponen | Spesifikasi | Qty | Harga Est. |
|----------|-------------|-----|------------|
| **Motor DC Gearbox** | 12V, 50-100 RPM, 10-20 kg.cm | 1 | Rp 150.000 |
| **Rel Sliding** | Besi galvanis U-channel 6m | 1 | Rp 200.000 |
| **Roda Pagar V-Groove** | Diameter 60mm, bearing | 4 | Rp 100.000 |
| **Bracket Motor** | Plat besi 5mm, custom | 1 | Rp 50.000 |
| **Chain/Belt** | Rantai motor atau V-belt | 1 | Rp 75.000 |
| **Sprocket/Pulley** | Sesuai motor & chain | 2 | Rp 50.000 |

**Total Pagar Sliding: Rp 625.000**

#### Untuk Pagar Swing (Ayun):

| Komponen | Spesifikasi | Qty | Harga Est. |
|----------|-------------|-----|------------|
| **Linear Actuator** | 12V, 300mm stroke, 1500N | 1 | Rp 350.000 |
| **Bracket Actuator** | Stainless steel + engsel | 2 | Rp 100.000 |
| **Engsel Heavy Duty** | 4 inch, ball bearing | 2 | Rp 75.000 |

**Total Pagar Swing: Rp 525.000**

### 3. Diagram Koneksi Wiring

```
┌─────────────────────────────────────────────────────────────┐
│                        WIRING DIAGRAM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   AC 220V ──────┐                                           │
│                 │                                            │
│                 ▼                                            │
│         ┌──────────────┐                                    │
│         │  PSU 12V 5A  │                                    │
│         │  (Adaptor)   │                                    │
│         └───────┬──────┘                                    │
│                 │                                            │
│         ┌───────┴───────┐                                   │
│         │               │                                    │
│         ▼               ▼                                    │
│   ┌──────────┐   ┌──────────┐                              │
│   │ LM2596   │   │  L298N   │                              │
│   │ 12V→5V   │   │  Driver  │                              │
│   └────┬─────┘   └────┬─────┘                              │
│        │              │                                      │
│        │ 5V           │ 12V                                  │
│        ▼              │                                      │
│   ┌──────────┐        │                                     │
│   │  ESP32   │        │                                     │
│   │          │        │                                     │
│   │ GPIO 25 ─┼────────┼───► ENA (Enable)                   │
│   │ GPIO 26 ─┼────────┼───► IN1 (Direction 1)              │
│   │ GPIO 27 ─┼────────┼───► IN2 (Direction 2)              │
│   │          │        │                                     │
│   │ GPIO 32 ◄┼────────┼──── Limit Switch BUKA              │
│   │ GPIO 33 ◄┼────────┼──── Limit Switch TUTUP             │
│   │          │        │                                     │
│   │ GPIO 2  ─┼────────┼───► LED Status                     │
│   │          │        │                                     │
│   │  GND    ─┼────────┴───────────────────┐                │
│   └──────────┘                            │                 │
│                                           │                 │
│                              ┌────────────┴─────────────┐  │
│                              │                          │  │
│                              │   L298N OUTPUT           │  │
│                              │                          │  │
│                              │   OUT1 ──────┐           │  │
│                              │              │           │  │
│                              │   OUT2 ──────┼──► MOTOR  │  │
│                              │              │    DC     │  │
│                              └──────────────┴───────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Pin Mapping ESP32

| GPIO | Fungsi | Keterangan |
|------|--------|------------|
| GPIO 25 | MOTOR_ENABLE | Enable motor driver (PWM untuk speed) |
| GPIO 26 | MOTOR_IN1 | Arah putar CW (Clockwise) |
| GPIO 27 | MOTOR_IN2 | Arah putar CCW (Counter-Clockwise) |
| GPIO 32 | LIMIT_OPEN | Limit switch posisi BUKA (INPUT_PULLUP) |
| GPIO 33 | LIMIT_CLOSE | Limit switch posisi TUTUP (INPUT_PULLUP) |
| GPIO 34 | CURRENT_SENSE | Sensor arus untuk proteksi (opsional) |
| GPIO 2 | LED_STATUS | LED indikator bawaan ESP32 |
| GPIO 4 | BUZZER | Buzzer alarm (opsional) |

---

## Panduan Instalasi Hardware

### FASE 1: Persiapan (30 menit)

#### Checklist Sebelum Instalasi:
- [ ] Survey lokasi pagar
- [ ] Ukur dimensi pagar (panjang, tinggi, berat)
- [ ] Cek ketersediaan listrik 220V AC
- [ ] Cek jangkauan WiFi router
- [ ] Tentukan posisi motor
- [ ] Tentukan posisi limit switch

#### Tools yang Dibutuhkan:
- Multimeter digital
- Obeng set (+/-)
- Kunci pas 10-14mm
- Bor listrik + mata bor besi
- Solder station + timah
- Tang potong & tang lancip
- Isolasi & heat shrink
- Laptop + kabel USB
- HP Android/iOS untuk testing

### FASE 2: Rakit Controller Box (45 menit)

1. **Pasang komponen di project box**
   ```
   Layout dalam box:
   ┌─────────────────────────────┐
   │  [PSU]     [LM2596]        │
   │                            │
   │  [ESP32]   [L298N]         │
   │                            │
   │  [Relay]   [Terminal]      │
   └─────────────────────────────┘
   ```

2. **Koneksi power**
   - PSU 12V → LM2596 input
   - LM2596 output → ESP32 5V & GND
   - PSU 12V → L298N 12V & GND

3. **Koneksi control**
   - ESP32 GPIO 25 → L298N ENA
   - ESP32 GPIO 26 → L298N IN1
   - ESP32 GPIO 27 → L298N IN2
   - ESP32 GND → L298N GND

4. **Test awal (tanpa motor)**
   ```cpp
   // Test firmware sederhana
   void setup() {
       Serial.begin(115200);
       pinMode(25, OUTPUT);
       pinMode(26, OUTPUT);
       pinMode(27, OUTPUT);
       Serial.println("Motor Test Ready");
   }
   
   void loop() {
       // Test CW
       digitalWrite(25, HIGH);
       digitalWrite(26, HIGH);
       digitalWrite(27, LOW);
       Serial.println("CW");
       delay(3000);
       
       // Stop
       digitalWrite(25, LOW);
       delay(1000);
       
       // Test CCW
       digitalWrite(25, HIGH);
       digitalWrite(26, LOW);
       digitalWrite(27, HIGH);
       Serial.println("CCW");
       delay(3000);
       
       // Stop
       digitalWrite(25, LOW);
       delay(1000);
   }
   ```

### FASE 3: Instalasi Mekanik (2-4 jam)

#### Untuk Pagar SLIDING:

1. **Pasang rel sliding**
   - Buat pondasi cor untuk rel
   - Pasang rel dengan anchor bolt
   - Pastikan level/rata

2. **Pasang roda di pagar**
   - Marking posisi roda
   - Las bracket roda
   - Pasang roda V-groove

3. **Mount motor**
   - Buat bracket motor dari plat besi
   - Posisikan di ujung rel
   - Sambungkan chain/belt ke pagar

4. **Pasang limit switch**
   - Limit BUKA di ujung bukaan maksimal
   - Limit TUTUP di ujung tertutup penuh
   - Pastikan aktuasi saat pagar menyentuh

#### Untuk Pagar SWING:

1. **Pasang engsel heavy duty**
2. **Mount linear actuator**
   - Bracket di tiang: 15cm dari pivot
   - Bracket di daun pintu: 40cm dari pivot
3. **Pasang limit switch di frame**

### FASE 4: Koneksi & Konfigurasi (30 menit)

1. **Sambungkan motor ke L298N**
   - OUT1 → Motor terminal (+)
   - OUT2 → Motor terminal (-)

2. **Sambungkan limit switch**
   - Common → GND ESP32
   - NO (Normally Open) → GPIO 32/33
   - Aktifkan internal pullup di firmware

3. **Upload firmware utama**
   - Edit `config.h`:
     ```cpp
     #define WIFI_SSID "NamaWiFiAnda"
     #define WIFI_PASSWORD "PasswordWiFi"
     #define DEVICE_NAME "Gerbang Utama"
     #define DEVICE_ID "gate-001"
     ```
   - Upload via Arduino IDE

4. **Cek Serial Monitor**
   ```
   Connecting to WiFi...
   Connected! IP: 192.168.1.xxx
   MQTT connected
   Device ready!
   ```

### FASE 5: Pairing dengan Aplikasi (10 menit)

1. Pastikan HP dan ESP32 di jaringan WiFi yang sama
2. Buka aplikasi GATEMATE
3. Pergi ke **Pengaturan → Perangkat → Tambah**
4. Masukkan IP ESP32 (lihat di Serial Monitor)
5. Tap **Test Koneksi**
6. Jika berhasil, beri nama perangkat
7. Test buka/tutup dari aplikasi

---

## Panduan Penggunaan Aplikasi

### ALUR PENGGUNA (End User)

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY MAP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INSTALL        REGISTER       SETUP          USE           │
│     │              │             │             │             │
│     ▼              ▼             ▼             ▼             │
│  ┌──────┐     ┌──────┐     ┌──────┐     ┌──────────┐       │
│  │ Play │     │Email │     │Tambah│     │  Kontrol │       │
│  │Store │────►│Pass  │────►│Device│────►│  Manual  │       │
│  │      │     │Name  │     │      │     │          │       │
│  └──────┘     └──────┘     └──────┘     └────┬─────┘       │
│                                              │              │
│                            ┌─────────────────┼──────────┐   │
│                            │                 │          │   │
│                            ▼                 ▼          ▼   │
│                       ┌────────┐       ┌────────┐  ┌──────┐│
│                       │ Jadwal │       │Geo-Fenc│  │ CCTV ││
│                       │Otomatis│       │   e    │  │      ││
│                       └────────┘       └────────┘  └──────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. Registrasi & Login

| Step | Aksi User | Hasil |
|------|-----------|-------|
| 1 | Buka aplikasi | Splash screen GATEMATE |
| 2 | Tap "Daftar" | Form registrasi muncul |
| 3 | Isi Email | Validasi format email |
| 4 | Isi Password | Min 8 karakter, 1 huruf besar, 1 angka |
| 5 | Isi Nama | Nama tampilan di app |
| 6 | Tap "Daftar" | Akun dibuat di Firebase |
| 7 | Auto-login | Masuk ke Dashboard |

### 2. Dashboard

```
┌─────────────────────────────────────────┐
│ Selamat Pagi 👋                    🔔   │
│ Demo User                               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │ 🚪  │  │ ✅  │  │ 🔓  │             │
│  │  2  │  │  2  │  │  1  │             │
│  │Peran│  │Onlin│  │Terbu│             │
│  │gkat │  │e    │  │ka   │             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│ PERANGKAT ANDA                         │
│ ┌─────────────────────────────────────┐│
│ │ 🚧 Gerbang Utama          TERTUTUP ││
│ │    ● Online                        ││
│ │                                    ││
│ │   [  BUKA  ]    [  TUTUP  ]       ││
│ └─────────────────────────────────────┘│
│                                         │
│ AKTIVITAS TERKINI                      │
│ 🔓 Gerbang dibuka • 5 menit lalu       │
│ 🔒 Gerbang ditutup • 30 menit lalu     │
│                                         │
└─────────────────────────────────────────┘
```

### 3. Kontrol Gerbang

- **Tap device card** → Masuk ke detail kontrol
- **Tombol BUKA** → Kirim perintah buka
- **Tombol TUTUP** → Kirim perintah tutup
- **Status real-time** → Update setiap 2 detik

### 4. Jadwal Otomatis

| Fitur | Cara Pakai |
|-------|------------|
| Tambah Jadwal | Tap "+ Tambah" |
| Set Waktu | Pilih jam:menit |
| Pilih Hari | Centang Sen-Min |
| Pilih Aksi | Buka atau Tutup |
| Aktifkan | Toggle ON |

**Contoh Jadwal:**
- 06:00 Buka (Senin-Jumat)
- 22:00 Tutup (Setiap hari)
- 08:00 Buka (Sabtu-Minggu)

### 5. Geo-Fence (Lokasi Otomatis)

```
CARA KERJA GEO-FENCE:

    ┌──────────────────────────────┐
    │           RUMAH              │
    │             🏠               │
    │       ┌─────────────┐        │
    │       │   200m      │        │
    │       │   radius    │        │
    │       └─────────────┘        │
    │                              │
    │   📱 ────────────────► 🚪    │
    │   User mendekati    Gerbang  │
    │                     BUKA     │
    │                              │
    │   📱 ◄──────────────── 🚪   │
    │   User menjauh      Gerbang  │
    │                     TUTUP    │
    └──────────────────────────────┘
```

**Setup Geo-Fence:**
1. Buka **Pengaturan → Geo-Fence**
2. **Aktifkan** toggle Geo-Fence
3. Tap **"Atur Lokasi Rumah"**
4. Izinkan akses GPS
5. Set **jarak trigger** (50-500m)
6. Aktifkan **"Buka Otomatis"**
7. Aktifkan **"Tutup Otomatis"**
8. Set **delay tutup** (60 detik)

---

## Troubleshooting

### Masalah Hardware

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| ESP32 tidak menyala | Power tidak sampai | Cek PSU output dengan multimeter |
| Motor tidak berputar | Kabel putus/longgar | Cek koneksi L298N ke motor |
| Motor berputar tapi lemah | Tegangan drop | Cek kapasitas PSU, upgrade jika perlu |
| Gerbang tidak berhenti | Limit switch tidak detect | Cek posisi & kabel limit switch |
| Gerbang berhenti di tengah | Overcurrent protection | Cek beban, mungkin ada hambatan |

### Masalah Koneksi

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| ESP32 tidak connect WiFi | SSID/password salah | Edit config.h, re-upload firmware |
| App tidak menemukan device | IP berubah | Set static IP di router |
| Respon lambat | WiFi signal lemah | Pasang range extender |
| Sering disconnect | Interference | Ganti channel WiFi |

### Masalah Aplikasi

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| App crash saat buka | Cache corrupt | Clear app data, reinstall |
| Tidak bisa login | Firebase error | Cek internet, restart app |
| Geo-fence tidak kerja | Permission denied | Aktifkan GPS & location permission |
| Jadwal tidak jalan | Timezone salah | Cek pengaturan waktu di HP |

---

## Kontak Support

- **Email**: support@gatemate.io
- **WhatsApp**: +62 812-xxxx-xxxx
- **GitHub**: [Muhammad-Fauzan22/gatemate-iot](https://github.com/Muhammad-Fauzan22/gatemate-iot)
- **Dokumentasi**: https://gatemate.io/docs

---

*Dokumentasi ini dibuat untuk GATEMATE IoT System v2.0*
*Last updated: January 2026*
