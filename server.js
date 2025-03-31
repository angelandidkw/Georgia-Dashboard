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

// Remove the redirect middleware entirely - let your hosting provider handle HTTPS redirects
// Instead, just log the protocol info for debugging
app.use((req, res, next) => {
    logger.debug(`Request received: ${req.method} ${req.originalUrl}`);
    logger.debug(`Protocol: ${req.protocol}, Secure: ${req.secure}, X-Forwarded-Proto: ${req.headers['x-forwarded-proto'] || 'none'}`);
    next();
});

// Debug middleware to identify redirects
app.use((req, res, next) => {
    const originalRedirect = res.redirect;
    res.redirect = function(url) {
        logger.debug(`REDIRECT: ${req.method} ${req.originalUrl} -> ${url}`);
        return originalRedirect.call(this, url);
    };
    next();
});

// CORS configuration
app.use(cors({
    origin: config.server.env === 'production' ? ['https://gssrp.xyz', 'http://gssrp.xyz'] : true,
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
        // Don't force secure cookies to avoid issues
        secure: false,
        sameSite: 'lax',
        proxy: true
    }
}));

// Static files - with caching headers for better performance
app.use(express.static(path.join(__dirname, config.paths.public), {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // Don't cache HTML files
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(css|js|jpg|png|gif|svg|ico)$/)) {
            // Cache static assets for 1 day
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

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
        logger.info(`HTTP server running on port ${PORT}`);
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