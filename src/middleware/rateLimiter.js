const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../utils/logger');

// Create a standard rate limiter for API routes
const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for ${req.ip} on ${req.originalUrl}`);
        res.status(options.statusCode).json(options.message);
    }
});

// Create a stricter rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: 'Too many login attempts, please try again later.'
    },
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded for ${req.ip} on ${req.originalUrl}`, {
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    apiLimiter,
    authLimiter
}; 