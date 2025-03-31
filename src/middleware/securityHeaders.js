const helmet = require('helmet');

// Security headers middleware
const securityHeaders = (app) => {
  // Use helmet with customized settings
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "cdn.discordapp.com", "*.discordapp.net"],
          fontSrc: ["'self'", "data:", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
          connectSrc: ["'self'"],
        },
      },
      // Disable COEP to allow loading resources from different origins
      crossOriginEmbedderPolicy: false,
      // Configure CORS policy
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Allow iframes from same origin
      frameguard: { action: 'sameorigin' }
    })
  );

  // Additional security headers
  app.use((req, res, next) => {
    // Set X-XSS-Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Set X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // No cache headers for dynamic content
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });
};

module.exports = securityHeaders; 