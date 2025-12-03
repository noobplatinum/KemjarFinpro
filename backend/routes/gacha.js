/**
 * Gacha Routes - NO AUTHENTICATION
 * Pull mechanics with no user verification
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

const GACHA_COST = parseInt(process.env.GACHA_COST) || 100;
const MULTI_DISCOUNT = 0.9; // 10% discount on 10-pull

// Rarity weights
const RARITY_WEIGHTS = {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 0.9,
    mythic: 0.1
};

// Helper function to select rarity based on weights
function selectRarity() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        cumulative += weight;
        if (rand <= cumulative) {
            return rarity;
        }
    }
    return 'common';
}

// Helper function to select a random card of given rarity
async function selectCard(rarity) {
    const result = await db.query(
        `SELECT * FROM cards WHERE rarity = $1 ORDER BY RANDOM() LIMIT 1`,
        [rarity]
    );
    return result.rows[0];
}

// POST /api/gacha/pull/:userId - Single pull (VULNERABLE: no auth, just userId)
router.post('/pull/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check user exists and has enough crystals
        const userResult = await db.query(
            'SELECT id, username, crystals FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        if (user.crystals < GACHA_COST) {
            return res.status(400).json({ 
                error: 'Not enough crystals',
                required: GACHA_COST,
                current: user.crystals
            });
        }
        
        // Perform the pull
        const rarity = selectRarity();
        const card = await selectCard(rarity);
        
        if (!card) {
            return res.status(500).json({ error: 'No cards available' });
        }
        
        // Deduct crystals
        await db.query(
            'UPDATE users SET crystals = crystals - $1 WHERE id = $2',
            [GACHA_COST, userId]
        );
        
        // Add to inventory (or increment quantity)
        await db.query(
            `INSERT INTO user_inventory (user_id, card_id, quantity)
             VALUES ($1, $2, 1)
             ON CONFLICT (user_id, card_id) 
             DO UPDATE SET quantity = user_inventory.quantity + 1`,
            [userId, card.id]
        );
        
        // Record transaction
        await db.query(
            `INSERT INTO transactions (user_id, type, amount, description)
             VALUES ($1, 'gacha', $2, $3)`,
            [userId, -GACHA_COST, `Single pull - Got ${card.name}`]
        );
        
        // Record gacha history
        await db.query(
            `INSERT INTO gacha_history (user_id, card_id, crystals_spent, pull_type)
             VALUES ($1, $2, $3, 'single')`,
            [userId, card.id, GACHA_COST]
        );
        
        // Get updated crystal count
        const updatedUser = await db.query(
            'SELECT crystals FROM users WHERE id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            pull: {
                card: card,
                isNew: true, // Could check if they already had it
                crystalsSpent: GACHA_COST,
                remainingCrystals: updatedUser.rows[0].crystals
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/gacha/pull10/:userId - 10x pull with discount
router.post('/pull10/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const totalCost = Math.floor(GACHA_COST * 10 * MULTI_DISCOUNT);
        
        // Check user exists and has enough crystals
        const userResult = await db.query(
            'SELECT id, username, crystals FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        if (user.crystals < totalCost) {
            return res.status(400).json({ 
                error: 'Not enough crystals',
                required: totalCost,
                current: user.crystals
            });
        }
        
        // Perform 10 pulls
        const pulls = [];
        for (let i = 0; i < 10; i++) {
            const rarity = selectRarity();
            const card = await selectCard(rarity);
            if (card) {
                pulls.push(card);
                
                // Add to inventory
                await db.query(
                    `INSERT INTO user_inventory (user_id, card_id, quantity)
                     VALUES ($1, $2, 1)
                     ON CONFLICT (user_id, card_id) 
                     DO UPDATE SET quantity = user_inventory.quantity + 1`,
                    [userId, card.id]
                );
                
                // Record gacha history
                await db.query(
                    `INSERT INTO gacha_history (user_id, card_id, crystals_spent, pull_type)
                     VALUES ($1, $2, $3, 'multi10')`,
                    [userId, card.id, GACHA_COST]
                );
            }
        }
        
        // Deduct crystals
        await db.query(
            'UPDATE users SET crystals = crystals - $1 WHERE id = $2',
            [totalCost, userId]
        );
        
        // Record transaction
        await db.query(
            `INSERT INTO transactions (user_id, type, amount, description)
             VALUES ($1, 'gacha', $2, $3)`,
            [userId, -totalCost, `10x pull - Got ${pulls.length} cards`]
        );
        
        // Get updated crystal count
        const updatedUser = await db.query(
            'SELECT crystals FROM users WHERE id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            pulls: pulls,
            summary: {
                total: pulls.length,
                crystalsSpent: totalCost,
                remainingCrystals: updatedUser.rows[0].crystals,
                byRarity: pulls.reduce((acc, card) => {
                    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
                    return acc;
                }, {})
            }
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/gacha/history/:userId - Get pull history (VULNERABLE: can see anyone's history)
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const result = await db.query(
            `SELECT gh.id, gh.crystals_spent, gh.pull_type, gh.created_at,
                    c.name, c.rarity, c.color_primary, c.color_glow
             FROM gacha_history gh
             JOIN cards c ON gh.card_id = c.id
             WHERE gh.user_id = $1
             ORDER BY gh.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/gacha/rates - Get current drop rates
router.get('/rates', (req, res) => {
    res.json({
        cost: {
            single: GACHA_COST,
            multi10: Math.floor(GACHA_COST * 10 * MULTI_DISCOUNT)
        },
        rates: RARITY_WEIGHTS
    });
});

// GET /api/gacha/banners - Get active banners
router.get('/banners', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT b.*, c.name as featured_card_name, c.rarity as featured_card_rarity,
                    c.color_primary, c.color_glow
             FROM banners b
             LEFT JOIN cards c ON b.featured_card_id = c.id
             WHERE b.is_active = true 
             AND b.start_date <= NOW() 
             AND b.end_date >= NOW()
             ORDER BY b.end_date`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
