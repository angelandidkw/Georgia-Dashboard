const express = require('express');
const router = express.Router();
const path = require('path');
const { logger } = require('../utils/logger');
const config = require('../config/config');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        logger.info('Unauthenticated user attempted to access community page', {
            path: req.path,
            ip: req.ip
        });
        return res.redirect(`/auth/discord?returnTo=/panels/community${req.path}`);
    }
    next();
};

// Apply authentication middleware to all community routes
router.use(isAuthenticated);

// Community News Page (Index)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/news.html'));
});

// Explicit route for news.html to handle direct access
router.get('/news.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/news.html'));
});

// Serve news.html directly to handle path with file extension
router.get('/:directory/news.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/news.html'));
});

// Route for 'news' without the .html extension
router.get('/news', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/news.html'));
});

// Community Events Page
router.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/events.html'));
});

// Community Discussions Page
router.get('/discussions', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/discussions.html'));
});

// Community Help Center Page
router.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/panels/community/help.html'));
});

// Error handling for community routes
router.use((err, req, res, next) => {
    logger.error('Error in community route:', {
        error: err.message,
        path: req.path,
        ip: req.ip
    });
    res.status(500).sendFile(path.join(__dirname, '../../public/error.html'));
});

module.exports = router; 