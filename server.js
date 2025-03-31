// Georgia State Roleplay - Coming Soon server
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

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

// Apply security headers with custom configuration
securityHeaders(app);

// CORS configuration
app.use(cors({
    origin: config.server.env === 'production' ? 'https://georgiastateroleplay.com' : true,
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
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite
    }
}));

// Static files
app.use(express.static(path.join(__dirname, config.paths.public)));

// Maintenance mode
app.use(maintenanceMode);

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/images', imageRoutes);

// Welcome route
app.get('/welcome', (req, res) => {
    if (!req.session.user) {
        logger.warn('Unauthorized access attempt to welcome page', { ip: req.ip });
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, config.paths.public, 'welcome.html'));
});

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, config.paths.public, 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`Server running in ${config.server.env} mode on port ${PORT}`);
    logger.info(`Visit http://localhost:${PORT} to view the site`);
}); 