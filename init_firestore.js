/**
 * Initialize and Seed Cloud Firestore for Lewi House using pure Node.js built-ins.
 * (No npm install required - uses built-in crypto and https modules).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// 1. Locate the Service Account JSON key
const possibleKeyFiles = [
  'lewihouse-7a0d7-firebase-adminsdk-fbsvc-95805aa62a.json',
  'serviceAccountKey.json',
  ...fs.readdirSync(__dirname).filter(f => f.includes('firebase-adminsdk') && f.endsWith('.json'))
];

let keyFilePath = possibleKeyFiles.find(f => fs.existsSync(path.join(__dirname, f)));
if (!keyFilePath) {
  console.error('[!] No Firebase service account JSON key found in workspace.');
  process.exit(1);
}

const keyPath = path.join(__dirname, keyFilePath);
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const PROJECT_ID = sa.project_id || 'lewihouse-7a0d7';

console.log(`[*] Target Firebase Project ID: ${PROJECT_ID}`);
console.log(`[*] Using Service Account Key: ${keyFilePath}`);

// 2. Generate Google OAuth2 Access Token using RS256 JWT
function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsignedJwt = `${b64Url(header)}.${b64Url(claimSet)}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedJwt);
    sign.end();
    const signature = sign.sign(sa.private_key, 'base64url');
    const assertion = `${unsignedJwt}.${signature}`;

    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertion,
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error(JSON.stringify(json)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 3. Firestore REST Value Serializer
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (k !== '_id') fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function writeFirestoreDoc(token, docPath, docData) {
  return new Promise((resolve, reject) => {
    const fields = {};
    for (const [k, v] of Object.entries(docData)) {
      if (k !== '_id') fields[k] = toFirestoreValue(v);
    }
    const body = JSON.stringify({ fields });
    const url = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;

    const req = https.request({
      hostname: 'firestore.googleapis.com',
      path: url,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.warn(`  [-] HTTP ${res.statusCode} for ${docPath}: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`  [!] Request error for ${docPath}: ${err.message}`);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    const token = await getAccessToken();
    console.log('  [✓] Successfully generated Google OAuth2 Token from Service Account.');

    const now = new Date().toISOString();
    const PROPERTY_SCOPE = 'properties/lewi_house_main';

    console.log('\n[*] Initializing Firestore collections...');

    // 1. Property Info
    const propertyInfo = {
      id: 'lewi_house_main',
      name: 'Lewi House Medan',
      legalName: 'Lewi House Syariah / Kost Lewi House',
      address: 'Jl. Sei Bahkapuran No. 16A, Sei Sikambing D, Kec. Medan Petisah, Kota Medan, Sumatera Utara 20119',
      totalFloors: 4,
      totalRooms: 17,
      buildingType: 'Kost Campur Eksklusif & Guesthouse Syariah',
      contactPhone: '+62 812-6296-0211',
      contactEmail: 'fauziealiakhmad@gmail.com',
      wifiSsid: 'LewiHouse_Guest',
      onSiteServices: ['LEWI Laundry', 'Area Parkir Mobil & Motor', 'Rooftop Terrace & Workout Area'],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      updatedAt: now,
    };
    await writeFirestoreDoc(token, 'properties/lewi_house_main', propertyInfo);
    console.log('  [✓] Property document "lewi_house_main" initialized (Lewi House Medan).');

    // 2. Kosan Rooms (17 Kamar across 4 Lantai)
    const rooms = [
      // Lantai 1 (4 Kamar)
      { id: 'room_101', roomNumber: '101', floor: '1', roomType: 'tipe_a', capacity: 2, monthlyPrice: 2500000, deposit: 1000000, status: 'OCCUPIED', photoUrl: '/gallery/agoda/agoda-10-deluxe-bed.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Queen', 'Meja Kerja', 'Lemari Cermin', 'Smart TV', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_102', roomNumber: '102', floor: '1', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2000000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-15-superior-double.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Single', 'Meja', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_103', roomNumber: '103', floor: '1', roomType: 'tipe_c', capacity: 1, monthlyPrice: 1600000, deposit: 500000, status: 'OCCUPIED', photoUrl: '/gallery/agoda/agoda-11-standard-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur 1.2x2m', 'Meja Kompak', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_104', roomNumber: '104', floor: '1', roomType: 'tipe_c', capacity: 1, monthlyPrice: 1600000, deposit: 500000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-13-standard-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur 1.2x2m', 'Meja Kompak', 'Lemari', 'WiFi Cepat'], updatedAt: now },

      // Lantai 2 (5 Kamar)
      { id: 'room_201', roomNumber: '201', floor: '2', roomType: 'tipe_a', capacity: 2, monthlyPrice: 2500000, deposit: 1000000, status: 'OCCUPIED', photoUrl: '/gallery/agoda/agoda-02-suite-bedroom.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Queen', 'Meja Kerja', 'Lemari Cermin', 'Smart TV', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_202', roomNumber: '202', floor: '2', roomType: 'tipe_a', capacity: 2, monthlyPrice: 2500000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-09-suite-bedroom.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Queen', 'Meja Kerja', 'Lemari Cermin', 'Smart TV', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_203', roomNumber: '203', floor: '2', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2000000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-12-superior-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Single', 'Meja', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_204', roomNumber: '204', floor: '2', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2000000, deposit: 1000000, status: 'OCCUPIED', photoUrl: '/gallery/agoda/agoda-15-superior-double.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Double', 'Meja', 'Lemari', 'TV', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_205', roomNumber: '205', floor: '2', roomType: 'tipe_c', capacity: 1, monthlyPrice: 1600000, deposit: 500000, status: 'CLEANING', photoUrl: '/gallery/agoda/agoda-11-standard-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur 1.2x2m', 'Meja Kompak', 'Lemari', 'WiFi Cepat'], updatedAt: now },

      // Lantai 3 (4 Kamar)
      { id: 'room_301', roomNumber: '301', floor: '3', roomType: 'tipe_a', capacity: 2, monthlyPrice: 2500000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-10-deluxe-bed.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Queen', 'Meja Kerja', 'Lemari Cermin', 'Smart TV', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_302', roomNumber: '302', floor: '3', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2000000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-14-deluxe-bedroom.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Single', 'Meja', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_303', roomNumber: '303', floor: '3', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2000000, deposit: 1000000, status: 'OCCUPIED', photoUrl: '/gallery/agoda/agoda-15-superior-double.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Double', 'Meja', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_304', roomNumber: '304', floor: '3', roomType: 'tipe_c', capacity: 1, monthlyPrice: 1600000, deposit: 500000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-13-standard-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur 1.2x2m', 'Meja Kompak', 'Lemari', 'WiFi Cepat'], updatedAt: now },

      // Lantai 4 (4 Kamar)
      { id: 'room_401', roomNumber: '401', floor: '4', roomType: 'tipe_a', capacity: 2, monthlyPrice: 2600000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-02-suite-bedroom.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Queen', 'Meja Kerja', 'Lemari Cermin', 'Smart TV', 'WiFi Cepat', 'Akses Rooftop'], updatedAt: now },
      { id: 'room_402', roomNumber: '402', floor: '4', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2100000, deposit: 1000000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-12-superior-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Single', 'Meja', 'Lemari', 'WiFi Cepat', 'Akses Rooftop'], updatedAt: now },
      { id: 'room_403', roomNumber: '403', floor: '4', roomType: 'tipe_b', capacity: 1, monthlyPrice: 2100000, deposit: 1000000, status: 'MAINTENANCE', photoUrl: '/gallery/agoda/agoda-14-deluxe-bedroom.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur Springbed Single', 'Meja', 'Lemari', 'WiFi Cepat'], updatedAt: now },
      { id: 'room_404', roomNumber: '404', floor: '4', roomType: 'tipe_c', capacity: 1, monthlyPrice: 1700000, deposit: 500000, status: 'AVAILABLE', photoUrl: '/gallery/agoda/agoda-11-standard-single.webp', facilities: ['AC', 'Kamar Mandi Dalam (Shower & Kloset Duduk)', 'Kasur 1.2x2m', 'Meja Kompak', 'Lemari', 'WiFi Cepat'], updatedAt: now },
    ];

    for (const r of rooms) {
      await writeFirestoreDoc(token, `${PROPERTY_SCOPE}/rooms/${r.id}`, r);
    }
    console.log(`  [✓] ${rooms.length} Rooms initialized (101-104, 201-204).`);

    // 3. Demo Resident
    const resident = {
      id: 'resident_101',
      fullName: 'Budi Santoso',
      email: 'budi.santoso@example.com',
      phone: '+6281298765432',
      roomNumber: '101',
      moveInDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      monthlyRent: 1500000,
      depositAmount: 500000,
      status: 'ACTIVE',
      emergencyContact: 'Orang Tua',
      emergencyPhone: '+628111222333',
      ktpNumber: '3201234567890001',
      updatedAt: now,
    };
    await writeFirestoreDoc(token, `${PROPERTY_SCOPE}/residents/${resident.id}`, resident);
    console.log('  [✓] Resident "Budi Santoso" seeded.');

    // 4. Admin User
    const adminUser = {
      id: 'usr_owner_1',
      email: 'fauziealiakhmad@gmail.com',
      name: 'Fauzie Ali Akhmad',
      role: 'owner',
      createdAt: now,
    };
    await writeFirestoreDoc(token, 'users/usr_owner_1', adminUser);
    console.log('  [✓] Owner/Admin profile (fauziealiakhmad@gmail.com) created.');

    // 5. Electricity Meters
    for (const r of rooms) {
      const meter = {
        id: `meter_${r.roomNumber}`,
        roomNumber: r.roomNumber,
        meterNumber: `54129800${r.roomNumber}`,
        currentKwh: 45.8,
        lastUpdated: now,
      };
      await writeFirestoreDoc(token, `${PROPERTY_SCOPE}/electricity_meters/${meter.id}`, meter);
    }
    console.log('  [✓] 8 Electricity meters initialized.');

    // 6. Announcements
    const notif = {
      id: 'notif_welcome',
      title: 'Selamat Datang di Lewi House',
      body: 'Aplikasi manajemen kosan Lewi House kini aktif. Seluruh data tagihan dan hunian siap digunakan.',
      category: 'ANNOUNCEMENT',
      recipientResidentId: null,
      createdAt: now,
      isRead: false,
    };
    await writeFirestoreDoc(token, `${PROPERTY_SCOPE}/notifications/${notif.id}`, notif);
    console.log('  [✓] Welcome notification announcement created.');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 CLOUD FIRESTORE SETUP & SEEDING COMPLETE!');
    console.log('='.repeat(50));
  } catch (err) {
    console.error('[!] Execution failed:', err);
  }
}

main();
