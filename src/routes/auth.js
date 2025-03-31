const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const config = require('../config/config');
const logger = require('../utils/logger');
const { authLimiter } = require('../middleware/rateLimiter');

// Discord authorization URL
function getDiscordAuthURL() {
    const redirectUri = config.discord.redirectUri;
    logger.debug('Using Discord redirect URI:', { redirectUri });
    
    return `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
}

// Initialize auth routes with rate limiting
router.use(authLimiter);

// Start Discord OAuth flow
router.get('/discord', (req, res) => {
    logger.info('Starting Discord auth flow', { 
        ip: req.ip,
        redirectUri: config.discord.redirectUri,
        env: config.server.env
    });
    
    // Store the current URL in session for redirect after auth
    req.session.returnTo = req.query.returnTo || '/';
    
    res.redirect(getDiscordAuthURL());
});

// Handle Discord OAuth callback
router.get('/discord/callback', async (req, res) => {
    const { code, error } = req.query;
    
    // Log the full query parameters for debugging
    logger.debug('Discord callback received', { 
        query: req.query,
        ip: req.ip
    });
    
    if (error) {
        logger.error('Discord auth failed: Error from Discord', { 
            error,
            ip: req.ip
        });
        return res.redirect('/auth-error.html?error=discord_error');
    }
    
    if (!code) {
        logger.warn('Discord auth failed: Missing code', { 
            query: req.query,
            ip: req.ip
        });
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
        
        // Redirect to the stored return URL or welcome page
        const returnTo = req.session.returnTo || '/welcome';
        delete req.session.returnTo; // Clean up
        res.redirect(returnTo);
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
