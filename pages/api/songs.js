import { getPool } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM music');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
