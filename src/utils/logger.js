const winston = require('winston');
const path = require('path');
const config = require('../config/config');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), config.paths.logs);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]: ${message}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: config.server.env === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console(),
        // File transport for errors
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
            filename: path.join(config.paths.logs, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// HTTP request logger
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

// Add request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
};

module.exports = {
    logger,
    requestLogger
}; 