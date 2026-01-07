DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS ai_insights;
DROP TABLE IF EXISTS dora_metrics;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('Manager', 'Employee')),
    department VARCHAR(50),
    manager_id INT REFERENCES users(id), -- Links employee to a manager
    avatar_url TEXT
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(200),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, In Progress, Completed
    priority VARCHAR(10) DEFAULT 'Medium'
);

-- Re-create the previous tables
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50),
    points INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dora_metrics (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    deployment_freq FLOAT,
    lead_time FLOAT,
    change_failure_rate FLOAT,
    recorded_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    cluster_label VARCHAR(50),
    feedback TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);