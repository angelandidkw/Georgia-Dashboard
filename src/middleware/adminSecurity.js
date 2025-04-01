const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Path to the admin denied page
const adminDeniedPath = path.join(__dirname, '../../public/admin-denied.html');

/**
 * Admin security middleware to prevent unauthorized access to admin resources
 * This should be applied at the express app level before static file serving
 */
const adminSecurity = (req, res, next) => {
    // Check if request is for admin files or routes
    if (req.path.startsWith('/admin')) {
        // Allow direct access to login endpoint
        if (req.path === '/admin/login' || req.path === '/admin/authorize') {
            return next();
        }
        
        // If no admin token, block access
        if (!req.session.adminToken) {
            logger.warn('Blocked direct access to admin resources', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.headers['user-agent'],
                session: req.session.id || 'no-session'
            });
            
            // For API requests, return JSON error
            if (req.path.startsWith('/admin/api/')) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }
            
            // For direct file or route access (including /admin/ root), 
            // serve the access denied page instead of redirecting
            try {
                if (fs.existsSync(adminDeniedPath)) {
                    return res.status(403).sendFile(adminDeniedPath);
                } else {
                    // Fallback if file doesn't exist
                    return res.status(403).send('Access to admin panel is restricted to authorized personnel.');
                }
            } catch (error) {
                logger.error('Error serving admin-denied page', { error });
                return res.status(403).send('Access denied');
            }
        }
    }
    
    next();
};

module.exports = adminSecurity;
