/**
 * ⚠️  VULNERABLE API - NO AUTHENTICATION ⚠️
 * 
 * This API is intentionally vulnerable for penetration testing purposes.
 * DO NOT USE IN PRODUCTION!
 * 
 * Vulnerabilities:
 * 1. No authentication on any endpoint
 * 2. No authorization checks
 * 3. Direct user ID manipulation
 * 4. Exposed admin endpoints
 * 5. No rate limiting
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());  // Allow all origins - also vulnerable!
app.use(express.json());

// Import routes
const userRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const gachaRoutes = require('./routes/gacha');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

// API Routes - ALL UNPROTECTED!
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);  // Admin routes exposed without auth!

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🔮 Crystal Gacha API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            cards: '/api/cards',
            gacha: '/api/gacha',
            shop: '/api/shop',
            admin: '/api/admin'
        },
        warning: '⚠️ This API has no authentication - for testing only!'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        endpoints: [
            { method: 'GET', path: '/api/users', desc: 'List all users' },
            { method: 'GET', path: '/api/users/:id', desc: 'Get user by ID' },
            { method: 'POST', path: '/api/users', desc: 'Create new user' },
            { method: 'PUT', path: '/api/users/:id', desc: 'Update user' },
            { method: 'DELETE', path: '/api/users/:id', desc: 'Delete user' },
            { method: 'GET', path: '/api/users/:id/inventory', desc: 'Get user inventory' },
            { method: 'GET', path: '/api/cards', desc: 'List all cards' },
            { method: 'GET', path: '/api/cards/:id', desc: 'Get card details' },
            { method: 'POST', path: '/api/gacha/pull/:userId', desc: 'Single gacha pull' },
            { method: 'POST', path: '/api/gacha/pull10/:userId', desc: 'Multi gacha pull (10x)' },
            { method: 'GET', path: '/api/gacha/history/:userId', desc: 'Get pull history' },
            { method: 'POST', path: '/api/shop/topup', desc: 'Top up crystals' },
            { method: 'GET', path: '/api/shop/transactions/:userId', desc: 'Get transaction history' },
            { method: 'GET', path: '/api/admin/users', desc: '⚠️ Admin: List all users with details' },
            { method: 'PUT', path: '/api/admin/crystals', desc: '⚠️ Admin: Modify user crystals' },
            { method: 'DELETE', path: '/api/admin/users/:id', desc: '⚠️ Admin: Delete user' },
            { method: 'GET', path: '/api/admin/stats', desc: '⚠️ Admin: Get system stats' }
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔮 Crystal Gacha API Server                             ║
║   Running on: http://localhost:${PORT}                    ║
║                                                           ║
║   ⚠️  WARNING: No Authentication Enabled!                ║
║   This server is intentionally vulnerable.                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
