// Configuration for Georgia State Roleplay
require('dotenv').config();

module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        sslPort: process.env.SSL_PORT || 443,
        env: process.env.NODE_ENV || 'development',
        sessionSecret: process.env.SESSION_SECRET || 'georgia_state_roleplay_secret'
    },
    
    // Discord OAuth2 configuration
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID || '1355983636620513461',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || 'n3m0rk_qGoXMqEkcH-XqWzHO3vJKwg9m',
        redirectUri: process.env.DISCORD_REDIRECT_URI || 
            (process.env.NODE_ENV === 'production' 
                ? 'https://gssrp.xyz/auth/discord/callback' 
                : `http://localhost:${process.env.PORT || 3000}/auth/discord/callback`),
        apiUrl: 'https://discord.com/api/v10'
    },
    
    // Rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false
    },
    
    // Cookie configuration
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production', // Force secure cookies in production
        sameSite: 'lax'
    },
    
    // Paths configuration
    paths: {
        public: 'public',
        views: 'views',
        logs: 'logs'
    },
    
    // Maintenance mode configuration
    maintenance: {
        enabled: process.env.MAINTENANCE_MODE === 'true' || false,
        message: process.env.MAINTENANCE_MESSAGE || 'We are currently undergoing scheduled maintenance. Please check back soon.',
        endTime: process.env.MAINTENANCE_END_TIME || null
    }
}; 