const { Pool } = require('pg');
const faker = require('@faker-js/faker').faker;
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

async function seed() {
    console.log("🌱 Seeding Database with Hierarchies...");
    
    // 1. Create 5 Managers
    const managerIds = [];
    for(let i=0; i<5; i++) {
        const res = await pool.query(
            `INSERT INTO users (name, role, department) VALUES ($1, 'Manager', 'Engineering') RETURNING id`,
            [faker.person.fullName()]
        );
        managerIds.push(res.rows[0].id);
    }

    // 2. Create 50 Employees assigned to Managers
    for(let i=0; i<50; i++) {
        const name = faker.person.fullName();
        const dept = ['Frontend', 'Backend', 'DevOps', 'Mobile'][Math.floor(Math.random() * 4)];
        const assignedManager = managerIds[Math.floor(Math.random() * managerIds.length)]; // Random Manager

        const res = await pool.query(
            `INSERT INTO users (name, role, department, manager_id) VALUES ($1, 'Employee', $2, $3) RETURNING id`,
            [name, dept, assignedManager]
        );
        const userId = res.rows[0].id;

        // 3. Create Tasks for this User
        for(let k=0; k<3; k++) {
            await pool.query(
                `INSERT INTO tasks (user_id, title, deadline, status) VALUES ($1, $2, $3, $4)`,
                [
                    userId, 
                    `Fix critical bug in ${faker.hacker.noun()}`, 
                    faker.date.soon({ days: 10 }), // Deadline in next 10 days
                    ['Pending', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)]
                ]
            );
        }

        // 4. Generate Activity & DORA (Same as before)
        await pool.query(`INSERT INTO dora_metrics (user_id, deployment_freq, lead_time, change_failure_rate) VALUES ($1, $2, $3, $4)`, [userId, Math.random()*10, Math.random()*48, Math.random()*15]);
        
        // Add some random points
        await pool.query(`INSERT INTO activities (user_id, type, points) VALUES ($1, $2, $3)`, [userId, 'PR_MERGE', 150]);
    }
    console.log("✅ Database seeded with linked Managers and Tasks.");
}

seed();