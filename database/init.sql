-- Create tables for Render deployment
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 50000
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    court_id INTEGER REFERENCES courts(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(20) DEFAULT 'Regular',
    status VARCHAR(20) DEFAULT 'Pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    qr_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    payment_method VARCHAR(50),
    payment_proof TEXT,
    bank_account VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(10) UNIQUE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    regular_bookings_count INT DEFAULT 0,
    membership_bookings_count INT DEFAULT 0
);

-- Insert sample data
INSERT INTO courts (name, price_per_hour) VALUES
('Lapangan 1', 50000),
('Lapangan 2', 50000),
('Lapangan 3', 50000)
ON CONFLICT DO NOTHING;

INSERT INTO bank_accounts (bank_name, account_number, account_name) VALUES
('BCA', '1234567890', 'GOR Futsal Arena'),
('BRI', '9876543210', 'GOR Futsal Arena'),
('Mandiri', '5551234567', 'GOR Futsal Arena'),
('BNI', '4449876543', 'GOR Futsal Arena')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON transactions(booking_id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;