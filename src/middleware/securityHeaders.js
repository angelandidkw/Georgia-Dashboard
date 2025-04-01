const helmet = require('helmet');
const { logger } = require('../utils/logger');

// Security headers middleware
const securityHeaders = (app) => {
  // Use helmet with customized settings
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "*.amazonaws.com"],
          scriptSrcAttr: ["'unsafe-inline'"],
          scriptSrcElem: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "cdn.discordapp.com", "*.discordapp.net", "*.amazonaws.com"],
          fontSrc: ["'self'", "data:", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
          connectSrc: ["'self'", "*.amazonaws.com", "sfd8q2ch3k.execute-api.us-east-2.amazonaws.com"],
        },
      },
      // Disable COEP to allow loading resources from different origins
      crossOriginEmbedderPolicy: false,
      // Configure CORS policy
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Allow iframes from same origin
      frameguard: { action: 'sameorigin' },
      // Disable HSTS to let the hosting provider handle it
      hsts: false
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

    // Set stricter Content Security Policy for admin routes
    if (req.path.startsWith('/admin')) {
      // Set strict CSP for admin routes
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.discordapp.com; font-src 'self' data: https:; frame-ancestors 'none';"
      );
      
      // Prevent admin page from being embedded in iframes (clickjacking protection)
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent browsers from performing MIME sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Force HTTPS
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      // Prevent caching of admin pages
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      logger.debug('Applied strict security headers for admin route', { path: req.path });
    }

    next();
  });
};

module.exports = securityHeaders; 