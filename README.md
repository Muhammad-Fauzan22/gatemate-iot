# 🚪 GATEMATE - IoT Gate Control System

<div align="center">

![GATEMATE Logo](docs/assets/logo.png)

**Sistema Kontrol Gerbang IoT yang Lengkap dan Aman**

[![GitHub Stars](https://img.shields.io/github/stars/Muhammad-Fauzan22/gatemate-iot?style=social)](https://github.com/Muhammad-Fauzan22/gatemate-iot)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Muhammad-Fauzan22/gatemate-iot/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Muhammad-Fauzan22/gatemate-iot/ci.yml?branch=master)](https://github.com/Muhammad-Fauzan22/gatemate-iot/actions)

[Demo](https://expo.dev/@muhammadfauzans-organization/gatemate-mobile-app) • [Dokumentasi](docs/) • [API Reference](https://api.gatemate.io/api-docs)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Autentikasi Aman** | JWT dengan refresh token, rate limiting |
| 📱 **Mobile App** | React Native dengan Expo (Android & iOS) |
| 🌐 **Web Dashboard** | React + Vite dengan real-time updates |
| 🚪 **Kontrol Gerbang** | Buka/tutup secara real-time via MQTT |
| ⏰ **Penjadwalan** | Otomatisasi buka/tutup berdasarkan waktu |
| 📍 **Geo-Fence** | Auto buka/tutup berdasarkan lokasi |
| 👥 **Akses Tamu** | QR code untuk akses sementara |
| 📹 **Integrasi CCTV** | Streaming kamera keamanan |
| 🔔 **Notifikasi** | Push notifications untuk semua aktivitas |
| 📊 **Dashboard Monitoring** | Status perangkat real-time |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Web Dashboard  │     │   ESP32 Device  │
│  (React Native) │     │  (React + Vite)  │     │   (Firmware)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────┬───────┴───────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx  │
                    │ (Proxy) │
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │ Backend │    │  Mosquitto │   │   Redis   │
    │ (Node)  │◄──►│   (MQTT)   │   │  (Cache)  │
    └────┬────┘    └───────────┘   └───────────┘
         │
    ┌────▼────┐
    │PostgreSQL│
    └─────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Expo CLI (untuk mobile)

### 1. Clone Repository

```bash
git clone https://github.com/Muhammad-Fauzan22/gatemate-iot.git
cd gatemate-iot
```

### 2. Setup Environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Mobile
cp mobile/.env.example mobile/.env
```

### 3. Run dengan Docker

```bash
# Development
docker-compose up -d

# Atau manual
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
cd mobile && npm install && npx expo start
```

### 4. Akses Aplikasi

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs | http://localhost:5000/api-docs |
| Mobile (Expo) | exp://localhost:8081 |

---

## 📁 Struktur Proyek

```
gatemate-iot/
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── config/         # Environment & Swagger
│   │   ├── middleware/     # Auth, Rate Limit, Security
│   │   ├── modules/        # Auth, Devices, Schedules, Guest
│   │   └── utils/          # Validation, Helpers
│   ├── tests/              # Unit & Integration Tests
│   ├── prisma/             # Database Schema
│   └── Dockerfile
├── frontend/               # React Web Dashboard
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # Route Pages
│   │   ├── stores/         # Zustand Stores
│   │   └── services/       # API Services
│   └── Dockerfile
├── mobile/                 # React Native App
│   ├── src/
│   │   ├── screens/        # App Screens
│   │   ├── navigation/     # React Navigation
│   │   ├── stores/         # State Management
│   │   └── services/       # Notification, WebSocket
│   ├── app.json            # Expo Config
│   └── eas.json            # EAS Build Config
├── firmware/               # ESP32 Arduino Code
│   └── gatemate_firmware/
├── docs/                   # Documentation
├── docker/                 # Docker Configs
├── .github/workflows/      # CI/CD Pipeline
└── docker-compose.yml
```

---

## 🔧 Konfigurasi

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/gatemate
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key
MQTT_BROKER_URL=mqtt://localhost:1883

# Mobile
EXPO_PUBLIC_API_URL=http://192.168.1.x:5000
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-key
```

---

## 📱 Mobile App

### Development

```bash
cd mobile
npm install
npx expo start
```

### Build APK

```bash
# Preview (APK untuk testing)
npx eas build --profile preview --platform android

# Production (AAB untuk Play Store)
npx eas build --profile production --platform android
```

### OTA Update

```bash
npx eas update --branch production --message "Update message"
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:watch         # Watch mode

# Test coverage
npm test -- --coverage
```

---

## 🐳 Docker Deployment

```bash
# Build & run all services
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Stop all
docker-compose down
```

---

## 📊 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Registrasi user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/devices` | List perangkat |
| POST | `/api/v1/devices/:id/command` | Kirim perintah |
| GET | `/api/v1/schedules` | List jadwal |
| POST | `/api/v1/guest` | Buat akses tamu |

📖 Dokumentasi lengkap: `/api-docs`

---

## 🔐 Keamanan

- ✅ JWT Authentication dengan Refresh Token
- ✅ Rate Limiting (Auth: 5/15min, API: 100/min)
- ✅ Input Validation (Zod)
- ✅ Security Headers (Helmet, CSP)
- ✅ Request Sanitization
- ✅ Audit Logging
- ✅ CORS Configuration

---

## 📈 Status Proyek

| Komponen | Progress | Status |
|----------|----------|--------|
| Backend API | 95% | ✅ Production Ready |
| Mobile App | 90% | ✅ Published |
| Web Frontend | 75% | 🔄 In Progress |
| ESP32 Firmware | 85% | ✅ Stable |
| DevOps | 90% | ✅ Configured |

**Overall: 92% Complete**

---

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

---

## 📝 License

Distributed under the Bapak Narji License. See `LICENSE` for more information.

---

## 📞 Contact

**Smart Gate Solutions**  
Email: punyofauzan3@gmail.com  
Website: 

---

<div align="center">

**Made with ❤️ by Smart Gate Solutions**

⭐ Star this repo if you find it useful!

</div>

