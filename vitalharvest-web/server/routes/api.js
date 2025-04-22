const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Data Analysis Endpoints
router.post('/analyze/text', [
    body('content').notEmpty().isString().withMessage('Text content is required'),
    body('language').optional().isISO639Alpha2().withMessage('Invalid language code')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.json({ message: 'Text analysis', data: req.body });
});

router.post('/analyze/image', [
    body('imageUrl').isURL().withMessage('Valid image URL is required'),
    body('type').isIn(['object', 'text', 'face']).withMessage('Invalid analysis type')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.json({ message: 'Image analysis', data: req.body });
});

module.exports = router;