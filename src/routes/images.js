const express = require('express');
const router = express.Router();
const path = require('path');
const { logger } = require('../utils/logger');

// Allowed extensions and content types
const allowedExtensions = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// Handle image requests securely
router.get('/:imageName', (req, res) => {
    const rawImageName = req.params.imageName;
    const safeImageName = path.basename(rawImageName); // Prevent traversal
    const ext = path.extname(safeImageName).toLowerCase();

    // Validate extension
    if (!allowedExtensions[ext]) {
        logger.warn(`Attempt to access disallowed file type: ${safeImageName}`);
        return res.status(403).send('File type not allowed');
    }

    const imageDir = path.join(process.cwd(), 'public', 'images');
    const resolvedPath = path.resolve(imageDir, safeImageName);

    // Ensure resolved path is within the intended directory
    if (!resolvedPath.startsWith(imageDir)) {
        logger.warn(`Directory traversal attempt blocked: ${safeImageName}`);
        return res.status(403).send('Access denied');
    }

    // Set headers
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', allowedExtensions[ext]);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Send the file
    res.sendFile(resolvedPath, (err) => {
        if (err) {
            logger.warn(`Error serving image: ${safeImageName}`, { error: err.message });
            return res.status(err.statusCode || 500).send('Failed to load image');
        }
    });
});

module.exports = router;
