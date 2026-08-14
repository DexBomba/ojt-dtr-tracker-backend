import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export const connectDB = async () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 30000,     
            acquireTimeout: 30000,      
            ssl: {
                rejectUnauthorized: false
            }
        });

        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully');
        connection.release();
        return pool;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error);
        throw error;
    }
};

export const getPool = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return pool;
};

export const query = async (sql, params) => {
    const pool = getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
};
