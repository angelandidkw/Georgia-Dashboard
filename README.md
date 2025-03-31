# Georgia State Roleplay - Coming Soon Page

A professional coming soon page for Georgia State Roleplay with Discord authentication.

## Features

- Clean, modern design
- Discord OAuth2 authentication
- Personalized welcome page after login
- Responsive layout for all devices

## Setup Instructions

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Georgia State Roleplay")
3. Go to the "OAuth2" tab in the left sidebar
4. Add a redirect URL: `http://localhost:3000/auth/discord/callback`
5. Save changes
6. Copy your "Client ID" and "Client Secret"

### 2. Configure the Application

1. Open `server.js` and replace the following values:
   ```javascript
   const DISCORD_CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
   const DISCORD_CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
   ```

2. Replace the placeholder avatar:
   - Add a real PNG image file at `public/images/default-avatar.png`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The site will be available at http://localhost:3000

## Deployment

When deploying to production:

1. Update the `DISCORD_REDIRECT_URI` in server.js to use your production URL
2. Add your production redirect URL to your Discord application settings
3. Set up proper session security (secret, cookie settings, etc.)
4. Consider using environment variables for sensitive information

## License

All rights reserved - Georgia State Roleplay 