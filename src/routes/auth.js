const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const config = require('../config/config');
const { logger } = require('../utils/logger');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Discord authorization URL
function getDiscordAuthURL() {
    const redirectUri = config.discord.redirectUri;
    logger.debug('Using Discord redirect URI:', { redirectUri });
    
    // Add state parameter for security
    const state = Math.random().toString(36).substring(7);
    
    // Add prompt=consent to force the authorization screen
    return `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify&state=${state}&prompt=consent`;
}

// Initialize auth routes with rate limiting
router.use(authRateLimiter);

// Start Discord OAuth flow
router.get('/discord', (req, res) => {
    logger.info('Starting Discord auth flow', { 
        ip: req.ip,
        redirectUri: config.discord.redirectUri,
        env: config.server.env,
        sessionId: req.session.id,
        headers: req.headers
    });
    
    // Ensure session is saved before redirect
    req.session.save((err) => {
        if (err) {
            logger.error('Session save error:', { error: err });
        }
        
        // Store the current URL in session for redirect after auth
        req.session.returnTo = req.query.returnTo || '/welcome';
        req.session.authState = Math.random().toString(36).substring(7);
        
        // Force session save again with new data
        req.session.save((err) => {
            if (err) {
                logger.error('Session save error after state:', { error: err });
            }
            
            // Redirect to Discord
            res.redirect(getDiscordAuthURL());
        });
    });
});

// Handle Discord OAuth callback
router.get('/discord/callback', async (req, res) => {
    const { code, error, error_description, state } = req.query;
    
    // Log the full query parameters and request details for debugging
    logger.debug('Discord callback received', { 
        query: req.query,
        ip: req.ip,
        sessionId: req.session.id,
        headers: req.headers,
        url: req.originalUrl
    });
    
    if (error) {
        logger.error('Discord auth failed: Error from Discord', { 
            error,
            error_description,
            ip: req.ip,
            sessionId: req.session.id
        });

        // Handle specific Discord OAuth errors
        switch(error) {
            case 'access_denied':
                return res.redirect('/auth-error.html?error=access_denied');
            case 'invalid_scope':
                return res.redirect('/auth-error.html?error=invalid_scope');
            case 'invalid_request':
                return res.redirect('/auth-error.html?error=invalid_request');
            case 'server_error':
                return res.redirect('/auth-error.html?error=server_error');
            case 'temporarily_unavailable':
                return res.redirect('/auth-error.html?error=temporarily_unavailable');
            default:
                return res.redirect('/auth-error.html?error=discord_error');
        }
    }
    
    if (!code) {
        logger.warn('Discord auth failed: Missing code', { 
            query: req.query,
            ip: req.ip,
            sessionId: req.session.id,
            headers: req.headers,
            url: req.originalUrl
        });
        
        // Check if this is a direct callback without authorization
        if (!req.query.state) {
            logger.info('Direct callback detected - redirecting to auth start', {
                ip: req.ip,
                sessionId: req.session.id
            });
            return res.redirect('/auth/discord');
        }
        
        return res.redirect('/auth-error.html?error=nocode');
    }

    try {
        logger.debug('Attempting to exchange code for token', {
            redirectUri: config.discord.redirectUri,
            apiUrl: config.discord.apiUrl
        });
        
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

        // Check if the response is OK before trying to parse JSON
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            logger.error('Discord auth failed: Token error', { 
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                errorText,
                ip: req.ip,
                sessionId: req.session.id
            });
            return res.redirect('/auth-error.html?error=token');
        }

        const tokenData = await tokenResponse.json();
        
        // Get user data
        const userResponse = await fetch(`${config.discord.apiUrl}/users/@me`, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        // Check if the user response is OK before trying to parse JSON
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            logger.error('Discord auth failed: User data error', { 
                status: userResponse.status,
                statusText: userResponse.statusText,
                errorText,
                ip: req.ip,
                sessionId: req.session.id
            });
            return res.redirect('/auth-error.html?error=user');
        }

        const userData = await userResponse.json();
        
        // Store user and token in session
        req.session.user = userData;
        req.session.discord = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenType: tokenData.token_type,
            expiresAt: Date.now() + tokenData.expires_in * 1000
        };
        req.session.loggedInAt = new Date();
        
        // Ensure session is saved before redirect
        req.session.save((err) => {
            if (err) {
                logger.error('Session save error before redirect:', { error: err });
                return res.redirect('/auth-error.html?error=session');
            }
            
            logger.info('User authenticated successfully', { 
                userId: userData.id,
                username: userData.username,
                ip: req.ip,
                sessionId: req.session.id
            });

            // Force session save and wait for it to complete
            req.session.save((err) => {
                if (err) {
                    logger.error('Final session save error:', { error: err });
                    return res.redirect('/auth-error.html?error=session');
                }
                
                // Redirect to welcome page with cache control headers
                res.set({
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                
                // Redirect to the returnTo URL if it exists, otherwise to welcome page
                const returnTo = req.session.returnTo || '/welcome';
                logger.info('Redirecting user after authentication', { 
                    returnTo,
                    userId: userData.id,
                    sessionId: req.session.id,
                    hasSession: !!req.session,
                    returnToSource: req.session.returnTo ? 'session' : 'default'
                });
                res.redirect(returnTo);
            });
        });
    } catch (error) {
        logger.error('Discord auth failed: Unexpected error', { 
            error: error.message,
            stack: error.stack,
            code: error.code,
            type: error.constructor.name,
            ip: req.ip,
            sessionId: req.session.id,
            clientId: config.discord.clientId,
            redirectUri: config.discord.redirectUri
        });
        
        // Try to determine if it's a network error or configuration issue
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.redirect('/auth-error.html?error=network');
        }
        
        res.redirect('/auth-error.html?error=general');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    if (req.session.user) {
        logger.info('User logged out', { 
            userId: req.session.user.id,
            username: req.session.user.username,
            ip: req.ip,
            sessionId: req.session.id
        });
    }
    
    req.session.destroy((err) => {
        if (err) {
            logger.error('Session destroy error:', { error: err });
        }
        res.redirect('/');
    });
});

module.exports = router; 