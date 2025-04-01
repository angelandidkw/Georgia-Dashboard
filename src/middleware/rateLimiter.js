const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../utils/logger').logger;

// Create rate limiter middleware
const rateLimiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    standardHeaders: config.security.rateLimit.standardHeaders,
    legacyHeaders: config.security.rateLimit.legacyHeaders,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
        });
    }
});

// Create a more strict rate limiter for authentication endpoints
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many login attempts, please try again later.',
            retryAfter: 900 // 15 minutes in seconds
        });
    }
});

// Create a rate limiter for API endpoints
const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many API requests, please try again later.',
            retryAfter: 60 // 1 minute in seconds
        });
    }
});

module.exports = {
    rateLimiter,
    authRateLimiter,
    apiRateLimiter
}; 