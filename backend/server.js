const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,  // Allow all origins - also vulnerable!
    credentials: true  // Allow cookies for middleman auth
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));  // For form submissions
app.use(cookieParser());  // INSECURE: cookies not signed

// Import routes
const userRoutes = require('./routes/users');
const cardRoutes = require('./routes/cards');
const gachaRoutes = require('./routes/gacha');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const transferRoutes = require('./routes/transfer');

// API Routes - ALL UNPROTECTED!
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);  // Admin routes exposed without auth!
app.use('/api/transfer', transferRoutes);  // Middleman routes - intentionally insecure!

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
            admin: '/api/admin',
            transfer: '/api/transfer (Middleman - INSECURE!)'
        },
        warning: 'This API has no authentication - for testing only!'
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
            { method: 'GET', path: '/api/admin/users', desc: 'Admin: List all users with details' },
            { method: 'PUT', path: '/api/admin/crystals', desc: 'Admin: Modify user crystals' },
            { method: 'DELETE', path: '/api/admin/users/:id', desc: 'Admin: Delete user' },
            { method: 'GET', path: '/api/admin/stats', desc: 'Admin: Get system stats' },
            { method: 'POST', path: '/api/transfer/register', desc: 'Middleman: Register (plain text password!)' },
            { method: 'POST', path: '/api/transfer/login', desc: 'Middleman: Login (unsigned cookie!)' },
            { method: 'GET', path: '/api/transfer/logout', desc: 'Middleman: Logout' },
            { method: 'GET', path: '/api/transfer/profile', desc: 'Middleman: Profile (trusts cookie blindly!)' },
            { method: 'POST', path: '/api/transfer/change-password', desc: 'Middleman: Change password (IDOR vulnerability!)' },
            { method: 'POST', path: '/api/transfer/crystals', desc: 'Middleman: Transfer crystals (no user consent!)' },
            { method: 'POST', path: '/api/transfer/cards', desc: 'Middleman: Transfer cards (no user consent!)' },
            { method: 'GET', path: '/api/transfer/logs', desc: 'Middleman: View transfer logs' }
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
║    WARNING: No Authentication Enabled!                ║
║   This server is intentionally vulnerable.                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
