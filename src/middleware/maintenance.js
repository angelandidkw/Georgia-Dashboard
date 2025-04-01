const config = require('../config/config');
const { logger } = require('../utils/logger');

// Middleware to enable maintenance mode
function maintenanceMode(req, res, next) {
    // Skip middleware if maintenance mode is disabled
    if (!config.maintenance.enabled) {
        return next();
    }
    
    // Skip for static assets to ensure maintenance page loads correctly
    if (req.path.startsWith('/images/') || 
        req.path.endsWith('.css') || 
        req.path.endsWith('.js') || 
        req.path === '/favicon.ico') {
        return next();
    }
    
    // Log maintenance mode access attempt
    logger.info(`Maintenance mode: Redirecting ${req.ip} from ${req.originalUrl}`);
    
    // Set variables for the maintenance page
    let maintenanceEndTime = '';
    
    if (config.maintenance.endTime) {
        maintenanceEndTime = config.maintenance.endTime;
    }
    
    // For API requests, return JSON
    if (req.path.startsWith('/api/')) {
        return res.status(503).json({
            status: 503,
            message: 'Service Unavailable - Maintenance in progress',
            estimatedCompletionTime: maintenanceEndTime
        });
    }
    
    // For other requests, redirect to maintenance page
    return res.redirect(`/maintenance.html${maintenanceEndTime ? `?completion=${encodeURIComponent(maintenanceEndTime)}` : ''}`);
}

module.exports = maintenanceMode; 