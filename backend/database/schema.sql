-- ===========================================
-- Crystal Gacha Database Schema
-- NeonDB PostgreSQL
-- ===========================================

-- Users Table
-- Stores player accounts and crystal balance
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    crystals INTEGER DEFAULT 500,
    vip_level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rarity Enum Type
CREATE TYPE rarity_type AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic');

-- Cards Table  
-- All available gacha cards/blobs
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rarity rarity_type NOT NULL,
    
    -- Stats
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 10,
    speed INTEGER DEFAULT 10,
    magic INTEGER DEFAULT 10,
    
    -- Appearance
    color_primary VARCHAR(7) DEFAULT '#FFFFFF',
    color_secondary VARCHAR(7) DEFAULT '#000000',
    color_glow VARCHAR(7) DEFAULT '#FFFF00',
    shape VARCHAR(20) DEFAULT 'blob',  -- blob, stickman, slime, spirit
    
    -- Gacha rates (percentage, should sum to 100 across all cards of same rarity)
    drop_rate DECIMAL(5,2) DEFAULT 1.00,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Inventory
-- Cards owned by users
CREATE TABLE user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    UNIQUE(user_id, card_id)
);

-- Transactions Table
-- Crystal purchases and spending history
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,  -- 'topup', 'gacha', 'gift', 'refund'
    amount INTEGER NOT NULL,    -- positive for gain, negative for spend
    description TEXT,
    reference_id VARCHAR(100),  -- for topup: payment ID, for gacha: pull ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gacha History
-- Record of all gacha pulls
CREATE TABLE gacha_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    crystals_spent INTEGER NOT NULL,
    pull_type VARCHAR(20) DEFAULT 'single',  -- 'single', 'multi10'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banners Table
-- Limited time gacha banners with rate-ups
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    featured_card_id INTEGER REFERENCES cards(id),
    rate_up_multiplier DECIMAL(3,2) DEFAULT 2.00,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Logs (for tracking admin actions - also unprotected!)
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- Indexes for Performance
-- ===========================================

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_gacha_history_user ON gacha_history(user_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_banners_active ON banners(is_active, start_date, end_date);

-- ===========================================
-- Rarity Drop Rates Configuration
-- ===========================================
-- Common:    60%
-- Uncommon:  25%
-- Rare:      10%
-- Epic:       4%
-- Legendary:  0.9%
-- Mythic:     0.1%
