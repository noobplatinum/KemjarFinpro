/**
 * Cards Routes
 * Card information (less sensitive, but still no auth)
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/cards - List all cards
router.get('/', async (req, res) => {
    try {
        const { rarity } = req.query;
        
        let query = `
            SELECT id, name, description, rarity, attack, defense, speed, magic,
                   color_primary, color_secondary, color_glow, shape, drop_rate
            FROM cards
        `;
        const params = [];
        
        if (rarity) {
            query += ' WHERE rarity = $1';
            params.push(rarity);
        }
        
        query += ' ORDER BY CASE rarity ' +
                 "WHEN 'mythic' THEN 1 " +
                 "WHEN 'legendary' THEN 2 " +
                 "WHEN 'epic' THEN 3 " +
                 "WHEN 'rare' THEN 4 " +
                 "WHEN 'uncommon' THEN 5 " +
                 "ELSE 6 END, name";
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/cards/rarities - Get rarity breakdown
router.get('/rarities', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT rarity, COUNT(*) as count, SUM(drop_rate) as total_rate
            FROM cards
            GROUP BY rarity
            ORDER BY CASE rarity 
                WHEN 'mythic' THEN 1 
                WHEN 'legendary' THEN 2 
                WHEN 'epic' THEN 3 
                WHEN 'rare' THEN 4 
                WHEN 'uncommon' THEN 5 
                ELSE 6 END
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/cards/:id - Get specific card
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT * FROM cards WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/cards/:id/owners - See who owns this card (VULNERABLE: privacy issue)
router.get('/:id/owners', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT u.id, u.username, ui.quantity, ui.obtained_at
             FROM user_inventory ui
             JOIN users u ON ui.user_id = u.id
             WHERE ui.card_id = $1
             ORDER BY ui.quantity DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
