const express = require('express');
const router = express.Router();
const path = require('path');
const { logger } = require('../utils/logger');
const config = require('../config/config');
const bot = require('../bot');
const crypto = require('crypto');

// Constants
const ADMIN_ROLE_ID = '1337581518364868719';

// Store blocked IPs
const blockedIPs = new Set();

// Generate a unique token for the admin session
const generateAdminToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Verify admin token middleware
const verifyAdminToken = (req, res, next) => {
    // Check for valid admin token in session
    if (!req.session.adminToken) {
        logger.warn('Admin access attempted without admin token', { ip: req.ip });
        return res.status(403).send('Access denied');
    }
    next();
};

// IP blocking middleware
const checkBlockedIP = (req, res, next) => {
    if (blockedIPs.has(req.ip)) {
        logger.warn('Blocked IP attempted to access admin panel', { ip: req.ip });
        return res.status(403).send('Your IP address has been blocked from accessing this resource');
    }
    next();
};

// Admin role check middleware - enhanced security
const requireAdminRole = async (req, res, next) => {
    // Check if IP is blocked
    if (blockedIPs.has(req.ip)) {
        logger.warn('Blocked IP attempted to access admin panel', { ip: req.ip });
        return res.status(403).send('Your IP address has been blocked from accessing this resource');
    }

    // Check for suspicious activity - multiple failed attempts
    if (req.session.failedAdminAttempts && req.session.failedAdminAttempts > 5) {
        logger.warn('Too many failed admin access attempts - blocking IP', { 
            ip: req.ip, 
            attempts: req.session.failedAdminAttempts 
        });
        
        // Block IP after too many attempts
        blockedIPs.add(req.ip);
        return res.status(403).send('Too many failed attempts. Your IP address has been blocked.');
    }

    // First check if user is authenticated
    if (!req.session.user) {
        // Increment failed attempts counter
        req.session.failedAdminAttempts = (req.session.failedAdminAttempts || 0) + 1;
        
        logger.warn('Unauthorized access attempt to admin panel', { 
            ip: req.ip,
            failedAttempts: req.session.failedAdminAttempts
        });
        
        return res.redirect('/auth/discord');
    }

    // NOTE: Development bypass has been REMOVED for security reasons
    // All environments now require proper authentication

    try {
        // Check if bot is ready
        if (!bot.client || !bot.client.isReady()) {
            logger.warn('Admin access attempted but bot is not ready', { 
                userId: req.session.user.id,
                ip: req.ip
            });
            return res.status(503).send('Bot service unavailable. Please try again later.');
        }

        // Get user from Discord
        const userInfo = await bot.getUserInfo(req.session.user.id);
        
        if (!userInfo) {
            // Increment failed attempts counter
            req.session.failedAdminAttempts = (req.session.failedAdminAttempts || 0) + 1;
            
            logger.warn('Failed to get user info for admin check', { 
                userId: req.session.user.id, 
                ip: req.ip,
                failedAttempts: req.session.failedAdminAttempts
            });
            
            return res.status(403).send('Access forbidden - Could not verify roles. Please try again later.');
        }
        
        // Check if user has the admin role
        const hasAdminRole = userInfo.roles.some(role => role.id === ADMIN_ROLE_ID);
        
        // TEMPORARY FOR TESTING: Remove this bypass for security
        // const bypassRoleCheck = process.env.BYPASS_ADMIN_ROLE_CHECK === 'true';
        const bypassRoleCheck = false;
        
        if (!hasAdminRole && !bypassRoleCheck) {
            // Increment failed attempts counter
            req.session.failedAdminAttempts = (req.session.failedAdminAttempts || 0) + 1;
            
            logger.warn('Non-admin user attempted to access admin panel', { 
                userId: req.session.user.id,
                username: req.session.user.username,
                ip: req.ip,
                roles: userInfo.roles.map(r => r.id),
                failedAttempts: req.session.failedAdminAttempts
            });
            
            return res.status(403).send(`
                <html>
                <head>
                    <title>Access Forbidden</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
                        h1 { color: #f44336; }
                        .error-details { background: #f8f8f8; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
                        .back-link { display: inline-block; margin-top: 1rem; color: #2196f3; text-decoration: none; }
                        .back-link:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>Access Forbidden</h1>
                    <p>You don't have the required permissions to access the admin panel.</p>
                    <div class="error-details">
                        <p><strong>Required role ID:</strong> ${ADMIN_ROLE_ID}</p>
                        <p><strong>Your roles:</strong> ${userInfo.roles.map(r => r.name).join(', ') || 'None'}</p>
                    </div>
                    <p>Please contact an administrator if you believe you should have access.</p>
                    <a href="/" class="back-link">← Back to Home</a>
                </body>
                </html>
            `);
        }
        
        // User has admin role, proceed
        logger.info('Admin panel accessed by admin user', { 
            userId: req.session.user.id,
            username: req.session.user.username,
            ip: req.ip
        });
        
        // Set admin token in session for subsequent requests
        req.session.adminToken = generateAdminToken();
        req.session.adminLastVerified = Date.now();
        req.session.failedAdminAttempts = 0; // Reset failed attempts
        
        next();
    } catch (error) {
        // Increment failed attempts counter
        req.session.failedAdminAttempts = (req.session.failedAdminAttempts || 0) + 1;
        
        logger.error('Error in admin role verification', { 
            error: error.message,
            stack: error.stack,
            userId: req.session.user ? req.session.user.id : 'unknown',
            ip: req.ip,
            failedAttempts: req.session.failedAdminAttempts
        });
        
        return res.status(500).send(`
            <html>
            <head>
                <title>Server Error</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
                    h1 { color: #f44336; }
                    .error-details { background: #f8f8f8; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
                    .back-link { display: inline-block; margin-top: 1rem; color: #2196f3; text-decoration: none; }
                    .back-link:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <h1>Server Error</h1>
                <p>An error occurred while checking admin permissions.</p>
                <div class="error-details">
                    <p><strong>Error:</strong> ${error.message}</p>
                </div>
                <p>Please try again later or contact support if the issue persists.</p>
                <a href="/" class="back-link">← Back to Home</a>
            </body>
            </html>
        `);
    }
};

// Token expiration middleware - ensure admin token is still valid and not expired
const checkTokenExpiration = (req, res, next) => {
    const tokenAge = Date.now() - (req.session.adminLastVerified || 0);
    const tokenMaxAge = 30 * 60 * 1000; // 30 minutes
    
    if (tokenAge > tokenMaxAge) {
        logger.info('Admin token expired, requiring re-authentication', { 
            userId: req.session.user ? req.session.user.id : 'unknown',
            ip: req.ip,
            tokenAge: Math.floor(tokenAge / 1000) + 's'
        });
        
        // Clear admin token
        delete req.session.adminToken;
        delete req.session.adminLastVerified;
        
        return res.redirect('/admin/login');
    }
    
    // Update last verified time
    req.session.adminLastVerified = Date.now();
    next();
};

// Apply security checks to all routes
router.use(checkBlockedIP);

// Admin login route (initial auth happens here)
router.get('/login', (req, res) => {
    if (!req.session.user) {
        // User not logged in at all, redirect to Discord auth
        logger.info('Admin login attempted without user session, redirecting to Discord auth', {
            ip: req.ip
        });
        return res.redirect('/auth/discord');
    }
    
    // User is logged in but may not have admin role - forward to full admin auth check
    res.redirect(302, '/admin/authorize');
});

// Full admin authorization check
router.get('/authorize', requireAdminRole, (req, res) => {
    // If we reach here, the user has passed the admin role check
    res.redirect('/admin');
});

// Apply token verification to all other admin routes
router.use(verifyAdminToken);
router.use(checkTokenExpiration);

// Store sessions for display in admin panel
const activeSessions = new Map();

// Track login sessions
router.use((req, res, next) => {
    if (req.session.user) {
        // Store session with timestamp and IP
        activeSessions.set(req.session.id, {
            userId: req.session.user.id,
            username: req.session.user.username,
            discriminator: req.session.user.discriminator,
            ip: req.ip,
            bot: !!req.session.user.bot,
            lastActive: new Date(),
            loggedInAt: req.session.loggedInAt || new Date()
        });
    }
    next();
});

// Admin panel home
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin/index.html'));
});

// API to get active sessions
router.get('/api/sessions', (req, res) => {
    try {
        // Convert Map to array and filter out sessions older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filteredSessions = Array.from(activeSessions.entries())
            .filter(([id, session]) => session.lastActive > twentyFourHoursAgo)
            .map(([id, session]) => ({
                sessionId: id,
                userId: session.userId,
                username: session.username,
                discriminator: session.discriminator,
                isBot: session.bot,
                ip: session.ip,
                lastActive: session.lastActive,
                loggedInAt: session.loggedInAt
            }));
        
        res.json({
            success: true,
            sessions: filteredSessions
        });
    } catch (error) {
        logger.error('Error retrieving sessions for admin panel', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve session data'
        });
    }
});

// API to block an IP address
router.post('/api/block-ip', (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }
        
        // Block the IP
        blockedIPs.add(ip);
        
        logger.info(`IP address blocked by admin`, {
            adminUser: req.session.user.id,
            blockedIp: ip
        });
        
        res.json({
            success: true,
            message: `IP address ${ip} has been blocked`
        });
    } catch (error) {
        logger.error('Error blocking IP address', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to block IP address'
        });
    }
});

// API to unblock an IP address
router.post('/api/unblock-ip', (req, res) => {
    try {
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }
        
        // Unblock the IP
        blockedIPs.delete(ip);
        
        logger.info(`IP address unblocked by admin`, {
            adminUser: req.session.user.id,
            unblockedIp: ip
        });
        
        res.json({
            success: true,
            message: `IP address ${ip} has been unblocked`
        });
    } catch (error) {
        logger.error('Error unblocking IP address', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to unblock IP address'
        });
    }
});

// API to get blocked IPs
router.get('/api/blocked-ips', (req, res) => {
    try {
        res.json({
            success: true,
            blockedIPs: Array.from(blockedIPs)
        });
    } catch (error) {
        logger.error('Error retrieving blocked IPs', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve blocked IPs'
        });
    }
});

// Clean up expired sessions
const cleanupExpiredSessions = () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let count = 0;
    
    activeSessions.forEach((session, id) => {
        if (session.lastActive < twentyFourHoursAgo) {
            activeSessions.delete(id);
            count++;
        }
    });
    
    if (count > 0) {
        logger.info(`Cleaned up ${count} expired sessions`);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Export the router and security functions properly
module.exports = {
    router,
    isIPBlocked: (ip) => blockedIPs.has(ip),
    blockIP: (ip) => blockedIPs.add(ip),
    unblockIP: (ip) => blockedIPs.delete(ip)
}; 