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
const { logger } = require('./src/utils/logger');
const { isIPBlocked } = require('./src/utils/ipBlocker');

// Load middleware
const { notFound, errorHandler } = require('./src/middleware/errorHandler');
const maintenanceMode = require('./src/middleware/maintenance');
const securityHeaders = require('./src/middleware/securityHeaders');
const adminSecurity = require('./src/middleware/adminSecurity');

// Load routes
const authRoutes = require('./src/routes/auth');
const apiRoutes = require('./src/routes/api');
const imageRoutes = require('./src/routes/images');
const dashboardRoutes = require('./src/routes/dashboard');
const admin = require('./src/routes/admin');
const communityRoutes = require('./src/routes/community');

// Load bot
const bot = require('./src/bot');

// Initialize Express
const app = express();
const PORT = config.server.port;
const SSL_PORT = config.server.sslPort || 443;

// Trust proxy (needed when behind Nginx)
app.set('trust proxy', 1);

// Apply security headers with custom configuration
securityHeaders(app);

// Logging middleware
app.use((req, res, next) => {
    logger.debug(`Request received: ${req.method} ${req.originalUrl}`);
    logger.debug(`Protocol: ${req.protocol}, Secure: ${req.secure}, X-Forwarded-Proto: ${req.headers['x-forwarded-proto'] || 'none'}`);
    next();
});

// Debug redirect middleware
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
        secure: config.server.env === 'production',
        sameSite: 'lax'
    }
}));

// Global IP blocking middleware
app.use((req, res, next) => {
    if (isIPBlocked(req.ip)) {
        logger.warn('Blocked IP attempted to access the site', { ip: req.ip, path: req.path });
        return res.status(403).send('Your access to this site has been blocked.');
    }
    next();
});

// Admin security middleware
app.use(adminSecurity);

// Root route - handle this before static files to prevent directory listing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.public, 'index.html'));
});

// Static files
app.use(express.static(path.join(__dirname, config.paths.public), {
    etag: true,
    lastModified: true,
    index: false, // Disable automatic directory index
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(css|js|jpg|png|gif|svg|ico)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// Maintenance mode
app.use(maintenanceMode);

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/images', imageRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', admin.router);
app.use('/panels/community', communityRoutes);

// Test route
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// Welcome route
app.get('/welcome', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.public, 'welcome.html'));
});

// Coming Soon route
app.get('/coming-soon.html', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.public, 'coming-soon.html'));
});

// Direct route for community.html to avoid issues
app.get('/panels/community.html', (req, res) => {
    if (!req.session.user) {
        logger.info('Unauthenticated user attempted to access community page', {
            ip: req.ip
        });
        return res.redirect(`/auth/discord?returnTo=/panels/community.html`);
    }
    res.sendFile(path.join(__dirname, config.paths.public, 'panels/community.html'));
});

// Direct route for news.html to avoid redirect issues
app.get('/panels/community/news.html', (req, res) => {
    if (!req.session.user) {
        logger.info('Unauthenticated user attempted to access news page', {
            ip: req.ip
        });
        return res.redirect(`/auth/discord?returnTo=/panels/community/news.html`);
    }
    res.sendFile(path.join(__dirname, config.paths.public, 'panels/community/news.html'));
});

// Panels routes
app.get('/panels/:panel', (req, res, next) => {
    const panelFile = `panels/${req.params.panel}`;
    const filePath = path.join(__dirname, config.paths.public, panelFile);
    
    // Log the panel request
    logger.debug(`Panel requested: ${req.params.panel}`, { 
        ip: req.ip,
        panel: req.params.panel,
        path: filePath
    });
    
    // Check if user is authenticated before serving panel
    if (!req.session.user) {
        logger.info('Unauthenticated user attempted to access panel', {
            panel: req.params.panel,
            ip: req.ip
        });
        return res.redirect(`/auth/discord?returnTo=/panels/${req.params.panel}`);
    }
    
    res.sendFile(filePath, (err) => {
        if (err) {
            logger.error(`Error serving panel: ${req.params.panel}`, { error: err.message });
            if (err.code === 'ENOENT') {
                return res.redirect('/coming-soon.html');
            }
            next(err);
        }
    });
});

// Catch-all route for undefined routes - send to 404 page instead of directory listing
app.use((req, res, next) => {
    // Skip for API routes and static assets
    if (req.path.startsWith('/api/') || /\.(css|js|jpg|png|gif|svg|ico)$/.test(req.path)) {
        return next();
    }
    
    res.status(404).sendFile(path.join(__dirname, config.paths.public, '404.html'));
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

// Bot starter
const startBot = () => {
    logger.info('Starting Discord bot...');
    bot.start();
};

// Start servers
if (config.server.env === 'production' && sslOptions) {
    http.createServer(app).listen(PORT, () => {
        logger.info(`HTTP server running on port ${PORT}`);
    });

    https.createServer(sslOptions, app).listen(SSL_PORT, () => {
        logger.info(`HTTPS server running in ${config.server.env} mode on port ${SSL_PORT}`);
        logger.info(`Visit https://gssrp.xyz to view the site`);
        startBot();
    });
} else {
    app.listen(PORT, () => {
        logger.info(`Server running in ${config.server.env} mode on port ${PORT}`);
        logger.info(`Visit http://localhost:${PORT} to view the site`);
        startBot();
    });
}
