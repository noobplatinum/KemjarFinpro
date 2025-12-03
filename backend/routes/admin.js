/**
 * Admin Routes - NO AUTHENTICATION
 * Admin endpoints exposed without any auth!
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/admin/users - List ALL users with FULL details including password hashes!
router.get('/users', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, username, email, password_hash, crystals, vip_level, created_at, updated_at
             FROM users ORDER BY id`
        );
        res.json({
            warning: '⚠️ ADMIN ENDPOINT - Full user data exposed!',
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/crystals - Modify any user's crystal balance
router.put('/crystals', async (req, res) => {
    try {
        const { userId, amount, action } = req.body;
        
        if (!userId || amount === undefined) {
            return res.status(400).json({ error: 'Missing userId or amount' });
        }
        
        let query;
        if (action === 'set') {
            query = 'UPDATE users SET crystals = $1 WHERE id = $2 RETURNING *';
        } else if (action === 'subtract') {
            query = 'UPDATE users SET crystals = crystals - $1 WHERE id = $2 RETURNING *';
        } else {
            // Default: add
            query = 'UPDATE users SET crystals = crystals + $1 WHERE id = $2 RETURNING *';
        }
        
        const result = await db.query(query, [amount, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['modify_crystals', 'users', userId, JSON.stringify({ amount, action })]
        );
        
        res.json({
            success: true,
            user: result.rows[0],
            message: `Crystals ${action || 'added'}: ${amount}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/vip - Modify any user's VIP level
router.put('/vip', async (req, res) => {
    try {
        const { userId, vipLevel } = req.body;
        
        const result = await db.query(
            'UPDATE users SET vip_level = $1 WHERE id = $2 RETURNING *',
            [vipLevel, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete any user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username, email',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['delete_user', 'users', id, JSON.stringify(result.rows[0])]
        );
        
        res.json({
            success: true,
            message: 'User deleted',
            deletedUser: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/cards - Create new card
router.post('/cards', async (req, res) => {
    try {
        const { name, description, rarity, attack, defense, speed, magic,
                color_primary, color_secondary, color_glow, shape, drop_rate } = req.body;
        
        const result = await db.query(
            `INSERT INTO cards (name, description, rarity, attack, defense, speed, magic,
                               color_primary, color_secondary, color_glow, shape, drop_rate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [name, description, rarity, attack, defense, speed, magic,
             color_primary, color_secondary, color_glow, shape, drop_rate]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/cards/:id - Modify card
router.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const query = `UPDATE cards SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
        
        const result = await db.query(query, [...values, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/cards/:id - Delete card
router.delete('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'DELETE FROM cards WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json({ success: true, deletedCard: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/give-card - Give card to user
router.post('/give-card', async (req, res) => {
    try {
        const { userId, cardId, quantity = 1 } = req.body;
        
        await db.query(
            `INSERT INTO user_inventory (user_id, card_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, card_id) 
             DO UPDATE SET quantity = user_inventory.quantity + $3`,
            [userId, cardId, quantity]
        );
        
        res.json({ success: true, message: `Gave ${quantity}x card to user` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/stats - System statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        
        // User stats
        const userStats = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(crystals) as total_crystals,
                AVG(crystals) as avg_crystals,
                MAX(vip_level) as max_vip
            FROM users
        `);
        stats.users = userStats.rows[0];
        
        // Card stats
        const cardStats = await db.query(`
            SELECT rarity, COUNT(*) as count
            FROM cards
            GROUP BY rarity
        `);
        stats.cards = cardStats.rows;
        
        // Transaction stats
        const txStats = await db.query(`
            SELECT type, COUNT(*) as count, SUM(amount) as total
            FROM transactions
            GROUP BY type
        `);
        stats.transactions = txStats.rows;
        
        // Recent activity
        const recentPulls = await db.query(`
            SELECT COUNT(*) as count FROM gacha_history 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        `);
        stats.recentPulls = recentPulls.rows[0].count;
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/logs - View admin action logs
router.get('/logs', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 100`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/reset-db - DANGEROUS: Reset all user data
router.post('/reset-db', async (req, res) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'RESET_ALL_DATA') {
            return res.status(400).json({ 
                error: 'Must confirm with: { "confirm": "RESET_ALL_DATA" }' 
            });
        }
        
        await db.query('DELETE FROM gacha_history');
        await db.query('DELETE FROM transactions');
        await db.query('DELETE FROM user_inventory');
        await db.query('UPDATE users SET crystals = 500');
        
        res.json({ 
            success: true, 
            message: '⚠️ All game data has been reset!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
