const express = require('express');
const router = express.Router();
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

// Apply rate limiting to all API routes
router.use(apiRateLimiter);

// Authentication check middleware
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ 
            status: 401,
            message: 'Unauthorized. Please login first.' 
        });
    }
    next();
}

// Get current user data
router.get('/user', (req, res) => {
    if (req.session.user) {
        logger.debug('User data requested', { userId: req.session.user.id });
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Check server status
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Newsletter subscription (placeholder)
router.post('/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid email address'
        });
    }
    
    // In a real app, you would store this in a database
    logger.info('Newsletter subscription', { email, ip: req.ip });
    
    res.json({
        status: 'success',
        message: 'Subscription successful! Thank you for subscribing.'
    });
});

// Protected user profile route (requires login)
router.get('/profile', isAuthenticated, (req, res) => {
    const user = req.session.user;
    
    // Calculate avatar URL
    let avatarUrl = '/images/default-avatar.png';
    if (user.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    }
    
    res.json({
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatarUrl: avatarUrl,
        email: user.email,
        locale: user.locale,
        joinedAt: new Date().toISOString() // Placeholder
    });
});

module.exports = router; 