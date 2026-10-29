require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
 
console.log('1. เริ่มโปรแกรม, PORT =', process.env.DB_PORT);
console.log('   DB_HOST =', process.env.DB_HOST);
console.log('   DB_USER =', process.env.DB_USER);
console.log('   DB_NAME =', process.env.DB_NAME);
 
const app = express();
app.use(cors());
app.use(express.json());
 
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});
 
console.log('2. สร้าง pool เสร็จแล้ว');
 
// GET: ดึงมุดทั้งหมด จากตาราง locations
app.get('/api/markers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM locations');
    res.json(rows);
  } catch (err) {
    console.error('ดึงข้อมูลไม่สำเร็จ:', err);
    res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

// GET: ดึงจังหวัดทั้งหมดจากตาราง provinces
app.get('/api/provinces', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        province_name,
        latitude,
        longitude
      FROM provinces
      ORDER BY province_name
    `);

    console.log('จังหวัดจาก DB:', rows.length);

    res.json(rows);
  } catch (err) {
    console.error('ดึงจังหวัดไม่สำเร็จ:', err);
    res.status(500).json({
      error: 'ดึงจังหวัดไม่สำเร็จ',
      message: err.message
    });
  }
});
 
// POST: บันทึกมุดใหม่ ลงตาราง locations
app.post('/api/markers', async (req, res) => {
  const { name, lat, lng, type } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO locations (location_name, location_type, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, type || null, lat, lng]
    );
    res.json({
      location_id: result.insertId,
      location_name: name,
      latitude: lat,
      longitude: lng,
      location_type: type,
    });
  } catch (err) {
    console.error('บันทึกไม่สำเร็จ:', err);
    res.status(500).json({ error: 'บันทึกไม่สำเร็จ' });
  }
});
 
// DELETE: ลบมุดทั้งหมด ในตาราง locations
app.delete('/api/markers', async (req, res) => {
  try {
    await pool.query('DELETE FROM locations');
    res.json({ success: true });
  } catch (err) {
    console.error('ลบไม่สำเร็จ:', err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
});


 
const PORT = process.env.PORT || 3001;
 
app.listen(PORT, () => {
  console.log(`3. Server running on port ${PORT}`);
});
 
console.log('4. เรียก app.listen แล้ว (บรรทัดนี้ควรขึ้นเกือบพร้อมกับบรรทัด 3.)');

