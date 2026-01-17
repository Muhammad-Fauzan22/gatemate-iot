# PROPOSAL PROYEK AKHIR

---

<div align="center">

# RANCANG BANGUN SISTEM KONTROL GERBANG OTOMATIS BERBASIS INTERNET OF THINGS (IoT) MENGGUNAKAN ESP32 DAN APLIKASI MOBILE

## **"GATEMATE - Smart IoT Gate Control System"**

---

### PROPOSAL PROYEK AKHIR

Diajukan untuk memenuhi salah satu syarat  
memperoleh gelar Sarjana Teknik

---

**Disusun oleh:**

**MUHAMMAD FAUZAN**  
NIM: XXXXXXXXXX

---

**PROGRAM STUDI TEKNIK INFORMATIKA**  
**FAKULTAS TEKNIK**  
**UNIVERSITAS XXXXXXXXXX**  
**2026**

</div>

---

<div style="page-break-after: always;"></div>

## LEMBAR PENGESAHAN

<br><br>

**Judul Proyek:** Rancang Bangun Sistem Kontrol Gerbang Otomatis Berbasis Internet of Things (IoT) Menggunakan ESP32 dan Aplikasi Mobile

**Nama:** Muhammad Fauzan  
**NIM:** XXXXXXXXXX  
**Program Studi:** Teknik Informatika

<br>

Telah diperiksa dan disetujui oleh:

<br><br>

| | |
|---|---|
| **Pembimbing I** | **Pembimbing II** |
| | |
| | |
| (________________________) | (________________________) |
| NIP. | NIP. |

<br><br>

Mengetahui,  
**Ketua Program Studi Teknik Informatika**

<br><br>

(________________________)  
NIP.

---

<div style="page-break-after: always;"></div>

## DAFTAR ISI

| | Halaman |
|---|---:|
| **HALAMAN JUDUL** | i |
| **LEMBAR PENGESAHAN** | ii |
| **DAFTAR ISI** | iii |
| **DAFTAR GAMBAR** | v |
| **DAFTAR TABEL** | vi |
| | |
| **BAB I PENDAHULUAN** | 1 |
| 1.1 Latar Belakang | 1 |
| 1.2 Rumusan Masalah | 3 |
| 1.3 Tujuan Proyek | 4 |
| 1.4 Manfaat Proyek | 4 |
| 1.5 Batasan Masalah | 5 |
| | |
| **BAB II TINJAUAN PUSTAKA** | 6 |
| 2.1 Landasan Teori | 6 |
| 2.2 Penelitian Terkait | 12 |
| | |
| **BAB III METODOLOGI PERANCANGAN** | 14 |
| 3.1 Diagram Blok Sistem | 14 |
| 3.2 Perancangan Hardware | 16 |
| 3.3 Perancangan Software | 22 |
| 3.4 Prosedur Pengujian | 26 |
| | |
| **BAB IV JADWAL DAN ANGGARAN** | 28 |
| 4.1 Jadwal Pelaksanaan | 28 |
| 4.2 Rencana Anggaran Biaya | 29 |
| | |
| **DAFTAR PUSTAKA** | 31 |
| **LAMPIRAN** | 33 |

---

<div style="page-break-after: always;"></div>

## DAFTAR GAMBAR

| No | Judul Gambar | Halaman |
|---|---|---:|
| Gambar 1.1 | Diagram Permasalahan Gerbang Konvensional | 2 |
| Gambar 2.1 | Arsitektur Chip ESP32 | 7 |
| Gambar 2.2 | Prinsip Kerja Sensor Arus ACS712 | 9 |
| Gambar 2.3 | Prinsip Kerja Sensor IR Obstacle | 10 |
| Gambar 2.4 | Arsitektur Progressive Web App (PWA) | 11 |
| Gambar 3.1 | Diagram Blok Sistem GATEMATE | 14 |
| Gambar 3.2 | Arsitektur Sistem Keseluruhan | 15 |
| Gambar 3.3 | Skema Rangkaian ESP32 Controller | 17 |
| Gambar 3.4 | Koneksi Relay ke Motor | 19 |
| Gambar 3.5 | Layout PCB Controller | 20 |
| Gambar 3.6 | Desain Enclosure 3D | 21 |
| Gambar 3.7 | Flowchart Firmware ESP32 | 23 |
| Gambar 3.8 | Flowchart Aplikasi Mobile | 24 |
| Gambar 3.9 | Mockup UI Aplikasi | 25 |
| Gambar 4.1 | Gantt Chart Pelaksanaan Proyek | 28 |

---

## DAFTAR TABEL

| No | Judul Tabel | Halaman |
|---|---|---:|
| Tabel 2.1 | Spesifikasi ESP32 DevKit V1 | 7 |
| Tabel 2.2 | Perbandingan dengan Penelitian Terkait | 13 |
| Tabel 3.1 | Pin Mapping ESP32 | 18 |
| Tabel 3.2 | Daftar Komponen Controller | 20 |
| Tabel 3.3 | Opsi Motor Gerbang | 21 |
| Tabel 3.4 | API Endpoints | 25 |
| Tabel 3.5 | Test Case Pengujian Fungsional | 26 |
| Tabel 3.6 | Test Case Pengujian Keamanan | 27 |
| Tabel 4.1 | Timeline Pelaksanaan | 28 |
| Tabel 4.2 | Rencana Anggaran Biaya (RAB) | 29 |

---

<div style="page-break-after: always;"></div>

# BAB I
# PENDAHULUAN

## 1.1 Latar Belakang

Perkembangan teknologi Internet of Things (IoT) telah membawa perubahan signifikan dalam berbagai aspek kehidupan manusia, termasuk dalam bidang smart home dan sistem keamanan rumah. Salah satu komponen penting dalam sistem keamanan rumah adalah gerbang, yang berfungsi sebagai penghalang fisik pertama untuk mengontrol akses masuk dan keluar area.

Gerbang konvensional yang dioperasikan secara manual memiliki beberapa keterbatasan yang mengurangi kenyamanan dan keamanan pengguna. Pertama, pengguna harus turun dari kendaraan untuk membuka dan menutup gerbang secara manual, yang tidak praktis terutama saat cuaca buruk atau dalam kondisi terburu-buru. Kedua, penggunaan kunci fisik memiliki risiko keamanan karena dapat diduplikasi atau hilang. Ketiga, tidak ada sistem monitoring yang dapat memberikan informasi real-time tentang status gerbang dan aktivitas keluar masuk.

Solusi yang ada saat ini seperti remote control berbasis frekuensi radio (RF) memiliki keterbatasan jarak jangkauan dan tidak dapat dioperasikan dari lokasi yang jauh. Sementara itu, sistem berbasis SMS memerlukan biaya pulsa dan memiliki delay yang tinggi. Sistem gerbang otomatis komersial yang tersedia di pasaran memiliki harga yang relatif mahal dan seringkali tidak dapat dikustomisasi sesuai kebutuhan spesifik pengguna.

Berdasarkan permasalahan tersebut, diperlukan sebuah sistem kontrol gerbang otomatis yang dapat dioperasikan secara remote melalui jaringan internet, memiliki fitur keamanan yang lengkap, dan dapat diakses melalui smartphone. Sistem ini harus dapat bekerja dengan andal, memiliki biaya yang terjangkau, dan mudah diimplementasikan.

Mikrokontroler ESP32 dipilih sebagai otak dari sistem ini karena memiliki kemampuan WiFi dan Bluetooth dalam satu chip, memiliki performa yang tinggi dengan dual-core processor, serta harga yang terjangkau. Dengan menggunakan ESP32, sistem dapat terhubung langsung ke jaringan WiFi rumah dan berkomunikasi dengan server cloud atau langsung dengan smartphone pengguna.

Untuk antarmuka pengguna, dikembangkan aplikasi berbasis Progressive Web App (PWA) yang dapat diakses melalui browser web dan dapat diinstall di smartphone seperti aplikasi native. Pendekatan PWA dipilih karena dapat berjalan di berbagai platform (iOS, Android, desktop) tanpa perlu publish ke app store, sehingga mengurangi kompleksitas distribusi dan update aplikasi.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan, rumusan masalah dalam proyek ini adalah:

1. Bagaimana merancang dan membangun sistem kontrol gerbang otomatis berbasis ESP32 yang dapat dioperasikan secara remote melalui jaringan WiFi?

2. Bagaimana mengintegrasikan sensor keamanan (obstacle detection, current monitoring, limit switch) untuk mencegah kecelakaan dan kerusakan pada mekanisme gerbang?

3. Bagaimana memastikan sistem tetap dapat berfungsi (fail-safe) ketika terjadi gangguan koneksi internet?

4. Bagaimana mengembangkan aplikasi mobile yang user-friendly untuk mengontrol dan memonitor status gerbang secara real-time?

5. Bagaimana memberikan akses kepada tamu secara aman tanpa memberikan akses permanen ke sistem?

## 1.3 Tujuan Proyek

Tujuan dari proyek ini adalah:

1. **Tujuan Umum:**
   Merancang dan membangun sistem kontrol gerbang otomatis berbasis Internet of Things (IoT) yang dapat meningkatkan kenyamanan dan keamanan pengguna.

2. **Tujuan Khusus:**
   - Merancang rangkaian elektronik controller gerbang menggunakan mikrokontroler ESP32
   - Mengembangkan firmware ESP32 dengan fitur kontrol motor, pembacaan sensor, dan komunikasi WiFi/MQTT
   - Mengimplementasikan sistem keamanan meliputi obstacle detection, current monitoring, temperature monitoring, dan limit switch
   - Membangun aplikasi Progressive Web App (PWA) untuk kontrol dan monitoring gerbang via smartphone
   - Mengimplementasikan sistem penjadwalan otomatis buka/tutup gerbang
   - Mengembangkan fitur akses tamu dengan QR code atau link sementara

## 1.4 Manfaat Proyek

### 1.4.1 Manfaat Bagi Pengguna

- **Kenyamanan:** Pengguna dapat mengontrol gerbang dari dalam kendaraan atau dari jarak jauh tanpa perlu turun dari kendaraan
- **Keamanan:** Sistem memberikan notifikasi real-time setiap kali gerbang dibuka/ditutup, sehingga pengguna dapat memantau aktivitas
- **Efisiensi:** Fitur penjadwalan memungkinkan gerbang terbuka/tertutup otomatis pada waktu tertentu
- **Fleksibilitas:** Akses tamu dapat diberikan secara temporer tanpa mengorbankan keamanan

### 1.4.2 Manfaat Bagi Pengembangan Ilmu

- Memberikan kontribusi pada bidang IoT dan embedded systems
- Menjadi referensi untuk proyek smart home berbasis ESP32
- Dokumentasi yang lengkap dapat digunakan sebagai bahan pembelajaran

### 1.4.3 Manfaat Bagi Industri

- Proof of concept untuk produk smart gate yang dapat dikomersialisasikan
- Template sistem yang dapat dikembangkan lebih lanjut

## 1.5 Batasan Masalah

Untuk memfokuskan proyek agar dapat diselesaikan sesuai target, ditentukan batasan-batasan sebagai berikut:

1. Sistem dirancang khusus untuk gerbang tipe sliding (geser) dengan satu arah gerak
2. Jarak kontrol maksimal dibatasi oleh jangkauan jaringan WiFi rumah (dapat diperluas dengan repeater)
3. Motor yang didukung adalah motor DC 12V/24V atau motor AC 220V dengan relay switching
4. Proyek ini fokus pada sistem elektronik dan software, tidak mencakup instalasi mekanis gerbang
5. Aplikasi dikembangkan sebagai Progressive Web App, bukan aplikasi native
6. Backend server menggunakan layanan cloud dengan free tier (Vercel, Firebase)
7. Pengujian dilakukan pada skala prototype, bukan instalasi skala penuh

---

<div style="page-break-after: always;"></div>
