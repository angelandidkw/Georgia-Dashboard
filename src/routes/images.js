const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Handle image requests with proper headers
router.get('/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(process.cwd(), 'public', 'images', imageName);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        logger.warn(`Image not found: ${imageName}`);
        return res.status(404).send('Image not found');
    }
    
    // Set appropriate headers
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Determine content type
    let contentType = 'image/png';  // Default
    if (imageName.endsWith('.jpg') || imageName.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
    } else if (imageName.endsWith('.ico')) {
        contentType = 'image/x-icon';
    } else if (imageName.endsWith('.svg')) {
        contentType = 'image/svg+xml';
    } else if (imageName.endsWith('.gif')) {
        contentType = 'image/gif';
    }
    
    res.setHeader('Content-Type', contentType);
    
    // Send the image file
    res.sendFile(imagePath);
});

module.exports = router; 