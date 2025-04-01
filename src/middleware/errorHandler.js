const { logger } = require('../utils/logger');

// Not Found middleware - 404 errors
function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
}

// Generic error handler middleware
function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;
    
    // Log the error
    if (statusCode === 500) {
        logger.error(`Server Error: ${err.message}`, { 
            error: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    } else {
        logger.warn(`${statusCode} - ${err.message}`, {
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
    }
    
    // Set response
    res.status(statusCode);
    
    // API errors return JSON
    if (req.originalUrl.includes('/api/')) {
        return res.json({
            status: statusCode,
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
        });
    }
    
    // For page errors, redirect to the appropriate error page
    if (statusCode === 404) {
        return res.redirect('/404.html');
    }
    
    return res.redirect('/500.html');
}

module.exports = {
    notFound,
    errorHandler
}; 