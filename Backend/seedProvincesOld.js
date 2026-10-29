require('dotenv').config();
const mysql = require('mysql2/promise');

// รายชื่อจังหวัดทั้ง 77 จังหวัดของไทย
const provinceNames = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง",
  "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่",
  "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร",
  "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ",
  "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม",
  "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย",
  "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู",
  "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี",
  "อุบลราชธานี",
];

// หน่วงเวลาไว้กัน rate limit ของ Nominatim (กำหนดไว้ไม่เกิน 1 request/วินาที)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProvinceCoords(name) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    name + ', Thailand'
  )}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: {
      // Nominatim policy บังคับให้ใส่ User-Agent ที่ระบุตัวตนแอปของเรา
      'User-Agent': 'ThaiProvinceMapApp/1.0 (contact: example@example.com)',
      'Accept': 'application/json',
    },
  });

  // ✏️ แก้ไข: เช็คก่อนว่าตอบกลับมาสำเร็จและเป็น JSON จริงไหม ก่อนจะ parse
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('json')) {
    const bodyText = await res.text();
    throw new Error(`ถูกปฏิเสธ (status ${res.status}): ${bodyText.slice(0, 100)}`);
  }

  const data = await res.json();

  if (data.length === 0) {
    console.warn(`⚠️  ไม่พบพิกัดของ: ${name}`);
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

async function seedProvinces() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log(`เริ่มดึงพิกัด ${provinceNames.length} จังหวัด...`);

  let successCount = 0;
  let failCount = 0;

  for (const name of provinceNames) {
    // ✏️ แก้ไข: ห่อด้วย try-catch ทีละจังหวัด กันไม่ให้จังหวัดเดียว fail แล้วทั้งสคริปต์ล้ม
    try {
      const coords = await fetchProvinceCoords(name);

      if (coords) {
        await pool.query(
          'INSERT INTO provinces (province_name, latitude, longitude) VALUES (?, ?, ?)',
          [name, coords.lat, coords.lng]
        );
        console.log(`✅ ${name}: ${coords.lat}, ${coords.lng}`);
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.error(`❌ ${name}: ${err.message}`);
      failCount++;
    }

    await sleep(1200); // รอ ~1.2 วินาทีต่อ request ตามกฎของ Nominatim
  }

  console.log(`เสร็จสิ้น! สำเร็จ ${successCount} จังหวัด, ล้มเหลว ${failCount} จังหวัด`);
  await pool.end();
}

seedProvinces().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
