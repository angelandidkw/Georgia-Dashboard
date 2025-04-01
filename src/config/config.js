// Configuration for Georgia State Roleplay
require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        sslPort: process.env.SSL_PORT || 443,
        env: process.env.NODE_ENV || 'development',
        sessionSecret: process.env.SESSION_SECRET || 'your-secret-key'
    },
    
    // Discord OAuth2 configuration
    discord: {
        clientId: process.env.DISCORD_CLIENT_ID || '1355983636620513461',
        clientSecret: process.env.DISCORD_CLIENT_SECRET || 'n3m0rk_qGoXMqEkcH-XqWzHO3vJKwg9m',
        token: process.env.DISCORD_BOT_TOKEN,
        guildId: process.env.DISCORD_GUILD_ID,
        redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
        apiUrl: 'https://discord.com/api/v10',
        roles: {
            staff: process.env.DISCORD_STAFF_ROLE_ID,
            admin: process.env.DISCORD_ADMIN_ROLE_ID,
            member: process.env.DISCORD_MEMBER_ROLE_ID
        }
    },
    
    // Rate limiting configuration
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            standardHeaders: true,
            legacyHeaders: false
        },
        cors: {
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://gssrp.xyz', 'http://gssrp.xyz'] 
                : true,
            credentials: true
        }
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

// Validate required environment variables
const requiredEnvVars = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_BOT_TOKEN',
    'DISCORD_GUILD_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config; 