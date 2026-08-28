# Lewi House Medan — Sistem Manajemen Kosan & Guesthouse Syariah

## Overview Properti & Konsep
**Lewi House Medan** (juga terdaftar sebagai **Lewi House Syariah** dan **Kost Lewi House**) beroperasi sebagai akomodasi *hybrid*:
1. **Kost Eksklusif (Boarding House)**: Sewa kamar jangka panjang bulanan dan mingguan untuk mahasiswa, pekerja/profesional, dan tamu long-stay, terdaftar pada platform seperti [Mamikos](https://mamikos.com/room/kost-medan-kost-campur-eksklusif-kost-lewi-house-tipe-a-medan-petisah-1) dan [IdKos](https://idkos.com/kost-kota-medan-kost-lewi-house-tipe-exclusive).
2. **Guesthouse / Budget Hotel**: Menginap harian jangka pendek yang dikelola dengan kebijakan Syariah (*Syariah-compliant policy*), tersedia di platform [Traveloka](https://www.traveloka.com/id-id/hotel/indonesia/lewi-house-syariah-3000010036251), [Tiket.com](https://www.tiket.com/id-id/hotel/indonesia/lewi-house-syariah-310001602128725593), [Agoda](https://www.agoda.com/id-id/lewi-house/hotel/medan-id.html), dan [KKday](https://www.kkday.com/en-sg/hotel/product/455531).

---

## Lokasi & Kontak Properti
- **Alamat**: [Jl. Sei Bahkapuran No. 16A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119](https://www.tiket.com/id-id/hotel/indonesia/lewi-house-syariah-310001602128725593)
- **Telepon / WhatsApp**: [+62 812-6296-0211](https://wa.me/6281262960211)
- **Layanan On-Site**: Terhubung langsung dengan **LEWI Laundry** di lokasi.
- **Ukuran Gedung**: **4 Lantai** dengan total **17 Kamar**.

---

## Spesifikasi & Tipe Kamar
- **Tipe Kos**: Kost Campur Eksklusif (pria & wanita / profesional & mahasiswa).
- **Periode Sewa**: Bulanan (monthly), Mingguan (weekly), dan Harian (daily).
- **3 Tingkatan / Kategori Kamar (Room Tiers)**:
  1. **Tipe A / Exclusive / VIP**: Kamar lebih luas (~20 m²), double bed / springbed Queen, meja kerja & kursi, lemari pakaian dengan cermin, kamar mandi dalam, dan Smart TV.
  2. **Tipe B / Superior**: Tata letak standard double atau large single (~18 m²), AC, dan kamar mandi dalam.
  3. **Tipe C / Single Standard**: Tata letak individu kompak (~16 m² dengan kasur 1.2 × 2 m), AC, dan kamar mandi dalam.

- **Fasilitas Kamar (In-Room Amenities)**:
  - Air Conditioning (AC) Dingin
  - Kamar mandi dalam (*private en-suite*) dengan shower & kloset duduk
  - Springbed & bed cover set
  - Lemari pakaian & rak gantung baju (*clothing rack*)
  - TV dan colokan listrik memadai
  - Akses Wi-Fi berkecepatan tinggi

- **Fasilitas Bersama Penghuni**:
  - Dapur bersama / Pantry (*shared kitchen*)
  - Ruang tamu / Communal lounge bersama
  - *Rooftop terrace* dan area olahraga terbuka (*open-air workout area*)
  - Akses gedung 24 jam & pengawasan CCTV keamanan
  - Area parkir on-site untuk mobil dan sepeda motor
  - Layanan cuci & setrika LEWI Laundry di lokasi

---

## Detail Guesthouse & Daily Stay
- **Check-In / Check-Out**: Check-in mulai 14:00 WIB (2:00 PM); check-out maksimal 12:00 WIB (12:00 PM) dengan meja resepsionis 24 jam.
- **Kebijakan Syariah**: Pasangan suami istri yang menginap dalam satu kamar wajib menunjukkan Buku Nikah atau identitas pernikahan resmi yang sah saat check-in.
- **Tata Tertib (House Rules)**:
  - Bebas rokok di dalam area kamar (tersedia zona khusus merokok)
  - Minuman beralkohol dilarang keras
  - Hewan peliharaan (*pets*) tidak diperkenankan
  - Anak usia 0–3 tahun menginap gratis menggunakan tempat tidur yang ada

---

## Akses Transportasi & Sekitar Properti
- **Transit & Bandara**:
  - ~2.7 km dari Stasiun Kereta Api Medan (*Medan Train Station*)
  - ~25 km dari Bandara Internasional Kualanamu (*KNO*)
  - Dekat dengan hub shuttle bus Damri Bandara di Plaza Medan Fair / Carrefour
- **Taman & Landmark**: Taman Gajah Mada (~330 m), Lapangan Benteng (~1.9 km), dan Politeknik LP3I Medan (~220 m).
- **Fasilitas Medis**: RS Advent Medan, Sumatera Eye Center (SMEC), RS Bunda Thamrin, RS Siti Hajar, dan RS Universitas Sumatera Utara (USU).
- **Kuliner Terdekat**: Mie Ayam Jamur Spesial Haji Mahmud (jalan kaki), Mie Aceh Titi Bobrok, Restoran Garuda, Habitat Coffee, dan Kito Art Cafe.

---

## Pembaruan Kode & Komponen Aplikasi
1. `frontend/src/lib/propertyData.js` — Modul data terpusat mencakup semua informasi properti, 17 kamar, 4 lantai, fasilitas, kebijakan syariah, kuliner, dan link OTA.
2. `frontend/src/components/PropertyInfoModal.jsx` — Komponen modal/drawer interaktif informatif yang menampilkan seluruh rincian properti, tipe kamar, tata tertib, peta, dan kontak WA.
3. `frontend/src/pages/Dashboard.jsx` — Menambahkan tombol cepat `btn-property-info` di top bar hero, sub-judul Medan Petisah (17 Kamar • 4 Lantai), dan modal info.
4. `frontend/src/pages/TenantPortal.jsx` — Menambahkan tombol card "Info Properti & Tata Tertib", modal info, dan integrasi nomor kontak.
5. `frontend/src/pages/Rooms.jsx` — Memperbarui preset tipe kamar (Tipe A, Tipe B, Tipe C), fasilitas standar, dan pilihan lantai (1–4).
6. `frontend/src/pages/Chat.jsx` — Memperbarui template pesan cepat (*canned responses*) terkait alamat Medan, kebijakan buku nikah syariah, LEWI Laundry, dan jam check-in/out 24 jam.
7. `frontend/src/lib/liveStore.js` — Mengonfigurasi 17 kamar default terdistribusi di 4 lantai dengan 3 tier, data resident, dan penanganan seed/reset.
8. `init_firestore.js`, `init_firestore.py`, `backend/seed_firestore.py` — Memperbarui skrip inisialisasi Firestore ke alamat Jl. Sei Bahkapuran No. 16A Medan Petisah, kontak +62 812-6296-0211, dan 17 kamar.
