# 🚪 GATEMATE - Smart IoT Gate Control System

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.5-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-ESP32%20%7C%20Web%20%7C%20Mobile-orange.svg)

**Sistem kontrol gerbang pintar berbasis IoT dengan fitur lengkap untuk keamanan rumah modern**

[Quick Start](#-quick-start) • [Features](#-features) • [Installation](#-installation) • [User Guide](#-user-guide) • [API Docs](#-api-documentation)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Remote Control** | Buka/tutup gerbang dari mana saja via app |
| 📅 **Smart Scheduling** | Jadwal otomatis buka/tutup gerbang |
| 👥 **Multi-User** | Kelola akses untuk keluarga & ART |
| 🎫 **Guest Access** | QR code sementara untuk tamu/kurir |
| 📊 **Diagnostics** | Monitor kesehatan device real-time |
| 🔔 **Notifications** | Push notification untuk setiap aktivitas |
| 🛡️ **Safety First** | Watchdog, current/temp protection |
| 📱 **PWA + Mobile** | Web app + React Native |

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ESP32      │────▶│   Backend    │◀────│   Frontend   │
│   Firmware   │MQTT │   Node.js    │REST │   React PWA  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    │
       │            ┌──────────────┐             │
       │            │  PostgreSQL  │             │
       │            │  + Redis     │             │
       │            └──────────────┘             │
       │                                         │
       ▼                                         ▼
┌──────────────┐                        ┌──────────────┐
│   Gerbang    │                        │  Mobile App  │
│   Fisik      │                        │  React Native│
└──────────────┘                        └──────────────┘
```

---

## � Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- ESP32 DevKit (untuk firmware)

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/gatemate.git
cd gatemate
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.production .env  # Edit dengan credentials Anda
npm run db:migrate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Buka http://localhost:5173
```

### 4. ESP32 Firmware
```bash
cd firmware
# Buka dengan PlatformIO
# Edit config.h dengan WiFi credentials
# Upload ke ESP32
```

---

## 📱 User Guide

### Fase 1: Unboxing & Install Hardware
1. Buka kemasan GATEMATE
2. Pasang controller ke wiring gerbang
3. Hubungkan ke power supply 12V
4. LED akan berkedip menandakan siap setup

### Fase 2: Setup WiFi (AP Mode)
1. Pada HP, buka **Settings > WiFi**
2. Connect ke: `GATEMATE-SETUP` (password: `12345678`)
3. Buka browser → `192.168.4.1`
4. Masukkan nama WiFi rumah & password
5. Tunggu device restart & terkoneksi

### Fase 3: Install Aplikasi
- **Web App**: Buka `https://app.gatemate.com` di browser
- **Android**: Download dari Play Store (coming soon)
- **iOS**: Download dari App Store (coming soon)

### Fase 4: Pairing Device
1. Buka aplikasi GATEMATE
2. Login/Register akun baru
3. Tap **"+ Tambah Device"**
4. Pilih **Scan Jaringan** atau masukkan IP manual
5. Beri nama device (misal: "Gerbang Depan")
6. Device siap digunakan! ✅

### Fase 5: Kontrol Gerbang
| Aksi | Langkah |
|------|---------|
| **Buka** | Tap tombol hijau "OPEN" |
| **Tutup** | Tap tombol merah "CLOSE" |
| **Stop** | Tap "STOP" saat bergerak |
| **Partial** | Geser slider ke persentase yang diinginkan |

### Fase 6: Guest Access (QR untuk Tamu)
1. Buka menu **"Guest Access"**
2. Pilih durasi akses (1-24 jam)
3. Pilih permission (Buka/Tutup)
4. Tap **"Generate QR"**
5. Share ke tamu via WhatsApp
6. Tamu scan QR → langsung bisa kontrol

### Fase 7: Kelola Anggota Keluarga
1. Buka menu **"Manage Users"**
2. Tap **"+ Invite"**
3. Masukkan email anggota keluarga
4. Pilih role:
   - **Admin**: Full control + kelola user
   - **Operator**: Buka/tutup saja
   - **Viewer**: Lihat status saja
5. Undangan dikirim via email

### Fase 8: Smart Schedule
1. Buka menu **"Schedule"**
2. Tap **"+ Add Schedule"**
3. Pilih aksi (Buka/Tutup)
4. Set waktu & pengulangan
5. Contoh: "Buka jam 06:00 setiap hari kerja"

### Fase 9: Diagnostics & Troubleshooting
1. Buka menu **"Diagnostics"**
2. Tap **"Run System Check"**
3. Lihat status setiap komponen:
   - ✅ OK = Normal
   - ⚠️ Warning = Perlu perhatian
   - ❌ Error = Perlu tindakan
4. Ikuti rekomendasi yang muncul

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Device offline | 1. Cek power supply<br>2. Cek router WiFi<br>3. Restart device |
| Gerbang tidak bergerak | 1. Cek motor wiring<br>2. Cek limit switch<br>3. Diagnostics > Motor Test |
| App tidak bisa login | 1. Cek koneksi internet<br>2. Reset password<br>3. Clear app data |
| QR tidak berfungsi | 1. Cek expiry time<br>2. Generate ulang<br>3. Pastikan tamu punya internet |

---

## � API Documentation

Full API documentation: [docs/api/openapi.yaml](docs/api/openapi.yaml)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | User login |
| `POST` | `/api/v1/commands/:deviceId/open` | Buka gerbang |
| `POST` | `/api/v1/commands/:deviceId/close` | Tutup gerbang |
| `GET` | `/api/v1/devices` | List semua device |
| `POST` | `/api/v1/guest/create` | Buat guest pass |
| `GET` | `/api/v1/schedules` | List schedules |

---

## � Security

- ✅ JWT Authentication (15min access + 7day refresh)
- ✅ Rate Limiting (100 req/15min)
- ✅ Input Validation (Zod)
- ✅ XSS & SQL Injection Protection
- ✅ HTTPS/TLS Encryption
- ✅ Role-Based Access Control

---

## 🐳 Deployment

### Development
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Production
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

---

## � Project Structure

```
GATE PROJECT/
├── firmware/          # ESP32 PlatformIO
├── backend/           # Node.js Express API
├── frontend/          # React PWA (Vite)
├── mobile/            # React Native Expo
├── docker/            # Docker configs
├── docs/              # API & User docs
└── .github/           # CI/CD workflows
```

---

## 🤝 Support

- 📧 Email: support@gatemate.com
- 📱 WhatsApp: +62 xxx-xxxx-xxxx
- 🌐 Website: https://gatemate.com

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

<div align="center">
Made with ❤️ by Smart Gate Solutions
</div>
