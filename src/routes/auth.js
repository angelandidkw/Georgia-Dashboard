const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const config = require('../config/config');
const logger = require('../utils/logger');
const { authLimiter } = require('../middleware/rateLimiter');

// Discord authorization URL
function getDiscordAuthURL() {
    return `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${encodeURIComponent(config.discord.redirectUri)}&response_type=code&scope=identify`;
}

// Initialize auth routes with rate limiting
router.use(authLimiter);

// Start Discord OAuth flow
router.get('/discord', (req, res) => {
    logger.info('Starting Discord auth flow', { ip: req.ip });
    res.redirect(getDiscordAuthURL());
});

// Handle Discord OAuth callback
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        logger.warn('Discord auth failed: Missing code', { ip: req.ip });
        return res.redirect('/auth-error.html?error=nocode');
    }

    try {
        // Exchange code for token
        const tokenResponse = await fetch(`${config.discord.apiUrl}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: config.discord.clientId,
                client_secret: config.discord.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.discord.redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            logger.error('Discord auth failed: Token error', { 
                error: tokenData,
                ip: req.ip
            });
            return res.redirect('/auth-error.html?error=token');
        }

        // Get user data
        const userResponse = await fetch(`${config.discord.apiUrl}/users/@me`, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
            logger.error('Discord auth failed: User data error', { 
                error: userData,
                ip: req.ip
            });
            return res.redirect('/auth-error.html?error=user');
        }

        // Store user and token in session
        req.session.user = userData;
        req.session.discord = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenType: tokenData.token_type,
            expiresAt: Date.now() + tokenData.expires_in * 1000
        };
        
        logger.info('User authenticated successfully', { 
            userId: userData.id,
            username: userData.username,
            ip: req.ip
        });
        
        // Redirect to welcome page
        res.redirect('/welcome');
    } catch (error) {
        logger.error('Discord auth failed: Unexpected error', { 
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        res.redirect('/auth-error.html?error=general');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    if (req.session.user) {
        logger.info('User logged out', { 
            userId: req.session.user.id,
            username: req.session.user.username,
            ip: req.ip
        });
    }
    
    req.session.destroy();
    res.redirect('/');
});

module.exports = router; 
