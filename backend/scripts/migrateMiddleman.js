/**
 * Migration script to add Middleman tables
 * Run this to add the middlemen and middleman_logs tables to your database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('Starting Middleman tables migration...\n');

        // Create middlemen table
        console.log('Creating middlemen table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS middlemen (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('middlemen table created\n');

        // Create middleman_logs table
        console.log('Creating middleman_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS middleman_logs (
                id SERIAL PRIMARY KEY,
                middleman_id INTEGER REFERENCES middlemen(id) ON DELETE SET NULL,
                action_type VARCHAR(20) NOT NULL,
                from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                transfer_type VARCHAR(20),
                amount INTEGER,
                card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
                quantity INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('middleman_logs table created\n');

        // Create indexes
        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_middleman_logs_middleman ON middleman_logs(middleman_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_middleman_logs_created ON middleman_logs(created_at);
        `);
        console.log('Indexes created\n');

        // Create a default middleman account for testing
        console.log('Creating default middleman account...');
        const existingMiddleman = await client.query(
            'SELECT id FROM middlemen WHERE email = $1',
            ['admin@middleman.com']
        );

        if (existingMiddleman.rows.length === 0) {
            await client.query(`
                INSERT INTO middlemen (username, email, password)
                VALUES ('admin', 'admin@middleman.com', 'admin123')
            `);
            console.log('Default middleman created:');
            console.log('   Email: admin@middleman.com');
            console.log('   Password: admin123');
            console.log('   WARNING: Password stored in plain text (intentionally insecure)\n');
        } else {
            console.log('Default middleman already exists\n');
        }

    } catch (error) {
        console.error('Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(console.error);
