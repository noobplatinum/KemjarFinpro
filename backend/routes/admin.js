/**
 * Admin Routes - SECURED WITH JWT + ADMIN ROLE CHECK
 * All admin endpoints require valid JWT token AND vip_level >= 99
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication and admin check to ALL admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - List ALL users (password hashes excluded for security)
router.get('/users', async (req, res) => {
    try {
        // Note: Even for admins, we exclude password_hash from the response
        const result = await db.query(
            `SELECT id, username, email, crystals, vip_level, created_at, updated_at
             FROM users ORDER BY id`
        );
        
        // Log admin access
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['list_users', 'users', req.user.id, JSON.stringify({ admin_id: req.user.id, admin_username: req.user.username })]
        );
        
        res.json({
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/crystals - Modify any user's crystal balance (admin only)
router.put('/crystals', async (req, res) => {
    try {
        const { userId, amount, action } = req.body;
        
        if (!userId || amount === undefined) {
            return res.status(400).json({ error: 'Missing userId or amount' });
        }
        
        let query;
        if (action === 'set') {
            query = 'UPDATE users SET crystals = $1 WHERE id = $2 RETURNING id, username, email, crystals, vip_level';
        } else if (action === 'subtract') {
            query = 'UPDATE users SET crystals = crystals - $1 WHERE id = $2 RETURNING id, username, email, crystals, vip_level';
        } else {
            // Default: add
            query = 'UPDATE users SET crystals = crystals + $1 WHERE id = $2 RETURNING id, username, email, crystals, vip_level';
        }
        
        const result = await db.query(query, [amount, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log admin action with admin info
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['modify_crystals', 'users', userId, JSON.stringify({ 
                amount, 
                action, 
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
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

// PUT /api/admin/vip - Modify any user's VIP level (admin only)
router.put('/vip', async (req, res) => {
    try {
        const { userId, vipLevel } = req.body;
        
        // Prevent changing own VIP level
        if (userId === req.user.id) {
            return res.status(403).json({ error: 'Cannot modify your own VIP level' });
        }
        
        const result = await db.query(
            'UPDATE users SET vip_level = $1 WHERE id = $2 RETURNING id, username, email, crystals, vip_level',
            [vipLevel, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['modify_vip', 'users', userId, JSON.stringify({ 
                vipLevel, 
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
        );
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete any user (admin only)
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(403).json({ error: 'Cannot delete your own account' });
        }
        
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
            ['delete_user', 'users', id, JSON.stringify({ 
                ...result.rows[0],
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
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

// POST /api/admin/cards - Create new card (admin only)
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
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['create_card', 'cards', result.rows[0].id, JSON.stringify({ 
                name,
                rarity,
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/admin/cards/:id - Modify card (admin only)
router.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Whitelist allowed fields to prevent SQL injection
        const allowedFields = ['name', 'description', 'rarity', 'attack', 'defense', 
                              'speed', 'magic', 'color_primary', 'color_secondary', 
                              'color_glow', 'shape', 'drop_rate'];
        const fields = Object.keys(updates).filter(f => allowedFields.includes(f));
        const values = fields.map(f => updates[f]);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const query = `UPDATE cards SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
        
        const result = await db.query(query, [...values, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['modify_card', 'cards', id, JSON.stringify({ 
                fields,
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/cards/:id - Delete card (admin only)
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
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['delete_card', 'cards', id, JSON.stringify({ 
                name: result.rows[0].name,
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
        );
        
        res.json({ success: true, deletedCard: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/give-card - Give card to user (admin only)
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
        
        // Log admin action
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['give_card', 'user_inventory', userId, JSON.stringify({ 
                cardId,
                quantity,
                admin_id: req.user.id, 
                admin_username: req.user.username 
            })]
        );
        
        res.json({ success: true, message: `Gave ${quantity}x card to user` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/stats - System statistics (admin only)
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        
        // User stats (excluding sensitive data)
        const userStats = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(crystals) as total_crystals,
                AVG(crystals)::integer as avg_crystals,
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

// GET /api/admin/logs - View admin action logs (admin only)
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

// POST /api/admin/reset-db - Reset all user data (super admin only, requires confirmation)
router.post('/reset-db', async (req, res) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'RESET_ALL_DATA') {
            return res.status(400).json({ 
                error: 'Must confirm with: { "confirm": "RESET_ALL_DATA" }' 
            });
        }
        
        // Log before reset
        await db.query(
            `INSERT INTO admin_logs (action, target_table, target_id, details)
             VALUES ($1, $2, $3, $4)`,
            ['reset_database', 'all', req.user.id, JSON.stringify({ 
                admin_id: req.user.id, 
                admin_username: req.user.username,
                timestamp: new Date().toISOString()
            })]
        );
        
        await db.query('DELETE FROM gacha_history');
        await db.query('DELETE FROM transactions');
        await db.query('DELETE FROM user_inventory');
        await db.query('UPDATE users SET crystals = 500');
        
        res.json({ 
            success: true, 
            message: 'All game data has been reset!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
