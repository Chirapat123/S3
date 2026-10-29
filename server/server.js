require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors()); // อนุญาตให้ React (คนละ port) เรียกมาได้
app.use(express.json());

// สร้าง connection pool (ดีกว่าเปิด-ปิด connection ทีละครั้ง)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// GET: ดึงมุดทั้งหมด
app.get('/api/markers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM markers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  }
});

// POST: บันทึกมุดใหม่
app.post('/api/markers', async (req, res) => {
  const { name, lat, lng, type } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO markers (name, lat, lng, type) VALUES (?, ?, ?, ?)',
      [name, lat, lng, type || null]
    );
    res.json({ id: result.insertId, name, lat, lng, type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'บันทึกไม่สำเร็จ' });
  }
});

// DELETE: ลบมุดทั้งหมด
app.delete('/api/markers', async (req, res) => {
  try {
    await pool.query('DELETE FROM markers');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ลบไม่สำเร็จ' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
