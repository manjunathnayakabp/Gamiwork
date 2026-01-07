const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

async function runSchema() {
    try {
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        await pool.query(schema);
        console.log('✅ Database schema created successfully.');
    } catch (err) {
        console.error('Error running schema:', err);
    } finally {
        await pool.end();
    }
}

runSchema();