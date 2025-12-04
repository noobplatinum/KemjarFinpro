/**
 * Crystal Gacha API - SECURED WITH JWT AUTHENTICATION
 * 
 * All endpoints now require proper authentication and authorization.
 * 
 * Security Features:
 * 1. JWT-based authentication on protected endpoints
 * 2. Role-based authorization (user/admin)
 * 3. Resource ownership verification
 * 4. Protected admin endpoints
 * 5. Secure password hashing with bcrypt
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser('kemjar-finpro-secret-2025'));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const gachaRoutes = require('./routes/gacha');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const transferRoutes = require('./routes/transfer');

// API Routes
app.use('/api/auth', authRoutes);      // Login/Register (public)
app.use('/api/users', userRoutes);     // User management (authenticated)
app.use('/api/cards', cardRoutes);     // Card catalog (public read)
app.use('/api/gacha', gachaRoutes);    // Gacha pulls (authenticated)
app.use('/api/shop', shopRoutes);      // Shop & transactions (authenticated)
app.use('/api/admin', adminRoutes);    // Admin only (admin role required)
app.use('/api/transfer', transferRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Crystal Gacha API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            cards: '/api/cards',
            gacha: '/api/gacha',
            shop: '/api/shop',
            admin: '/api/admin (requires admin token)',
            transfer: '/api/transfer'
        },
        note: 'This API uses JWT authentication. Login at POST /api/auth/login'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        publicEndpoints: [
            { method: 'POST', path: '/api/auth/login', desc: 'Login and get JWT token' },
            { method: 'POST', path: '/api/auth/register', desc: 'Register new user' },
            { method: 'GET', path: '/api/cards', desc: 'List all cards' },
            { method: 'GET', path: '/api/cards/:id', desc: 'Get card details' },
            { method: 'GET', path: '/api/shop/packages', desc: 'List available packages' }
        ],
        authenticatedEndpoints: [
            { method: 'GET', path: '/api/users/:id', desc: 'Get user by ID (own or admin)' },
            { method: 'PUT', path: '/api/users/:id', desc: 'Update user (own)' },
            { method: 'GET', path: '/api/users/:id/inventory', desc: 'Get user inventory (own)' },
            { method: 'POST', path: '/api/gacha/pull/:userId', desc: 'Single gacha pull (own)' },
            { method: 'POST', path: '/api/gacha/pull10/:userId', desc: 'Multi gacha pull (own)' },
            { method: 'GET', path: '/api/gacha/history/:userId', desc: 'Get pull history (own)' },
            { method: 'POST', path: '/api/shop/topup', desc: 'Top up crystals' },
            { method: 'POST', path: '/api/shop/gift', desc: 'Gift crystals to user' },
            { method: 'GET', path: '/api/shop/transactions/:userId', desc: 'Get transactions (own)' }
        ],
        adminEndpoints: [
            { method: 'GET', path: '/api/users', desc: 'List all users' },
            { method: 'DELETE', path: '/api/users/:id', desc: 'Delete user' },
            { method: 'GET', path: '/api/admin/users', desc: 'List all users with details' },
            { method: 'PUT', path: '/api/admin/crystals', desc: 'Modify user crystals' },
            { method: 'DELETE', path: '/api/admin/users/:id', desc: 'Delete user' },
            { method: 'GET', path: '/api/admin/stats', desc: 'Get system stats' }
        ],
        middlemanEndpoints: {
            auth: [
                { method: 'POST', path: '/api/transfer/register', desc: 'Middleman: Register (plain text password)' },
                { method: 'POST', path: '/api/transfer/login', desc: 'Middleman: Login (unsigned cookie)' },
                { method: 'GET', path: '/api/transfer/logout', desc: 'Middleman: Logout' },
                { method: 'GET', path: '/api/transfer/profile', desc: 'Middleman: Profile (trusts cookie blindly)' },
                { method: 'POST', path: '/api/transfer/change-password', desc: 'Middleman: Change password (IDOR vulnerability)' },
            ],
            transfer: [
                { method: 'POST', path: '/api/transfer/crystals', desc: 'Middleman: Transfer crystals (no user consent)' },
                { method: 'POST', path: '/api/transfer/cards', desc: 'Middleman: Transfer cards (no user consent)' },
                { method: 'GET', path: '/api/transfer/logs', desc: 'Middleman: View transfer logs' },
                { method: 'GET', path: '/api/transfer/users', desc: 'Middleman: List all users' },
                { method: 'GET', path: '/api/transfer/users/:id/inventory', desc: 'Middleman: Get user inventory' }
            ]
        }
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
+-----------------------------------------------------------+
|                                                           |
|   Crystal Gacha API Server                                |
|   Running on: http://localhost:${PORT}                       |
|                                                           |
|   Authentication: JWT Required                            |
|   Login: POST /api/auth/login                             |
|                                                           |
+-----------------------------------------------------------+
    `);
});

module.exports = app;
