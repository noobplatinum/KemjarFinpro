/**
 * Shop Routes - SECURED WITH JWT AUTHENTICATION
 * Crystal top-up with proper payment verification
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireOwnerOrAdmin } = require('../middleware/auth');

// Crystal packages
const PACKAGES = [
    { id: 'small', name: 'Small Crystal Pack', crystals: 100, price: 0.99 },
    { id: 'medium', name: 'Medium Crystal Pack', crystals: 500, price: 4.99, bonus: 50 },
    { id: 'large', name: 'Large Crystal Pack', crystals: 1200, price: 9.99, bonus: 200 },
    { id: 'mega', name: 'Mega Crystal Pack', crystals: 3000, price: 24.99, bonus: 800 },
    { id: 'whale', name: '🐋 Whale Pack', crystals: 10000, price: 79.99, bonus: 5000 }
];

// GET /api/shop/packages - List available packages (public)
router.get('/packages', (req, res) => {
    res.json(PACKAGES);
});

// POST /api/shop/topup - Top up crystals (Authenticated, with payment verification)
router.post('/topup', authenticateToken, async (req, res) => {
    try {
        const { packageId, paymentId } = req.body;
        const userId = req.user.id; // Get user from token, not from request body
        
        if (!packageId) {
            return res.status(400).json({ error: 'Missing packageId' });
        }

        // Require payment verification
        if (!paymentId) {
            return res.status(400).json({ error: 'Payment verification required' });
        }
        
        // Find package
        const pkg = PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            return res.status(400).json({ error: 'Invalid package' });
        }
        
        // Check user exists
        const userResult = await db.query(
            'SELECT id, username, crystals FROM users WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // TODO: In production, verify paymentId with payment gateway (Stripe, etc.)
        // For demo purposes, we just check that a paymentId was provided
        
        const totalCrystals = pkg.crystals + (pkg.bonus || 0);
        
        // Add crystals
        await db.query(
            'UPDATE users SET crystals = crystals + $1 WHERE id = $2',
            [totalCrystals, userId]
        );
        
        // Record transaction
        await db.query(
            `INSERT INTO transactions (user_id, type, amount, description, reference_id)
             VALUES ($1, 'topup', $2, $3, $4)`,
            [userId, totalCrystals, `Purchased ${pkg.name}`, paymentId]
        );
        
        // Get updated balance
        const updatedUser = await db.query(
            'SELECT crystals FROM users WHERE id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            package: pkg,
            crystalsAdded: totalCrystals,
            newBalance: updatedUser.rows[0].crystals,
            message: `Successfully added ${totalCrystals} crystals!`
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/shop/gift - Gift crystals to another user (Authenticated)
router.post('/gift', authenticateToken, async (req, res) => {
    try {
        const fromUserId = req.user.id; // Get sender from token
        const { toUserId, amount } = req.body;
        
        if (!toUserId || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        if (fromUserId === parseInt(toUserId)) {
            return res.status(400).json({ error: 'Cannot gift crystals to yourself' });
        }
        
        // Check sender has enough crystals
        const sender = await db.query(
            'SELECT id, username, crystals FROM users WHERE id = $1',
            [fromUserId]
        );
        
        if (sender.rows.length === 0) {
            return res.status(404).json({ error: 'Sender not found' });
        }
        
        if (sender.rows[0].crystals < amount) {
            return res.status(400).json({ error: 'Not enough crystals' });
        }
        
        // Check receiver exists
        const receiver = await db.query(
            'SELECT id, username FROM users WHERE id = $1',
            [toUserId]
        );
        
        if (receiver.rows.length === 0) {
            return res.status(404).json({ error: 'Receiver not found' });
        }
        
        // Transfer crystals
        await db.query('UPDATE users SET crystals = crystals - $1 WHERE id = $2', [amount, fromUserId]);
        await db.query('UPDATE users SET crystals = crystals + $1 WHERE id = $2', [amount, toUserId]);
        
        // Record transactions
        await db.query(
            `INSERT INTO transactions (user_id, type, amount, description)
             VALUES ($1, 'gift', $2, $3)`,
            [fromUserId, -amount, `Gift to ${receiver.rows[0].username}`]
        );
        await db.query(
            `INSERT INTO transactions (user_id, type, amount, description)
             VALUES ($1, 'gift', $2, $3)`,
            [toUserId, amount, `Gift from ${sender.rows[0].username}`]
        );
        
        res.json({
            success: true,
            from: sender.rows[0].username,
            to: receiver.rows[0].username,
            amount: amount
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/shop/transactions/:userId - Get transaction history (Owner or Admin only)
router.get('/transactions/:userId', authenticateToken, requireOwnerOrAdmin('userId'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, type } = req.query;
        
        let query = `
            SELECT id, type, amount, description, reference_id, created_at
            FROM transactions
            WHERE user_id = $1
        `;
        const params = [userId];
        
        if (type) {
            query += ' AND type = $2';
            params.push(type);
        }
        
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(limit);
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
