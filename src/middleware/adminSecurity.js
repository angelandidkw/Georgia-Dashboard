const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Path to the admin denied page
const adminDeniedPath = path.join(__dirname, '../../public/admin-denied.html');
let cachedDeniedPage = null;

// Attempt to cache the denied page content at startup
try {
    if (fs.existsSync(adminDeniedPath)) {
        cachedDeniedPage = fs.readFileSync(adminDeniedPath);
    }
} catch (error) {
    logger.error('Failed to preload admin-denied.html', { error });
}

/**
 * Admin security middleware to prevent unauthorized access to admin resources
 * This should be applied at the express app level before static file serving
 */
const adminSecurity = (req, res, next) => {
    // Check if request is for admin files or routes
    if (req.path.startsWith('/admin')) {
        const publicPaths = ['/admin/login', '/admin/authorize'];

        // Allow direct access to public admin endpoints
        if (publicPaths.includes(req.path)) {
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
            if (cachedDeniedPage) {
                res.status(403).set('Content-Type', 'text/html');
                return res.send(cachedDeniedPage);
            } else {
                return res.status(403).send('Access to admin panel is restricted to authorized personnel.');
            }
        }
    }

    next();
};

module.exports = adminSecurity;
