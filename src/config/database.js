const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'transindopride',
    password: process.env.DB_PASSWORD || 'TransIndo2024!',
    database: process.env.DB_NAME || 'transindopride_db',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: '+07:00'
});

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Database connected successfully');
        conn.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
}

module.exports = { pool, testConnection };
