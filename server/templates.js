const express = require('express');
const router = express.Router();

router.post('/tasks/:taskId/reminder', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { templateName, customMessage, customInterval } = req.body;

        if (!templateName || !reminderTemplates[templateName]) {
            return res.status(400).json({ 
                error: 'Valid template name is required',
                availableTemplates: Object.keys(reminderTemplates)
            });
        }

        await cacheManager.setReminderFromTemplate(
            taskId, 
            templateName, 
            customMessage, 
            customInterval
        );

        res.json({
            success: true,
            message: 'Template reminder set successfully',
            template: templateName
        });
    } catch (error) {
        console.error('Template Reminder Error:', error);
        res.status(500).json({ error: 'Failed to set template reminder' });
    }
});

router.get('/stats/:templateName?', async (req, res) => {
    try {
        const { templateName } = req.params;
        const stats = await cacheManager.getTemplateStats(templateName);

        if (!stats) {
            return res.status(404).json({ error: 'Template stats not found' });
        }

        res.json({
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Template Stats Error:', error);
        res.status(500).json({ error: 'Failed to get template statistics' });
    }
});

router.get('/reports/:templateName?', async (req, res) => {
    try {
        const { templateName } = req.params;
        const { timeRange } = req.query;
        
        const report = await cacheManager.generateTemplateReport(templateName, timeRange);
        if (!report) {
            return res.status(404).json({ error: 'Failed to generate template report' });
        }

        res.json({
            report,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Template Report Error:', error);
        res.status(500).json({ error: 'Failed to generate template report' });
    }
});

router.get('/performance/:templateName?', async (req, res) => {
    try {
        const { templateName } = req.params;
        const performanceKey = templateName ? 
            `template_performance:${templateName}` : 
            'template_performance:*';

        const keys = await redisClient.keys(performanceKey);
        const metrics = {};

        for (const key of keys) {
            const name = key.split(':')[1];
            const performance = await cacheManager.get(key);
            if (performance) {
                metrics[name] = {
                    ...performance,
                    successRate: (performance.successCount / performance.totalUsage * 100).toFixed(2),
                    failureRate: (performance.failureCount / performance.totalUsage * 100).toFixed(2)
                };
            }
        }

        res.json({
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Template Performance Error:', error);
        res.status(500).json({ error: 'Failed to get template performance metrics' });
    }
});

module.exports = router;