const express = require('express');
const router = express.Router();
const path = require('path');
const { logger } = require('../utils/logger');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        logger.warn('Unauthorized access attempt to dashboard', { ip: req.ip });
        return res.redirect('/auth/login');
    }
    next();
};

// Apply authentication to all dashboard routes
router.use(requireAuth);

// Dashboard home route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/dashboard/index.html'));
});

// Coming soon route handler
router.get('/coming-soon', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/coming-soon.html'));
});

// API endpoints for dashboard functionality
router.get('/api/stats', (req, res) => {
    try {
        // TODO: Implement actual stats gathering
        res.json({
            status: 'success',
            data: {
                totalUsers: 0,
                activeUsers: 0,
                serverStatus: 'offline'
            }
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

module.exports = router; 