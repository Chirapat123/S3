require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
 
const jsonPath = path.join(__dirname, 'provinces.json');
const provinces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
 
async function seedProvinces() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
 
  console.log(`อ่านข้อมูลจาก provinces.json ได้ ${provinces.length} จังหวัด`);
  console.log(`เริ่มบันทึกพิกัด ${provinces.length} จังหวัดลง MySQL...`);
 
  // ลบข้อมูลเก่าทั้งหมดในตารางก่อน แล้วรีเซ็ต ID กลับไปเริ่มที่ 1
  await pool.query('TRUNCATE TABLE provinces');
  console.log('🗑️  ล้างข้อมูลเก่าในตาราง provinces เรียบร้อยแล้ว');
 
  let successCount = 0;
 
  for (const p of provinces) {
    try {
      await pool.query(
        'INSERT INTO provinces (province_name, latitude, longitude) VALUES (?, ?, ?)',
        [p.name, p.lat, p.lng]
      );
      console.log(`✅ ${p.name}: ${p.lat}, ${p.lng}`);
      successCount++;
    } catch (err) {
      console.error(`❌ ${p.name}: ${err.message}`);
    }
  }
 
  console.log(`เสร็จสิ้น! บันทึกสำเร็จ ${successCount}/${provinces.length} จังหวัด`);
  await pool.end();
}
 
seedProvinces().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exit(1);
});