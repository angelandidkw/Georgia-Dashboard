// Georgia State Roleplay - Coming Soon server
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Load config and utilities
const config = require('./src/config/config');
const logger = require('./src/utils/logger');

// Load middleware
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const maintenanceMode = require('./src/middleware/maintenance');
const securityHeaders = require('./src/middleware/securityHeaders');

// Load routes
const authRoutes = require('./src/routes/auth');
const apiRoutes = require('./src/routes/api');
const imageRoutes = require('./src/routes/images');

// Initialize Express
const app = express();
const PORT = config.server.port;
const SSL_PORT = config.server.sslPort || 443;

// Trust proxy (needed when behind Nginx)
app.set('trust proxy', 1);

// Apply security headers with custom configuration
securityHeaders(app);

// HTTPS redirect middleware - prevent redirect loops
app.use((req, res, next) => {
    // Skip redirect if already on HTTPS or in development environment
    if (config.server.env !== 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }
    
    // Redirect to HTTPS with 301 status code to avoid loops
    // Keep the original URL path when redirecting
    const redirectUrl = `https://${req.headers.host}${req.url}`;
    console.log(`HTTPS Redirect: ${req.method} ${req.originalUrl} -> ${redirectUrl}`);
    return res.redirect(301, redirectUrl);
});

// Debug middleware to identify redirect loops
app.use((req, res, next) => {
    const originalRedirect = res.redirect;
    res.redirect = function(url) {
        console.log(`REDIRECT: ${req.method} ${req.originalUrl} -> ${url}`);
        return originalRedirect.call(this, url);
    };
    console.log(`REQUEST: ${req.method} ${req.originalUrl} (Protocol: ${req.protocol}) (Secure: ${req.secure}) (X-Forwarded-Proto: ${req.headers['x-forwarded-proto'] || 'none'}) (Referrer: ${req.headers.referer || 'none'})`);
    next();
});

// CORS configuration
app.use(cors({
    origin: config.server.env === 'production' ? 'https://gssrp.xyz' : true,
    credentials: true
}));

// Request body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: config.server.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: config.cookie.maxAge,
        secure: config.server.env === 'production',
        sameSite: 'lax',
        proxy: true
    }
}));

// Static files
app.use(express.static(path.join(__dirname, config.paths.public)));

// Maintenance mode
// Comment out temporarily to isolate redirect issues
// app.use(maintenanceMode);

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/images', imageRoutes);

// Add a simple test route
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// Welcome route
app.get('/welcome', (req, res) => {
    // Temporarily disable session check to test for redirects
    // if (!req.session.user) {
    //     logger.warn('Unauthorized access attempt to welcome page', { ip: req.ip });
    //     return res.redirect('/');
    // }
    res.sendFile(path.join(__dirname, config.paths.public, 'welcome.html'));
});

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.public, 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// SSL options
let sslOptions;
try {
    sslOptions = {
        key: fs.readFileSync(path.join(__dirname, 'ssl/private.key')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl/certificate.pem'))
    };
    logger.info('SSL certificates loaded successfully');
} catch (err) {
    logger.error(`Failed to load SSL certificates: ${err.message}`);
    sslOptions = null;
}

// Start servers
if (config.server.env === 'production' && sslOptions) {
    // Create both HTTP and HTTPS servers
    http.createServer(app).listen(PORT, () => {
        logger.info(`HTTP server running on port ${PORT} (redirecting to HTTPS)`);
    });
    
    https.createServer(sslOptions, app).listen(SSL_PORT, () => {
        logger.info(`HTTPS server running in ${config.server.env} mode on port ${SSL_PORT}`);
        logger.info(`Visit https://gssrp.xyz to view the site`);
    });
} else {
    // Development mode or no SSL certificates - just use HTTP
    app.listen(PORT, () => {
        logger.info(`Server running in ${config.server.env} mode on port ${PORT}`);
        logger.info(`Visit http://localhost:${PORT} to view the site`);
    });
} 