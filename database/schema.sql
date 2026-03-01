-- Trans Indopride Fleet Management - Database Schema
DROP TABLE IF EXISTS duty_history;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    primary_role ENUM('Boss', 'Eksekutif', 'Bisnis', 'Premium', 'Ekonomi') NOT NULL DEFAULT 'Ekonomi',
    secondary_role ENUM('HRD', 'FINANCE', 'OPS', 'None') DEFAULT 'None',
    jabatan VARCHAR(50) NOT NULL,
    vehicle_type ENUM('Motor', 'Mobil', 'Both') NOT NULL DEFAULT 'Motor',
    status ENUM('Aktif', 'Non-Aktif', 'Cuti') DEFAULT 'Aktif',
    duty_status ENUM('On Duty', 'Off Duty', 'Standby') DEFAULT 'Off Duty',
    join_date DATE NOT NULL,
    last_login TIMESTAMP NULL,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE duty_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    duty_date DATE NOT NULL,
    duty_type ENUM('Motor', 'Mobil', 'Standby') NOT NULL,
    vehicle_info VARCHAR(100),
    start_time TIME DEFAULT '08:00:00',
    end_time TIME DEFAULT '17:00:00',
    duration_minutes INT NOT NULL DEFAULT 0,
    base_incentive DECIMAL(10, 2) DEFAULT 0.00,
    weekly_bonus DECIMAL(10, 2) DEFAULT 0.00,
    total_incentive DECIMAL(10, 2) DEFAULT 0.00,
    incentive_paid BOOLEAN DEFAULT FALSE,
    bonus_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, duty_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: Run scripts/hash-password.js to generate admin password
INSERT INTO users (name, email, password, primary_role, secondary_role, jabatan, vehicle_type, status, join_date) VALUES
('Administrator', 'admin@transindopride.com', '$2a$10$saWjgKDOZ0L8W149kwZFlOg5ZuWQFxKYA1XLh8Xe2HQwcOw5Pgfji', 'Boss', 'HRD', 'Administrator', 'Both', 'Aktif', CURDATE());
