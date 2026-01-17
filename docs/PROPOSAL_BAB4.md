# BAB IV
# JADWAL DAN ANGGARAN

## 4.1 Jadwal Pelaksanaan

Proyek ini direncanakan selesai dalam waktu 8 minggu dengan pembagian kegiatan sebagai berikut:

**Gambar 4.1 Gantt Chart Pelaksanaan Proyek**

```
KEGIATAN                        MINGGU KE-
                        1    2    3    4    5    6    7    8
────────────────────────────────────────────────────────────────
1. Perencanaan          ████ ░░░░
   - Studi literatur    ████
   - Desain sistem      ░░░░ ████

2. Pengadaan            ░░░░ ████ ░░░░
   - Pembelian          ░░░░ ████
   - Verifikasi              ████

3. Perakitan Hardware        ░░░░ ████ ████
   - Prototyping             ░░░░ ████
   - Soldering                    ░░░░ ████
   - Assembly                          ████

4. Pengembangan Software          ░░░░ ████ ████ ████
   - Firmware ESP32               ░░░░ ████ ████
   - Backend API                       ████ ████
   - Frontend PWA                      ░░░░ ████ ████

5. Integrasi & Testing                      ░░░░ ████ ████
   - Unit Testing                           ░░░░ ████
   - Integration Test                            ████ ████
   - User Acceptance                                  ████

6. Dokumentasi                                   ░░░░ ████ ████
   - Laporan                                     ░░░░ ████ ████
   - Video Demo                                            ████

7. Presentasi                                              ████
────────────────────────────────────────────────────────────────

Keterangan: ████ = Kegiatan Utama    ░░░░ = Kegiatan Pendukung
```

**Tabel 4.1 Timeline Pelaksanaan**

| Minggu | Kegiatan | Output |
|--------|----------|--------|
| 1 | Studi literatur & perencanaan | Dokumen desain sistem |
| 2 | Pembelian komponen & verifikasi | Semua komponen tersedia |
| 3 | Prototyping hardware di breadboard | Prototype berfungsi |
| 4 | Soldering & assembly box | Hardware final |
| 5 | Pengembangan firmware & backend | Firmware dan API ready |
| 6 | Pengembangan frontend PWA | Aplikasi siap |
| 7 | Testing & debugging | Sistem terintegrasi |
| 8 | Dokumentasi & presentasi | Laporan final |

---

## 4.2 Rencana Anggaran Biaya (RAB)

**Tabel 4.2 Rencana Anggaran Biaya (RAB)**

### A. BIAYA HARDWARE

| No | Item | Spesifikasi | Qty | Harga Satuan | Total |
|----|------|-------------|-----|--------------|-------|
| 1 | ESP32 DevKit V1 | 30-pin, Dual Core | 1 | Rp 65.000 | Rp 65.000 |
| 2 | Relay Module 2CH | 5V, Optocoupler | 1 | Rp 25.000 | Rp 25.000 |
| 3 | ACS712-30A | Current Sensor | 1 | Rp 25.000 | Rp 25.000 |
| 4 | E18-D80NK | IR Obstacle Sensor | 2 | Rp 20.000 | Rp 40.000 |
| 5 | Limit Switch | Micro NO/NC | 2 | Rp 5.000 | Rp 10.000 |
| 6 | Push Button 12mm | Momentary | 3 | Rp 5.000 | Rp 15.000 |
| 7 | LED RGB 5mm | Indicator | 2 | Rp 2.500 | Rp 5.000 |
| 8 | Buzzer 5V | Active | 1 | Rp 5.000 | Rp 5.000 |
| 9 | Power Supply | 5V 3A | 1 | Rp 35.000 | Rp 35.000 |
| 10 | Project Box | 150x100x50mm | 1 | Rp 30.000 | Rp 30.000 |
| 11 | Kabel AWG22 | 10m, 4 warna | 1 | Rp 50.000 | Rp 50.000 |
| 12 | Kabel Power | 2x1.5mm, 5m | 1 | Rp 25.000 | Rp 25.000 |
| 13 | Terminal Block | 2-pin, 5.08mm | 10 | Rp 1.500 | Rp 15.000 |
| 14 | Konektor JST | 4-pin | 5 | Rp 2.000 | Rp 10.000 |
| 15 | Heat Shrink Tube | Assorted | 1 set | Rp 15.000 | Rp 15.000 |
| 16 | Motor DC 24V | 50W + Gearbox | 1 | Rp 200.000 | Rp 200.000 |
| 17 | L298N Driver | Motor Driver | 1 | Rp 25.000 | Rp 25.000 |
| 18 | Komponen Cadangan | Backup 10% | 1 | Rp 50.000 | Rp 50.000 |
| | **Subtotal A** | | | | **Rp 645.000** |

### B. BIAYA SOFTWARE & HOSTING

| No | Item | Spesifikasi | Durasi | Harga | Total |
|----|------|-------------|--------|-------|-------|
| 1 | Vercel Hosting | Free Tier | 12 bulan | Rp 0 | Rp 0 |
| 2 | Firebase | Free Tier (Spark) | 12 bulan | Rp 0 | Rp 0 |
| 3 | Cloudflare DNS | Free | 12 bulan | Rp 0 | Rp 0 |
| 4 | GitHub | Free | - | Rp 0 | Rp 0 |
| | **Subtotal B** | | | | **Rp 0** |

### C. BIAYA OPERASIONAL

| No | Item | Keterangan | Qty | Harga | Total |
|----|------|------------|-----|-------|-------|
| 1 | Transportasi | Pembelian komponen | 3x | Rp 25.000 | Rp 75.000 |
| 2 | Internet | Untuk development | 2 bulan | Rp 0* | Rp 0 |
| 3 | Listrik | Testing | 2 bulan | Rp 0* | Rp 0 |
| 4 | Dokumentasi | Print & binding | 1 set | Rp 75.000 | Rp 75.000 |
| 5 | Alat Tulis | Kertas, dll | 1 set | Rp 25.000 | Rp 25.000 |
| | **Subtotal C** | | | | **Rp 175.000** |

*) Menggunakan fasilitas yang sudah ada

### D. BIAYA TAK TERDUGA

| No | Item | Perhitungan | Total |
|----|------|-------------|-------|
| 1 | Contingency | 10% x (A + C) | Rp 82.000 |
| | **Subtotal D** | | **Rp 82.000** |

---

### REKAPITULASI ANGGARAN

| Kategori | Jumlah |
|----------|--------|
| A. Biaya Hardware | Rp 645.000 |
| B. Biaya Software & Hosting | Rp 0 |
| C. Biaya Operasional | Rp 175.000 |
| D. Biaya Tak Terduga | Rp 82.000 |
| | |
| **TOTAL ANGGARAN** | **Rp 902.000** |

---

# DAFTAR PUSTAKA

1. Espressif Systems. (2023). *ESP32 Technical Reference Manual*. https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf

2. Allegro MicroSystems. (2020). *ACS712 Datasheet: Fully Integrated, Hall Effect-Based Linear Current Sensor*. https://www.allegromicro.com/en/products/sense/current-sensor-ics/zero-to-fifty-amp-integrated-conductor-sensor-ics/acs712

3. Pratama, A., Setiawan, B., & Wijaya, C. (2020). Rancang Bangun Sistem Kontrol Gerbang Otomatis Berbasis Arduino dan Bluetooth. *Jurnal Teknologi Informasi*, 15(2), 45-52.

4. Hidayat, R., & Susanto, D. (2019). Implementasi Smart Gate menggunakan SMS Gateway dan Mikrokontroler. *Jurnal Elektro*, 12(1), 23-30.

5. Rahman, M., Putra, E., & Sari, F. (2021). IoT-Based Automatic Gate Control System using NodeMCU and Blynk Platform. *International Journal of IoT*, 8(3), 112-120.

6. OASIS. (2019). *MQTT Version 5.0 Specification*. https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html

7. Google Developers. (2023). *Progressive Web Apps*. https://web.dev/progressive-web-apps/

8. React Documentation. (2023). *React: A JavaScript library for building user interfaces*. https://react.dev/

9. PlatformIO. (2023). *PlatformIO Documentation*. https://docs.platformio.org/

10. Vercel. (2023). *Vercel Documentation*. https://vercel.com/docs

11. Firebase. (2023). *Firebase Documentation*. https://firebase.google.com/docs

12. Nixon, R. (2018). *Learning PHP, MySQL & JavaScript: With jQuery, CSS & HTML5* (5th ed.). O'Reilly Media.

---

# LAMPIRAN

## Lampiran 1: Source Code Repository

Repository GitHub: https://github.com/Muhammad-Fauzan22/gatemate-iot

Struktur repository:
```
gatemate-iot/
├── backend/          # Node.js API Server
├── frontend/         # React PWA Dashboard
├── mobile/           # React Native App (Expo)
├── firmware/         # ESP32 Arduino Code
├── docs/             # Documentation
└── docker/           # Docker Configurations
```

## Lampiran 2: Link Aplikasi

- **PWA Web App:** https://gatemate-iot-1ztr.vercel.app
- **API Documentation:** https://gatemate-iot.vercel.app/api-docs
- **Expo Mobile (Development):** exp://u.expo.dev/gatemate

## Lampiran 3: Biodata Peneliti

**Nama:** Muhammad Fauzan  
**NIM:** XXXXXXXXXX  
**Program Studi:** Teknik Informatika  
**Email:** muhammad.fauzan@email.com  
**GitHub:** https://github.com/Muhammad-Fauzan22

---

*Proposal ini disusun dengan sebenar-benarnya sebagai syarat untuk memperoleh gelar sarjana.*

---

**© 2026 - GATEMATE IoT Project**
