/**
 * Authentication Routes
 * Handles login, register, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username or email already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, crystals, role) 
             VALUES ($1, $2, $3, 500, 'user') 
             RETURNING id, username, email, crystals, vip_level, role, created_at`,
            [username, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                crystals: user.crystals,
                vip_level: user.vip_level
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const result = await db.query(
            'SELECT id, username, email, password_hash, crystals, vip_level, role FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                crystals: user.crystals,
                vip_level: user.vip_level
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, crystals, vip_level, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, crystals, vip_level, role FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        const token = generateToken(user);

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
