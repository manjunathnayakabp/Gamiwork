const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const { analyzeDeveloper } = require('./services/geminiService');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

// GET: Manager Dashboard Data (All Employees)
app.get('/api/manager/dashboard', async (req, res) => {
    try {
        const users = await pool.query(`
            SELECT u.id, u.name, u.department, 
            COALESCE(SUM(a.points), 0) as total_score,
            ai.cluster_label
            FROM users u
            LEFT JOIN activities a ON u.id = a.user_id
            LEFT JOIN ai_insights ai ON u.id = ai.user_id
            WHERE u.role = 'Employee'
            GROUP BY u.id, ai.cluster_label
            ORDER BY total_score DESC
        `);
        res.json(users.rows);
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// POST: Trigger AI Analysis for a User (The "Adaptive" part)
app.post('/api/ai/analyze/:userId', async (req, res) => {
    const { userId } = req.params;
    
    // 1. Fetch real stats from DB (Simulated here for brevity)
    const stats = { role: "Backend Dev", prs: 12, reviews: 30, fixes: 5 }; 
    const dora = { lead_time: 24 };

    // 2. Ask Gemini
    const insight = await analyzeDeveloper(stats, dora);

    // 3. Save to DB
    await pool.query(
        `INSERT INTO ai_insights (user_id, cluster_label, feedback) VALUES ($1, $2, $3)`,
        [userId, insight.persona, insight.feedback]
    );

    res.json(insight);
});

// POST: Assign a Task to an Employee
app.post('/api/tasks', async (req, res) => {
    const { user_id, title, deadline, priority } = req.body;
    
    try {
        const newTask = await pool.query(
            `INSERT INTO tasks (user_id, title, deadline, priority, status) 
             VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
            [user_id, title, deadline, priority]
        );
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error assigning task");
    }
});

// PATCH: Update Task Status
app.patch('/api/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body; // e.g., 'Completed'

    try {
        const result = await pool.query(
            `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
            [status, taskId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating task");
    }
});

// GET: All Users (For Login Dropdown)
app.get('/api/users', async (req, res) => {
    const result = await pool.query("SELECT id, name, role FROM users ORDER BY name");
    res.json(result.rows);
});

// GET: Employee Specific Data (Stats, Manager, Tasks)
app.get('/api/employee/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get User Info + Manager Name
        const userRes = await pool.query(`
            SELECT u.*, m.name as manager_name 
            FROM users u 
            LEFT JOIN users m ON u.manager_id = m.id 
            WHERE u.id = $1
        `, [id]);

        // 2. Get Tasks
        const tasksRes = await pool.query(`SELECT * FROM tasks WHERE user_id = $1`, [id]);

        // 3. Get DORA Stats
        const doraRes = await pool.query(`SELECT * FROM dora_metrics WHERE user_id = $1`, [id]);

        res.json({
            profile: userRes.rows[0],
            tasks: tasksRes.rows,
            dora: doraRes.rows[0]
        });
    } catch (e) { res.status(500).json(e); }
});

// GET: Manager Specific Data (Their Team)
app.get('/api/manager/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Get employees reporting to this manager
        const teamRes = await pool.query(`
            SELECT u.id, u.name, u.department, 
            COALESCE(SUM(a.points), 0) as points,
            dm.lead_time, dm.deployment_freq
            FROM users u
            LEFT JOIN activities a ON u.id = a.user_id
            LEFT JOIN dora_metrics dm ON u.id = dm.user_id
            WHERE u.manager_id = $1
            GROUP BY u.id, dm.lead_time, dm.deployment_freq
        `, [id]);

        res.json({ team: teamRes.rows });
    } catch (e) { res.status(500).json(e); }
});

app.listen(5000, () => console.log('Server running on port 5000'));