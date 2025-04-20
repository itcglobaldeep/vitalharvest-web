const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await aiController.generateResponse(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
    }
});

module.exports = router;