import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
  },
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET') {
      // Fetch all songs (titles) from the database
      const connection = await mysql.createConnection(dbConfig);
      const [songs] = await connection.execute('SELECT title FROM music');
      await connection.end();

      return res.status(200).json({ songs });
    } else if (req.method === 'POST') {
      const { title, artist, youtube_url, chord_url } = req.body;

      if (!title || !artist || !youtube_url) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
      }

      // Add a song to the database
      const connection = await mysql.createConnection(dbConfig);
      const [existingSongs] = await connection.execute(
        'SELECT * FROM music WHERE title = ? AND artist = ? AND youtube_url = ?',
        [title, artist, youtube_url]
      );

      if (existingSongs.length > 0) {
        await connection.end();
        return res.status(409).json({ error: 'เพลงนี้มีอยู่แล้วในฐานข้อมูล' });
      }

      await connection.execute(
        'INSERT INTO music (title, artist, youtube_url, chord_url) VALUES (?, ?, ?, ?)',
        [title, artist, youtube_url, chord_url || null]
      );

      await connection.end();
      return res.status(200).json({ message: 'เพิ่มเพลงสำเร็จ' });
    } else if (req.method === 'DELETE') {
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'กรุณาระบุชื่อเพลงที่ต้องการลบ' });
      }

      // Delete a song by its title
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute('DELETE FROM music WHERE title = ?', [title]);
      await connection.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบเพลงที่ต้องการลบ' });
      }

      return res.status(200).json({ message: 'ลบเพลงสำเร็จ' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}