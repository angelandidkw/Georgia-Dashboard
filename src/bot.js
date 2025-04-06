const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config/config');
const { logger } = require('./utils/logger');

class DiscordBot {
    constructor() {
        // Initialize the client with necessary intents
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commands = new Collection();
        this.initialize();
    }

    initialize() {
        // Handle uncaught exceptions and unhandled rejections
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
        });

        process.on('unhandledRejection', (error) => {
            logger.error('Unhandled Rejection:', error);
        });

        // Set up bot event handlers
        this.client.on('ready', () => this.handleReady());
        this.client.on('error', (error) => this.handleError(error));
        this.client.on('guildMemberUpdate', (oldMember, newMember) => this.handleMemberUpdate(oldMember, newMember));
    }

    async handleReady() {
        try {
            logger.info(`Bot logged in as ${this.client.user.tag}`);
            logger.info(`Serving ${this.client.guilds.cache.size} guild(s)`);
            logger.info(`Bot is in ${this.client.guilds.cache.map(g => g.name).join(', ')}`);
            
            // Set the bot's activity status
            this.client.user.setActivity('Georgia State Roleplay', { type: 'PLAYING' });
        } catch (error) {
            logger.error('Error in handleReady:', error);
        }
    }

    handleError(error) {
        logger.error('Discord client error:', error);
    }

    async handleMemberUpdate(oldMember, newMember) {
        try {
            // Compare role changes between old and new member data
            const oldRoles = oldMember.roles.cache.map(role => role.id);
            const newRoles = newMember.roles.cache.map(role => role.id);
            
            if (JSON.stringify(oldRoles) !== JSON.stringify(newRoles)) {
                logger.info(`Member ${newMember.user.tag} roles updated`);
                // Implement any additional role-based logic here
            }
        } catch (error) {
            logger.error('Error in handleMemberUpdate:', error);
        }
    }

    // Method to check if a user has required roles
    async checkUserRoles(userId, requiredRoles) {
        try {
            const guild = await this.client.guilds.fetch(config.discord.guildId);
            const member = await guild.members.fetch(userId);
            
            return requiredRoles.some(roleId => member.roles.cache.has(roleId));
        } catch (error) {
            logger.error('Error checking user roles:', error);
            return false;
        }
    }

    // Method to get user roles
    async getUserRoles(userId) {
        try {
            const guild = await this.client.guilds.fetch(config.discord.guildId);
            const member = await guild.members.fetch(userId);
            
            return member.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            }));
        } catch (error) {
            logger.error('Error getting user roles:', error);
            return [];
        }
    }

    // Method to get user information
    async getUserInfo(userId) {
        try {
            const guild = await this.client.guilds.fetch(config.discord.guildId);
            const member = await guild.members.fetch(userId);
            
            return {
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator || '0',
                avatar: member.user.avatar,
                roles: await this.getUserRoles(userId),
                joinedAt: member.joinedAt,
                permissions: member.permissions.bitfield
            };
        } catch (error) {
            logger.error('Error getting user info:', error);
            return null;
        }
    }

    // Start the bot
    start() {
        try {
            logger.info('Attempting to connect to Discord...');
            this.client.login(config.discord.token);
        } catch (error) {
            logger.error('Error starting bot:', error);
            process.exit(1);
        }
    }
}

// Create a new instance of the bot
const bot = new DiscordBot();

// If the file is run directly, start the bot
if (require.main === module) {
    logger.info('Starting bot in standalone mode...');
    bot.start();
}

module.exports = bot;
