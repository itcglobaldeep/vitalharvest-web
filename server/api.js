const express = require('express');
const router = express.Router();

// Import other route modules
const taskRoutes = require('./tasks');
const templateRoutes = require('./templates');
const analysisRoutes = require('./analysis');

// Use the route modules
router.use('/tasks', taskRoutes);
router.use('/templates', templateRoutes);
router.use('/analyze', analysisRoutes);

module.exports = router;