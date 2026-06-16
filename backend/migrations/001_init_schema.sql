-- ============================================
-- HotMeet5 - PostgreSQL Schema Initialization
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    age INT,
    bio TEXT,
    city VARCHAR(100),
    interests TEXT[], -- Array of strings
    photos TEXT[], -- Array of image URLs (max 4)
    
    -- Account status
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_verified_at TIMESTAMP,
    blue_badge BOOLEAN DEFAULT FALSE,
    
    -- Premium features
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_type VARCHAR(50) DEFAULT 'free', -- free, premium
    subscription_expiry TIMESTAMP,
    
    -- User status
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL VERIFICATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- IDENTITY VERIFICATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50), -- selfie, government_id, etc
    document_url VARCHAR(255),
    selfie_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MATCHES TABLE (Likes/Hearts)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_type VARCHAR(50) DEFAULT 'like', -- like, mutual_match
    mutual_match BOOLEAN DEFAULT FALSE,
    matched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- ============================================
-- ADS WATCHED TABLE (Track daily ad views)
-- ============================================
CREATE TABLE IF NOT EXISTS ads_watched (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_type VARCHAR(50), -- video, banner, etc
    watched_date DATE DEFAULT CURRENT_DATE,
    watched_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- US CITIES STATISTICS
-- ============================================
CREATE TABLE IF NOT EXISTS us_cities_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_name VARCHAR(100) UNIQUE NOT NULL,
    state_code VARCHAR(2),
    active_users INT DEFAULT 0,
    daily_matches INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_matches_liker ON matches(liker_id);
CREATE INDEX idx_matches_liked ON matches(liked_id);
CREATE INDEX idx_ads_watched_user_date ON ads_watched(user_id, watched_date);
CREATE INDEX idx_us_cities_stats_city ON us_cities_stats(city_name);

-- ============================================
-- POPULATE US CITIES (50 major cities)
-- ============================================
INSERT INTO us_cities_stats (city_name, state_code, active_users, daily_matches) VALUES
('New York', 'NY', 0, 0),
('Los Angeles', 'CA', 0, 0),
('Chicago', 'IL', 0, 0),
('Houston', 'TX', 0, 0),
('Phoenix', 'AZ', 0, 0),
('Philadelphia', 'PA', 0, 0),
('San Antonio', 'TX', 0, 0),
('San Diego', 'CA', 0, 0),
('Dallas', 'TX', 0, 0),
('San Jose', 'CA', 0, 0),
('Austin', 'TX', 0, 0),
('Jacksonville', 'FL', 0, 0),
('Fort Worth', 'TX', 0, 0),
('Columbus', 'OH', 0, 0),
('Charlotte', 'NC', 0, 0),
('San Francisco', 'CA', 0, 0),
('Indianapolis', 'IN', 0, 0),
('Seattle', 'WA', 0, 0),
('Denver', 'CO', 0, 0),
('Washington', 'DC', 0, 0),
('Boston', 'MA', 0, 0),
('El Paso', 'TX', 0, 0),
('Nashville', 'TN', 0, 0),
('Detroit', 'MI', 0, 0),
('Oklahoma City', 'OK', 0, 0),
('Portland', 'OR', 0, 0),
('Las Vegas', 'NV', 0, 0),
('Memphis', 'TN', 0, 0),
('Louisville', 'KY', 0, 0),
('Baltimore', 'MD', 0, 0),
('Milwaukee', 'WI', 0, 0),
('Albuquerque', 'NM', 0, 0),
('Tucson', 'AZ', 0, 0),
('Fresno', 'CA', 0, 0),
('Sacramento', 'CA', 0, 0),
('Long Beach', 'CA', 0, 0),
('Kansas City', 'MO', 0, 0),
('Mesa', 'AZ', 0, 0),
('Virginia Beach', 'VA', 0, 0),
('Atlanta', 'GA', 0, 0),
('New Orleans', 'LA', 0, 0),
('Cleveland', 'OH', 0, 0),
('New Jersey', 'NJ', 0, 0),
('Arlington', 'TX', 0, 0),
('Miami', 'FL', 0, 0),
('Raleigh', 'NC', 0, 0),
('Anaheim', 'CA', 0, 0),
('Cincinnati', 'OH', 0, 0),
('Toledo', 'OH', 0, 0)
ON CONFLICT (city_name) DO NOTHING;
