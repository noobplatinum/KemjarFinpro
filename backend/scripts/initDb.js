/**
 * Database Initialization Script
 * Run with: npm run db:init
 */

const fs = require('fs');
const path = require('path');
const db = require('../database/db');

async function initializeDatabase() {
    console.log('🚀 Initializing Crystal Gacha Database...\n');
    
    try {
        // Read schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.length > 0) {
                try {
                    await db.query(statement);
                    console.log('✅ Executed:', statement.substring(0, 50) + '...');
                } catch (err) {
                    // Ignore "already exists" errors
                    if (!err.message.includes('already exists')) {
                        console.error('⚠️  Warning:', err.message);
                    }
                }
            }
        }
        
        console.log('\n✨ Database initialized successfully!');
        console.log('📝 Run "npm run db:seed" to add sample cards');
        
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
    } finally {
        process.exit(0);
    }
}

initializeDatabase();
