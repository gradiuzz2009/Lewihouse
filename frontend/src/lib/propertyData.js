/**
 * Lewi House Medan — Property Master Information, Personnel & Specifications
 * Hybrid Accommodation: Guesthouse, Exclusive Kost (Boarding House), Bed & Breakfast
 */

export const PROPERTY_INFO = {
  id: "lewi_house_main",
  name: "Lewi House Medan",
  legalName: "Lewi House Syariah / Kost Lewi House",
  tagline: "Guesthouse, Kost Eksklusif & Bed and Breakfast Syariah",
  concept: "Hybrid Accommodation (Kost Campur Eksklusif, Guesthouse & Bed & Breakfast)",
  
  // Key Personnel
  personnel: {
    owner: {
      name: "Ibu Amirta",
      role: "Owner (Pemilik Properti)",
      phone: "+62 812-6296-0211",
      phoneClean: "6281262960211",
    },
    admin: {
      name: "Mbak Rosmah",
      role: "Admin (Pengelola Operasional & Front Desk)",
      phone: "+62 821-6881-9722",
      phoneClean: "6282168819722",
    },
  },

  // Location & Contact
  address: "Jl. Sei Bahkapuran No. 16A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119, Indonesia",
  addressShort: "Jl. Sei Bahkapuran No. 16A, Medan Petisah / Medan Baru",
  neighborhood: "Medan Petisah / Medan Baru",
  mapsUrl: "https://maps.google.com/?q=Lewi+House+Medan+Jl.+Sei+Bahkapuran+No.+16A",
  phonePrimary: "+62 821-6881-9722",
  phoneSecondary: "+62 812-6296-0211",
  phone: "+62 821-6881-9722",
  phoneClean: "6282168819722",
  email: "contact@lewihouse.com",
  adminEmail: "fauziealiakhmad@gmail.com",
  wifiSsid: "LewiHouse_Guest",
  
  // Building Specifications
  building: {
    totalFloors: 4,
    totalRooms: 17,
    buildingType: "Kost Campur Eksklusif (Pria & Wanita / Profesional & Mahasiswa)",
    reception: "24-Hour Front Desk and Reception",
    security: "24-Hour Security Personnel, Fire Safety Equipment & CCTV Monitoring",
  },

  // Ratings & Guest Sentiment
  ratings: {
    googleMaps: { score: "4.5", max: "5.0", reviews: "170+ ulasan", label: "Google Maps" },
    agoda: { score: "8.8", max: "10.0", reviews: "Hebat", label: "Agoda", url: "https://www.agoda.com/lewi-house/hotel/medan-id.html" },
    traveloka: { score: "8.6", max: "10.0", reviews: "Mengesankan", label: "Traveloka", url: "https://www.traveloka.com/id-id/hotel/indonesia/lewi-house-syariah-3000010036251" },
    tripCom: { score: "8.0", max: "10.0", reviews: "Sangat Baik", label: "Trip.com", url: "https://www.trip.com/hotels/sei-sikambing-d-hotel-detail-8334827/lewi-house/" },
    highlights: [
      "Kebersihan kamar dan area bersama sangat terjaga",
      "Lingkungan hunian tenang dan asri untuk istirahat",
      "Koneksi Wi-Fi kencang dan stabil di setiap lantai",
      "Parkir kendaraan mobil dan motor luas serta aman",
      "Akses sangat strategis menuju pusat Kota Medan dan pusat kuliner",
    ],
  },

  // On-Site Services
  onSiteServices: [
    {
      name: "LEWI Laundry & Dry Cleaning",
      description: "Layanan cuci, setrika kilat, dan dry cleaning langsung di area properti (on-site).",
      icon: "Sparkles",
    },
    {
      name: "Free On-Site Parking",
      description: "Tempat parkir gratis dan aman untuk mobil serta sepeda motor penghuni & tamu.",
      icon: "Car",
    },
    {
      name: "Rooftop Terrace & Gym",
      description: "Open rooftop terrace dengan tempat duduk/city view Medan dan area workout outdoor.",
      icon: "Activity",
    },
    {
      name: "Shared Kitchen & Room Service",
      description: "Dapur bersama lengkap, opsi room service, dan kemudahan akses pesan antar makanan.",
      icon: "UtensilsCrossed",
    },
  ],

  // Lease Terms
  leaseTerms: [
    { type: "Bulanan", label: "Sewa Bulanan (Monthly)", target: "Mahasiswa & Profesional (Kost Eksklusif)" },
    { type: "Mingguan", label: "Sewa Mingguan (Weekly)", target: "Long-stay Guest, Medis & Pekerja Proyek" },
    { type: "Harian", label: "Sewa Harian (Daily)", target: "Tamu Guesthouse, B&B / Budget Hotel Syariah" },
  ],

  // Room Categories & Tiers
  roomTiers: [
    {
      tier: "vip",
      name: "VIP Room / Suite",
      size: "~22 m²",
      bed: "Double Bed / King Springbed",
      capacity: 2,
      description: "Kamar termewah dengan balkon pribadi, kulkas mini, flat-screen Smart TV, dan meja kerja eksekutif.",
      features: [
        "Kasur King / Queen Springbed",
        "Balkon Pribadi dengan View Kota",
        "Kulkas Mini & Fasilitas Kopi/Teh",
        "AC Dingin & Smart TV Flat-Screen",
        "Kamar Mandi Dalam (Hot Shower & Kloset Duduk)",
        "Perlengkapan Mandi Gratis (Toiletries)",
        "Meja Kerja & Lemari Pakaian Besar",
        "Free Wi-Fi & Banyak Colokan Listrik",
      ],
      photoUrl: "/gallery/agoda/agoda-02-suite-bedroom.webp",
    },
    {
      tier: "deluxe",
      name: "Deluxe Room",
      size: "~20 m²",
      bed: "Double Bed / Springbed Queen",
      capacity: 2,
      description: "Kamar luas elegan dengan ranjang queen empuk, Smart TV, meja kerja, dan kamar mandi hot shower.",
      features: [
        "Kasur Springbed Double / Queen",
        "AC Individual Dingin",
        "Kamar Mandi Dalam (Hot Shower & Toiletries)",
        "Flat-Screen TV",
        "Meja Kerja, Kursi & Lemari Pakaian Cermin",
        "Free Wi-Fi Kecepatan Tinggi",
      ],
      photoUrl: "/gallery/agoda/agoda-10-deluxe-bed.webp",
    },
    {
      tier: "superior_double",
      name: "Superior Double Room",
      size: "~20 m²",
      bed: "Double Bed / Large Single",
      capacity: 2,
      description: "Kamar superior ranjang double nyaman dengan kamar mandi shower dan ruang gerak leluasa.",
      features: [
        "Kasur Springbed Double",
        "AC Individual Dingin",
        "Kamar Mandi Dalam (Hot Shower & Kloset Duduk)",
        "Meja Kerja, Lemari & Clothes Hangers",
        "TV & Outlet Listrik Lengkap",
        "Free Wi-Fi Kecepatan Tinggi",
      ],
      photoUrl: "/gallery/agoda/agoda-15-superior-double.webp",
    },
    {
      tier: "single_superior",
      name: "Single Superior Room",
      size: "~18 m²",
      bed: "Single Bed (1.2 × 2 m)",
      capacity: 1,
      description: "Layout kamar personal nyaman dengan kasur 1.2 × 2 m, AC, dan kamar mandi dalam shower.",
      features: [
        "Kasur Single Berkualitas (1.2 × 2 m)",
        "AC Dingin",
        "Kamar Mandi Dalam (Shower & Kloset Duduk)",
        "Meja Kerja & Lemari Pakaian",
        "Free Wi-Fi Kecepatan Tinggi",
      ],
      photoUrl: "/gallery/agoda/agoda-12-superior-single.webp",
    },
    {
      tier: "single_standard",
      name: "Single Standard Room",
      size: "~16 m²",
      bed: "Single Bed",
      capacity: 1,
      description: "Layout ringkas, tenang, dan efisien dengan kamar mandi dalam untuk solo traveler atau mahasiswa.",
      features: [
        "Kasur Single Springbed",
        "AC Dingin",
        "Kamar Mandi Dalam (Shower & Kloset Duduk)",
        "Meja Kerja Kompak & Lemari",
        "Free Wi-Fi Kecepatan Tinggi",
      ],
      photoUrl: "/gallery/agoda/agoda-11-standard-single.webp",
    },
  ],

  // Standard In-Room Amenities
  inRoomAmenities: [
    "Air Conditioning (AC) Individual di setiap kamar",
    "Kamar mandi dalam dengan Hot Shower & Complimentary Toiletries",
    "Flat-Screen TV",
    "Meja kerja, kursi, lemari pakaian, dan clothes hangers",
    "Free Wi-Fi access & colokan listrik banyak",
    "Kamar pilihan dilengkapi balkon pribadi atau kulkas mini",
  ],

  // Shared Resident Facilities
  sharedFacilities: [
    "Open Rooftop Terrace dengan city views & Rooftop Workout Gym Area",
    "Dapur bersama lengkap (Shared Kitchen & Dining) & opsi room service",
    "Layanan cuci LEWI Laundry & Dry Cleaning support di lokasi",
    "Free on-site parking untuk mobil dan sepeda motor",
    "Petugas keamanan 24 jam, perlengkapan proteksi kebakaran, & CCTV",
    "Resepsionis 24 jam & staf siaga",
  ],

  // Guesthouse & Daily Stay Details
  dailyStayDetails: {
    checkInTime: "Mulai 14:00 WIB (2:00 PM)",
    checkOutTime: "Hingga 12:00 WIB (12:00 PM / Noon)",
    reception: "24-Hour Front Desk and Reception",
    syariahPolicy: "Pasangan suami istri yang menginap dalam satu kamar wajib menunjukkan Buku Nikah atau identitas resmi pernikahan yang sah saat check-in.",
    rules: [
      "Bebas Rokok di dalam area kamar (Strictly non-smoking inside rooms — tersedia zona luar ruangan khusus)",
      "Minuman beralkohol dilarang keras di seluruh lingkungan properti",
      "Hewan peliharaan (pets) tidak diperkenankan",
      "Anak usia 0–3 tahun menginap gratis menggunakan tempat tidur yang ada",
      "Tamu berusia 11 tahun ke atas diklasifikasikan sebagai dewasa",
      "Menjaga ketenangan dan kenyamanan bersama",
    ],
  },

  // Surrounding Area & Accessibility
  surroundingArea: {
    transit: [
      { name: "Stasiun Kereta Api Medan (Medan Train Station)", distance: "~2.7 km", desc: "Akses cepat kereta bandara Railink & antarkota" },
      { name: "Bandara Internasional Kualanamu (KNO)", distance: "~23–25 km", desc: "Akses mudah via Tol & Railink" },
      { name: "Hub Damri Airport Shuttle Bus (Plaza Medan Fair / Carrefour)", distance: "~1.2 km", desc: "Titik shuttle bus langsung ke bandara KNO" },
    ],
    landmarks: [
      { name: "Pusat Kota Medan / Lapangan Merdeka", distance: "~3.3 km", desc: "Jantung kota, titik nol Medan & pusat kuliner Merdeka Walk" },
      { name: "Taman Gajah Mada", distance: "~330 m", desc: "Taman kota & area jogging publik asri" },
      { name: "Lapangan Benteng", distance: "~1.9 km", desc: "Pusat kegiatan, event & landmark Kota Medan" },
      { name: "Politeknik LP3I Medan", distance: "~222 m", desc: "Kampus pendidikan vokasi terdekat (bisa jalan kaki)" },
      { name: "Plaza Medan Fair & Carrefour", distance: "~1.2 km", desc: "Pusat perbelanjaan, bioskop & kuliner modern" },
    ],
    healthcare: [
      { name: "Sumatera Eye Hospital (RS Mata Sumatera / SMEC)", distance: "~603 m", desc: "Pusat spesialis mata terkemuka (bisa jalan kaki)" },
      { name: "RS Advent Medan", distance: "~800 m", desc: "Rumah sakit umum terdekat" },
      { name: "RS Bunda Thamrin", distance: "~1.8 km", desc: "Rumah sakit rujukan modern" },
      { name: "RS Siti Hajar", distance: "~2.0 km", desc: "Layanan medis terpercaya" },
      { name: "RS Universitas Sumatera Utara (USU)", distance: "~3.2 km", desc: "Rumah sakit pendidikan utama" },
    ],
    dining: [
      { name: "Mie Ayam Jamur Spesial Haji Mahmud", desc: "Kuliner legendaris Medan (bisa jalan kaki)" },
      { name: "Mie Aceh Titi Bobrok", desc: "Mie Aceh rempah khas Medan favorit wisatawan" },
      { name: "Restoran Garuda", desc: "Restoran masakan Padang & Minang ternama" },
      { name: "Habitat Coffee & Kito Art Cafe", desc: "Kafe estetik & coworking santai dekat properti" },
    ],
  },

  // Booking & Listing Platforms
  platforms: [
    { name: "Agoda", type: "Hotel / B&B", rating: "8.8/10", url: "https://www.agoda.com/lewi-house/hotel/medan-id.html" },
    { name: "Traveloka", type: "Hotel Syariah", rating: "8.6/10", url: "https://www.traveloka.com/id-id/hotel/indonesia/lewi-house-syariah-3000010036251" },
    { name: "Tiket.com", type: "Hotel Syariah", url: "https://www.tiket.com/id-id/hotel/indonesia/lewi-house-syariah-310001602128725593" },
    { name: "Trip.com", type: "Hotel / Guesthouse", rating: "8.0/10", url: "https://www.trip.com/hotels/sei-sikambing-d-hotel-detail-8334827/lewi-house/" },
    { name: "KKday", type: "Hotel Stay", url: "https://www.kkday.com/en-sg/hotel/product/455531" },
    { name: "Mamikos", type: "Kost Eksklusif", url: "https://mamikos.com/room/kost-medan-kost-campur-eksklusif-kost-lewi-house-tipe-a-medan-petisah-1" },
    { name: "IdKos", type: "Kost Eksklusif", url: "https://idkos.com/kost-kota-medan-kost-lewi-house-tipe-exclusive" },
  ],
};
