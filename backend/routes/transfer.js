const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET / - Info endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Middleman API',
        endpoints: {
            auth: ['/register', '/login', '/logout', '/profile', '/change-password'],
            transfer: ['/crystals', '/cards', '/logs']
        }
    });
});

// POST /register - Register new middleman
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.query(
            `INSERT INTO middlemen (username, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email, created_at`,
            [username, email, password]
        );

        res.status(201).json({
            message: 'Middleman registered',
            middleman: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /login { email, password }
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query(
            'SELECT id, username, email, password FROM middlemen WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const middleman = result.rows[0];

        if (middleman.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.cookie('middleman_userid', middleman.id, {
            httpOnly: false,
            signed: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            message: 'Logged in',
            middleman: {
                id: middleman.id,
                username: middleman.username,
                email: middleman.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    res.clearCookie('middleman_userid');
    res.json({ message: 'Logged out' });
});

// GET /profile - shows basic info based on cookie only
router.get('/profile', async (req, res) => {
    try {
        const middlemanId = req.cookies?.middleman_userid;

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
        res.status(500).json({ error: error.message });
    }
});

// POST /change-password { userid?, new_password }
router.post('/change-password', async (req, res) => {
    try {
        const actorId = req.cookies?.middleman_userid;
        const targetId = req.body.userid || actorId;
        const newPassword = req.body.new_password;

        if (!targetId) {
            return res.status(400).json({ error: 'No target user specified' });
        }

        if (!newPassword) {
            return res.status(400).json({ error: 'Missing new_password' });
        }

        // Check if target exists
        const checkResult = await db.query(
            'SELECT id FROM middlemen WHERE id = $1',
            [targetId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(400).json({ error: 'Target not found' });
        }

        await db.query(
            'UPDATE middlemen SET password = $1 WHERE id = $2',
            [newPassword, targetId]
        );

        res.json({ message: `Password for middleman ${targetId} changed` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// -----------------
// Transfer Routes (Middleman Power)
// -----------------

// Helper: Check if middleman is logged in
async function requireMiddleman(req, res, next) {
    const middlemanId = req.cookies?.middleman_userid;

    if (!middlemanId) {
        return res.status(401).json({ error: 'Middleman authentication required' });
    }

    const result = await db.query(
        'SELECT id, username FROM middlemen WHERE id = $1',
        [middlemanId]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid middleman session' });
    }

    req.middleman = result.rows[0];
    next();
}

// POST /crystals - Transfer crystals between users
router.post('/crystals', requireMiddleman, async (req, res) => {
    try {
        const { fromUserId, toUserId, amount } = req.body;

        if (!fromUserId || !toUserId || !amount) {
            return res.status(400).json({ error: 'Missing required fields: fromUserId, toUserId, amount' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        if (fromUserId === toUserId) {
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

        if (sender.crystals < amount) {
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

        // Execute transfer
        await db.query('BEGIN');

        try {
            // Deduct from sender
            await db.query(
                'UPDATE users SET crystals = crystals - $1 WHERE id = $2',
                [amount, fromUserId]
            );

            // Add to receiver
            await db.query(
                'UPDATE users SET crystals = crystals + $1 WHERE id = $2',
                [amount, toUserId]
            );

            // Log transaction for sender (negative)
            await db.query(
                `INSERT INTO transactions (user_id, type, amount, description, reference_id)
         VALUES ($1, 'transfer', $2, $3, $4)`,
                [fromUserId, -amount, `Middleman transfer to ${receiver.username}`, `middleman_${req.middleman.id}`]
            );

            // Log transaction for receiver (positive)
            await db.query(
                `INSERT INTO transactions (user_id, type, amount, description, reference_id)
         VALUES ($1, 'transfer', $2, $3, $4)`,
                [toUserId, amount, `Middleman transfer from ${sender.username}`, `middleman_${req.middleman.id}`]
            );

            // Log middleman action
            await db.query(
                `INSERT INTO middleman_logs (middleman_id, action_type, from_user_id, to_user_id, transfer_type, amount)
         VALUES ($1, 'transfer', $2, $3, 'crystals', $4)`,
                [req.middleman.id, fromUserId, toUserId, amount]
            );

            await db.query('COMMIT');

            res.json({
                success: true,
                message: `Transferred ${amount} crystals from ${sender.username} to ${receiver.username}`,
                transfer: {
                    from: { id: fromUserId, username: sender.username },
                    to: { id: toUserId, username: receiver.username },
                    amount: amount,
                    executedBy: req.middleman.username
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /cards - Transfer cards between users
router.post('/cards', requireMiddleman, async (req, res) => {
    try {
        const { fromUserId, toUserId, cardId, quantity = 1 } = req.body;

        if (!fromUserId || !toUserId || !cardId) {
            return res.status(400).json({ error: 'Missing required fields: fromUserId, toUserId, cardId' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be positive' });
        }

        if (fromUserId === toUserId) {
            return res.status(400).json({ error: 'Cannot transfer to same user' });
        }

        // Check sender has the card with enough quantity
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

        if (senderInventory.rows[0].quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient card quantity' });
        }

        const cardName = senderInventory.rows[0].card_name;

        // Check users exist
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

        // Execute card transfer
        await db.query('BEGIN');

        try {
            const currentQty = senderInventory.rows[0].quantity;

            if (currentQty === quantity) {
                // Remove entire inventory entry
                await db.query(
                    'DELETE FROM user_inventory WHERE user_id = $1 AND card_id = $2',
                    [fromUserId, cardId]
                );
            } else {
                // Reduce quantity
                await db.query(
                    'UPDATE user_inventory SET quantity = quantity - $1 WHERE user_id = $2 AND card_id = $3',
                    [quantity, fromUserId, cardId]
                );
            }

            // Add to receiver (upsert)
            await db.query(
                `INSERT INTO user_inventory (user_id, card_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, card_id) 
         DO UPDATE SET quantity = user_inventory.quantity + $3`,
                [toUserId, cardId, quantity]
            );

            // Log middleman action
            await db.query(
                `INSERT INTO middleman_logs (middleman_id, action_type, from_user_id, to_user_id, transfer_type, card_id, quantity)
         VALUES ($1, 'transfer', $2, $3, 'card', $4, $5)`,
                [req.middleman.id, fromUserId, toUserId, cardId, quantity]
            );

            await db.query('COMMIT');

            res.json({
                success: true,
                message: `Transferred ${quantity}x ${cardName} from ${sender.username} to ${receiver.username}`,
                transfer: {
                    from: { id: fromUserId, username: sender.username },
                    to: { id: toUserId, username: receiver.username },
                    card: { id: cardId, name: cardName },
                    quantity: quantity,
                    executedBy: req.middleman.username
                }
            });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

// GET /users/:id/inventory - Get user's card inventory (for middleman)
router.get('/users/:id/inventory', requireMiddleman, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Join with cards table to get card details
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

        // Transform to nested structure that frontend expects
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
                image_url: row.image_url,
                description: row.description
            }
        }));

        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
