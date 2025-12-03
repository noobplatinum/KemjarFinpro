/**
 * Authentication Middleware
 * JWT-based authentication for API protection
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'crystal-gacha-super-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied',
            message: 'No authentication token provided'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired',
                    message: 'Please login again'
                });
            }
            return res.status(403).json({ 
                error: 'Invalid token',
                message: 'Authentication failed'
            });
        }
        
        req.user = decoded;
        next();
    });
};

/**
 * Middleware to check if user is admin (vip_level >= 99)
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Access denied',
            message: 'Authentication required'
        });
    }

    if (req.user.vip_level < 99 && req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }

    next();
};

/**
 * Middleware to check if user owns the resource
 */
const requireOwner = (paramName = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        const resourceUserId = parseInt(req.params[paramName]);
        const isOwner = req.user.id === resourceUserId;

        if (!isOwner) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You can only access your own resources'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const requireOwnerOrAdmin = (paramName = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        const resourceUserId = parseInt(req.params[paramName]);
        const isOwner = req.user.id === resourceUserId;
        const isAdmin = req.user.vip_level >= 99 || req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                error: 'Forbidden',
                message: 'You can only access your own resources'
            });
        }

        next();
    };
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            email: user.email,
            vip_level: user.vip_level || 0,
            role: user.role || 'user'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireOwner,
    requireOwnerOrAdmin,
    generateToken,
    JWT_SECRET
};
