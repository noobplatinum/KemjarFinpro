/**
 * Users Routes - SECURED WITH JWT AUTHENTICATION
 * All endpoints require proper authentication
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');

// GET /api/users - List ALL users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, crystals, vip_level, created_at FROM users ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id - Get specific user (Owner or Admin only)
router.get('/:id', authenticateToken, requireOwnerOrAdmin('id'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT id, username, email, crystals, vip_level, created_at FROM users WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/users - Create new user (Use /api/auth/register instead)
router.post('/', async (req, res) => {
    res.status(400).json({ 
        error: 'Use /api/auth/register to create new accounts',
        message: 'Direct user creation is disabled for security'
    });
});

// PUT /api/users/:id - Update user (Owner or Admin only)
router.put('/:id', authenticateToken, requireOwnerOrAdmin('id'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email } = req.body;
        
        // Only admin can modify crystals and vip_level
        let crystals, vip_level;
        if (req.user.role === 'admin') {
            crystals = req.body.crystals;
            vip_level = req.body.vip_level;
        }
        
        const result = await db.query(
            `UPDATE users 
             SET username = COALESCE($1, username),
                 email = COALESCE($2, email),
                 crystals = COALESCE($3, crystals),
                 vip_level = COALESCE($4, vip_level),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, username, email, crystals, vip_level, updated_at`,
            [username, email, crystals, vip_level, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, username',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id/inventory - Get user's card collection (Owner or Admin only)
router.get('/:id/inventory', authenticateToken, requireOwnerOrAdmin('id'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            `SELECT ui.id, ui.quantity, ui.is_favorite, ui.obtained_at,
                    c.id as card_id, c.name, c.description, c.rarity,
                    c.attack, c.defense, c.speed, c.magic,
                    c.color_primary, c.color_secondary, c.color_glow, c.shape
             FROM user_inventory ui
             JOIN cards c ON ui.card_id = c.id
             WHERE ui.user_id = $1
             ORDER BY c.rarity DESC, c.name`,
            [id]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/users/:id/inventory/:cardId/favorite - Toggle favorite (Owner only)
router.put('/:id/inventory/:cardId/favorite', authenticateToken, requireOwnerOrAdmin('id'), async (req, res) => {
    try {
        const { id, cardId } = req.params;
        
        const result = await db.query(
            `UPDATE user_inventory 
             SET is_favorite = NOT is_favorite
             WHERE user_id = $1 AND card_id = $2
             RETURNING *`,
            [id, cardId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not in inventory' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
