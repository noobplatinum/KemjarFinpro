/**
 * Middleman Routes - SECURED VERSION
 * 
 * Security Fixes Applied:
 * 1. Password Hashing with bcrypt (12 rounds)
 * 2. Secure Cookie Configuration (httpOnly, signed, secure, sameSite: strict)
 * 3. IDOR Fix - Users can only change their own password
 * 4. Current Password Verification required for password change
 * 5. CSRF Protection via csurf middleware
 * 6. Rate Limiting on sensitive endpoints
 * 7. Input Validation and Sanitization
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const db = require('../database/db');

// ==========================================
// Security Configuration
// ==========================================

const BCRYPT_ROUNDS = 12;
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// CSRF Protection middleware
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Rate Limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 5, // 5 attempts per window
    message: { error: 'Too many attempts. Please try again after 5 seconds.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate Limiting for password change
const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: { error: 'Too many password change attempts. Please try again after 1 hour.' }
});

// ==========================================
// Helper Functions
// ==========================================

// Setingan untuk signed secure cookies
const getSecureCookieOptions = () => ({
    httpOnly: true, // Membuat cookie tidak bisa diakses via JS
    signed: true, // Cookie bersifat signed sehingga tidak bisa dimanipulasi
    secure: process.env.NODE_ENV === 'production', // Hanya kirim cookie via HTTPS di production
    sameSite: 'strict', // Cegah CSRF
    maxAge: COOKIE_MAX_AGE
});

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// ==========================================
// Auth Routes (SECURED)
// ==========================================

// GET / - Info endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Middleman API (Secured)',
        security: [
            'Password hashing with bcrypt',
            'Secure httpOnly signed cookies',
            'CSRF protection enabled',
            'Rate limiting on auth endpoints',
            'Password strength requirements'
        ],
        endpoints: {
            auth: ['/register', '/login', '/logout', '/profile', '/change-password'],
            transfer: ['/crystals', '/cards', '/logs']
        }
    });
});

// GET /csrf-token - Get CSRF token for forms
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// POST /register - Register new middleman (SECURED)
router.post('/register', authLimiter, csrfProtection, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Username must be 3-50 characters' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({ 
                error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number' 
            });
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        const result = await db.query(
            `INSERT INTO middlemen (username, email, password) 
             VALUES ($1, $2, $3) 
             RETURNING id, username, email, created_at`,
            [username.trim(), email.toLowerCase().trim(), hashedPassword]
        );

        res.status(201).json({
            message: 'Middleman registered successfully',
            middleman: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /login - Login (SECURED)
router.post('/login', authLimiter, csrfProtection, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const result = await db.query(
            'SELECT id, username, email, password FROM middlemen WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            // Use same error message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const middleman = result.rows[0];

        // Compare password with bcrypt
        const isValidPassword = await bcrypt.compare(password, middleman.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set secure cookie
        res.cookie('middleman_userid', middleman.id, getSecureCookieOptions());

        res.json({
            message: 'Logged in successfully',
            middleman: {
                id: middleman.id,
                username: middleman.username,
                email: middleman.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /logout - Logout (SECURED)
router.get('/logout', (req, res) => {
    res.clearCookie('middleman_userid', {
        httpOnly: true,
        signed: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ message: 'Logged out successfully' });
});

// GET /profile - Get profile (SECURED)
router.get('/profile', async (req, res) => {
    try {
        // Use signed cookie
        const middlemanId = req.signedCookies?.middleman_userid;

        if (!middlemanId) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        const result = await db.query(
            'SELECT id, username, email, created_at FROM middlemen WHERE id = $1',
            [middlemanId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// POST /change-password - Change password (SECURED - IDOR FIXED)
router.post('/change-password', passwordChangeLimiter, csrfProtection, async (req, res) => {
    try {
        // FIX 1: Only allow changing own password (no userid from body)
        const middlemanId = req.signedCookies?.middleman_userid;

        if (!middlemanId) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        // FIX 2: Require current password verification
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Current password and new password required' });
        }

        // FIX 3: Validate new password strength
        if (!isStrongPassword(new_password)) {
            return res.status(400).json({ 
                error: 'New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number' 
            });
        }

        // Get current user's hashed password
        const result = await db.query(
            'SELECT id, password FROM middlemen WHERE id = $1',
            [middlemanId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const middleman = result.rows[0];

        // FIX 4: Verify current password
        const isValidPassword = await bcrypt.compare(current_password, middleman.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // FIX 5: Hash new password
        const hashedNewPassword = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

        await db.query(
            'UPDATE middlemen SET password = $1 WHERE id = $2',
            [hashedNewPassword, middlemanId]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ==========================================
// Transfer Routes (SECURED)
// ==========================================

// Helper: Check if middleman is logged in (SECURED)
async function requireMiddleman(req, res, next) {
    // Use signed cookie instead of regular cookie
    const middlemanId = req.signedCookies?.middleman_userid;

    if (!middlemanId) {
        return res.status(401).json({ error: 'Middleman authentication required' });
    }

    try {
        const result = await db.query(
            'SELECT id, username FROM middlemen WHERE id = $1',
            [middlemanId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid middleman session' });
        }

        req.middleman = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// POST /crystals - Transfer crystals between users (with CSRF protection)
router.post('/crystals', requireMiddleman, csrfProtection, async (req, res) => {
    try {
        const { fromUserId, toUserId, amount } = req.body;

        if (!fromUserId || !toUserId || !amount) {
            return res.status(400).json({ error: 'Missing required fields: fromUserId, toUserId, amount' });
        }

        const parsedAmount = parseInt(amount, 10);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        if (parseInt(fromUserId) === parseInt(toUserId)) {
            return res.status(400).json({ error: 'Cannot transfer to same user' });
        }

        // Check sender has enough crystals
        const senderResult = await db.query(
            'SELECT id, username, crystals FROM users WHERE id = $1',
            [fromUserId]
        );

        if (senderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sender not found' });
        }

        const sender = senderResult.rows[0];

        if (sender.crystals < parsedAmount) {
            return res.status(400).json({ error: 'Insufficient crystals' });
        }

        // Check receiver exists
        const receiverResult = await db.query(
            'SELECT id, username FROM users WHERE id = $1',
            [toUserId]
        );

        if (receiverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        const receiver = receiverResult.rows[0];

        // Execute transfer in transaction
        await db.query('BEGIN');

        try {
            await db.query(
                'UPDATE users SET crystals = crystals - $1 WHERE id = $2',
                [parsedAmount, fromUserId]
            );

            await db.query(
                'UPDATE users SET crystals = crystals + $1 WHERE id = $2',
                [parsedAmount, toUserId]
            );

            await db.query(
                `INSERT INTO transactions (user_id, type, amount, description, reference_id)
                 VALUES ($1, 'transfer', $2, $3, $4)`,
                [fromUserId, -parsedAmount, `Middleman transfer to ${receiver.username}`, `middleman_${req.middleman.id}`]
            );

            await db.query(
                `INSERT INTO transactions (user_id, type, amount, description, reference_id)
                 VALUES ($1, 'transfer', $2, $3, $4)`,
                [toUserId, parsedAmount, `Middleman transfer from ${sender.username}`, `middleman_${req.middleman.id}`]
            );

            await db.query(
                `INSERT INTO middleman_logs (middleman_id, action_type, from_user_id, to_user_id, transfer_type, amount)
                 VALUES ($1, 'transfer', $2, $3, 'crystals', $4)`,
                [req.middleman.id, fromUserId, toUserId, parsedAmount]
            );

            await db.query('COMMIT');

            res.json({
                success: true,
                message: `Transferred ${parsedAmount} crystals from ${sender.username} to ${receiver.username}`,
                transfer: {
                    from: { id: fromUserId, username: sender.username },
                    to: { id: toUserId, username: receiver.username },
                    amount: parsedAmount,
                    executedBy: req.middleman.username
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Crystal transfer error:', error);
        res.status(500).json({ error: 'Transfer failed' });
    }
});

// POST /cards - Transfer cards between users (with CSRF protection)
router.post('/cards', requireMiddleman, csrfProtection, async (req, res) => {
    try {
        const { fromUserId, toUserId, cardId, quantity = 1 } = req.body;

        if (!fromUserId || !toUserId || !cardId) {
            return res.status(400).json({ error: 'Missing required fields: fromUserId, toUserId, cardId' });
        }

        const parsedQuantity = parseInt(quantity, 10);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be a positive number' });
        }

        if (parseInt(fromUserId) === parseInt(toUserId)) {
            return res.status(400).json({ error: 'Cannot transfer to same user' });
        }

        const senderInventory = await db.query(
            `SELECT ui.quantity, c.name as card_name 
             FROM user_inventory ui 
             JOIN cards c ON c.id = ui.card_id
             WHERE ui.user_id = $1 AND ui.card_id = $2`,
            [fromUserId, cardId]
        );

        if (senderInventory.rows.length === 0) {
            return res.status(400).json({ error: 'Sender does not own this card' });
        }

        if (senderInventory.rows[0].quantity < parsedQuantity) {
            return res.status(400).json({ error: 'Insufficient card quantity' });
        }

        const cardName = senderInventory.rows[0].card_name;

        const senderResult = await db.query('SELECT id, username FROM users WHERE id = $1', [fromUserId]);
        const receiverResult = await db.query('SELECT id, username FROM users WHERE id = $1', [toUserId]);

        if (senderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sender not found' });
        }
        if (receiverResult.rows.length === 0) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        const sender = senderResult.rows[0];
        const receiver = receiverResult.rows[0];

        await db.query('BEGIN');

        try {
            const currentQty = senderInventory.rows[0].quantity;

            if (currentQty === parsedQuantity) {
                await db.query(
                    'DELETE FROM user_inventory WHERE user_id = $1 AND card_id = $2',
                    [fromUserId, cardId]
                );
            } else {
                await db.query(
                    'UPDATE user_inventory SET quantity = quantity - $1 WHERE user_id = $2 AND card_id = $3',
                    [parsedQuantity, fromUserId, cardId]
                );
            }

            await db.query(
                `INSERT INTO user_inventory (user_id, card_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, card_id) 
                 DO UPDATE SET quantity = user_inventory.quantity + $3`,
                [toUserId, cardId, parsedQuantity]
            );

            await db.query(
                `INSERT INTO middleman_logs (middleman_id, action_type, from_user_id, to_user_id, transfer_type, card_id, quantity)
                 VALUES ($1, 'transfer', $2, $3, 'card', $4, $5)`,
                [req.middleman.id, fromUserId, toUserId, cardId, parsedQuantity]
            );

            await db.query('COMMIT');

            res.json({
                success: true,
                message: `Transferred ${parsedQuantity}x ${cardName} from ${sender.username} to ${receiver.username}`,
                transfer: {
                    from: { id: fromUserId, username: sender.username },
                    to: { id: toUserId, username: receiver.username },
                    card: { id: cardId, name: cardName },
                    quantity: parsedQuantity,
                    executedBy: req.middleman.username
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Card transfer error:', error);
        res.status(500).json({ error: 'Transfer failed' });
    }
});

// GET /logs - Get middleman transfer logs
router.get('/logs', requireMiddleman, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                ml.*,
                m.username as middleman_name,
                fu.username as from_username,
                tu.username as to_username,
                c.name as card_name
             FROM middleman_logs ml
             JOIN middlemen m ON m.id = ml.middleman_id
             LEFT JOIN users fu ON fu.id = ml.from_user_id
             LEFT JOIN users tu ON tu.id = ml.to_user_id
             LEFT JOIN cards c ON c.id = ml.card_id
             ORDER BY ml.created_at DESC
             LIMIT 100`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Logs error:', error);
        res.status(500).json({ error: 'Failed to get logs' });
    }
});

// GET /users - List all users (for middleman to select from/to)
router.get('/users', requireMiddleman, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, crystals FROM users ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// GET /users/:id/inventory - Get user's card inventory (for middleman)
router.get('/users/:id/inventory', requireMiddleman, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const result = await db.query(
            `SELECT 
                ui.user_id,
                ui.card_id,
                ui.quantity,
                c.id,
                c.name,
                c.rarity,
                c.attack,
                c.defense,
                c.speed,
                c.magic,
                c.color_primary,
                c.color_secondary,
                c.color_glow,
                c.shape,
                c.description
            FROM user_inventory ui
            JOIN cards c ON ui.card_id = c.id
            WHERE ui.user_id = $1 AND ui.quantity > 0
            ORDER BY c.rarity DESC, c.name ASC`,
            [userId]
        );

        const inventory = result.rows.map(row => ({
            user_id: row.user_id,
            card_id: row.card_id,
            quantity: row.quantity,
            card: {
                id: row.id,
                name: row.name,
                rarity: row.rarity,
                attack: row.attack,
                defense: row.defense,
                speed: row.speed,
                magic: row.magic,
                color_primary: row.color_primary,
                color_secondary: row.color_secondary,
                color_glow: row.color_glow,
                shape: row.shape,
                description: row.description
            }
        }));

        res.json(inventory);
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ error: 'Failed to get inventory' });
    }
});

module.exports = router;
