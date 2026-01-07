const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default postgres db
    password: process.env.DB_PASS,
    port: 5432,
});

async function createDB() {
    try {
        await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`✅ Database "${process.env.DB_NAME}" created successfully.`);
    } catch (err) {
        if (err.code === '42P04') {
            console.log(`ℹ️ Database "${process.env.DB_NAME}" already exists.`);
        } else {
            console.error('Error creating database:', err);
        }
    } finally {
        await pool.end();
    }
}

createDB();