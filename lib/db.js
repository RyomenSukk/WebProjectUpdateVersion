import mysql from 'mysql2/promise';

let pool;

export const getPool = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
      port: 4000,
      user: '24PguWYyTWM2D7a.root',
      password: 'h9bgEFzB5dbRfA56',
      database: 'song',
      ssl: {
        rejectUnauthorized: true
      }
    });
  }
  return pool;
};
