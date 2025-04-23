import mysql from 'mysql2/promise';

let pool;

export const getPool = async () => {
  if (!pool) {
    pool = mysql.createPool({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '3G4TfKGE6STqKRz.root',
      password: 'vZgAL2vMUVYcxLAX',
      database: 'musicdata',
      ssl: {
        rejectUnauthorized: true
      }
    });
  }
  return pool;
};
