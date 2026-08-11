-- ====== USERS TABLE (Combined with DTR Info) ======
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    target_hours DECIMAL(10,2) DEFAULT 500.00,
    full_name VARCHAR(255),
    school VARCHAR(255),
    department VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    supervisor VARCHAR(255),
    supervisor_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- ====== SHIFTS TABLE ======
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    morning_in TIME NULL,
    morning_out TIME NULL,
    afternoon_in TIME NULL,
    afternoon_out TIME NULL,
    overtime_in TIME NULL,
    overtime_out TIME NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date)
);