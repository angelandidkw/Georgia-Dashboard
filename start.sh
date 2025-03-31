#!/bin/bash

# Georgia State Roleplay - Server Start Script

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm could not be found. Please install Node.js and npm."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "Dependencies installed."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=georgia_state_roleplay_secret_key

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=1355983636620513461
DISCORD_CLIENT_SECRET=n3m0rk_qGoXMqEkcH-XqWzHO3vJKwg9m
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback

# Maintenance Mode Configuration
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=We are currently undergoing scheduled maintenance. Please check back soon.
MAINTENANCE_END_TIME=April 5, 2023 12:00 PM EST
EOF
    echo ".env file created."
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Determine the mode to run in
MODE=${1:-dev}

case $MODE in
    dev)
        echo "Starting server in development mode..."
        npm run dev
        ;;
    prod)
        echo "Starting server in production mode..."
        npm run prod
        ;;
    maintenance)
        echo "Starting server in maintenance mode..."
        npm run maintenance-on
        ;;
    *)
        echo "Invalid mode. Use: dev, prod, or maintenance"
        exit 1
        ;;
esac 