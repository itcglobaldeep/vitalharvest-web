const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const openai = require('./config/ai');
const multer = require('multer');
const sharp = require('sharp');
const { fileTypeFromBuffer } = require('file-type');
const Redis = require('redis');
const lz4 = require('lz4');
const zlib = require('zlib');
const util = require('util');
const compress = util.promisify(zlib.gzip);
const decompress = util.promisify(zlib.gunzip);

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API routes
app.post('/api/analyze/text', async (req, res) => {
    try {
        const { content } = req.body;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: "You are a helpful assistant for VitalHarvest, focusing on health and wellness advice." 
                },
                { 
                    role: "user", 
                    content: content 
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: completion.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Redis client setup with error handling
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Redis event handlers
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Cache management functions
const compressionLevels = {
    FAST: { level: zlib.constants.Z_BEST_SPEED },
    BALANCED: { level: zlib.constants.Z_DEFAULT_COMPRESSION },
    MAX: { level: zlib.constants.Z_BEST_COMPRESSION }
};

// Add at the top with other requires
const nodemailer = require('nodemailer');

// Add email configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Add reminder templates after compressionLevels
const reminderTemplates = {
    workout: {
        title: "Workout Reminder",
        message: "Time for your daily workout! Stay healthy and active.",
        defaultInterval: 24 * 60 * 60 // 24 hours in seconds
    },
    meditation: {
        title: "Meditation Time",
        message: "Take a moment to meditate and center yourself.",
        defaultInterval: 12 * 60 * 60 // 12 hours in seconds
    },
    water: {
        title: "Hydration Check",
        message: "Remember to stay hydrated throughout the day!",
        defaultInterval: 2 * 60 * 60 // 2 hours in seconds
    },
    meal: {
        title: "Meal Planning",
        message: "Time to prepare your healthy meal.",
        defaultInterval: 6 * 60 * 60 // 6 hours in seconds
    }
};

// Add to cacheManager
const cacheManager = {
    async set(key, value, expireTime = 3600, compressionLevel = 'BALANCED') {
        try {
            const stringValue = JSON.stringify(value);
            const options = compressionLevels[compressionLevel] || compressionLevels.BALANCED;
            const compressed = await util.promisify(zlib.gzip)(stringValue, options);
            await redisClient.setEx(key, expireTime, compressed.toString('base64'));
        } catch (error) {
            console.error('Cache Set Error:', error);
        }
    },
    
    async get(key) {
        try {
            const compressed = await redisClient.get(key);
            if (!compressed) return null;
            
            const buffer = Buffer.from(compressed, 'base64');
            const decompressed = await decompress(buffer);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    },
    
    async delete(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Cache Delete Error:', error);
        }
    },

    async cleanup() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const now = Date.now();
            
            for (const key of keys) {
                const ttl = await redisClient.ttl(key);
                if (ttl < 0 || ttl > 86400) { // Remove expired or >24h old entries
                    await this.delete(key);
                }
            }
        } catch (error) {
            console.error('Cache Cleanup Error:', error);
        }
    },

    // Fix the missing comma after getStats method
    async getStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            return {
                totalEntries: keys.length,
                prefix: 'image_analysis'
            };
        } catch (error) {
            console.error('Cache Stats Error:', error);
            return { totalEntries: 0, prefix: 'image_analysis' };
        }
    },  // Added comma here

    async getCompressionStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const stats = {
                totalOriginal: 0,
                totalCompressed: 0,
                compressionRatio: 0,
                compressionSpeed: 0
            };

            for (const key of keys) {
                const compressed = await redisClient.get(key);
                if (compressed) {
                    const startTime = process.hrtime();
                    const buffer = Buffer.from(compressed, 'base64');
                    const decompressed = await decompress(buffer);
                    const [seconds, nanoseconds] = process.hrtime(startTime);
                    
                    stats.totalOriginal += decompressed.length;
                    stats.totalCompressed += buffer.length;
                    stats.compressionSpeed += seconds * 1000 + nanoseconds / 1e6;
                }
            }

            stats.compressionRatio = stats.totalOriginal ? 
                (stats.totalCompressed / stats.totalOriginal).toFixed(2) : 0;
            stats.compressionSpeed = (stats.compressionSpeed / keys.length).toFixed(2);

            return stats;
        } catch (error) {
            console.error('Compression Stats Error:', error);
            return { 
                totalOriginal: 0, 
                totalCompressed: 0, 
                compressionRatio: 0,
                compressionSpeed: 0 
            };
        }
    }
};

// Update stats logging to include compression info
setInterval(() => {
    Promise.all([
        cacheManager.cleanup(),
        cacheManager.getStats(),
        cacheManager.getCompressionStats()
    ]).then(([_, stats, compressionStats]) => {
        console.log('Cache Stats:', { ...stats, ...compressionStats });
    });
}, 6 * 60 * 60 * 1000);

// Schedule cache cleanup every 6 hours
setInterval(() => {
    cacheManager.cleanup();
    cacheManager.getStats().then(stats => {
        console.log('Cache Stats:', stats);
    });
}, 6 * 60 * 60 * 1000);

// Connect to Redis
redisClient.connect().catch(console.error);

app.post('/api/analyze/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Generate cache key from image buffer
        const cacheKey = `image_analysis:${Buffer.from(req.file.buffer).toString('base64').slice(0, 32)}`;
        
        // Check cache
        const cachedResult = await cacheManager.get(cacheKey);
        if (cachedResult) {
            return res.json({
                data: {
                    content: cachedResult,
                    cached: true
                }
            });
        }

        // Validate file type
        const fileType = await fileTypeFromBuffer(req.file.buffer);
        if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        // Process image
        const processedImage = await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg')
            .toBuffer();

        // Convert to base64 for OpenAI API
        const base64Image = processedImage.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a health and wellness assistant analyzing images for VitalHarvest."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What can you tell me about this image in terms of health and wellness?" },
                        { type: "image_url", url: imageUrl }
                    ]
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: response.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Image analysis failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Add task routes before the PORT declaration
    app.post('/api/tasks', async (req, res) => {
        try {
            const { title, description, dueDate, category, priority } = req.body;
            
            if (!title || !description) {
                return res.status(400).json({ error: 'Title and description are required' });
            }

            const taskKey = `task:${Date.now()}`;
            await cacheManager.set(taskKey, {
                title,
                description,
                dueDate,
                category: category || 'general',
                priority: priority || 'medium', // Added priority field
                status: 'pending',
                createdAt: new Date().toISOString()
            }, 86400);

            res.json({
                success: true,
                message: 'Task created successfully',
                taskId: taskKey.split(':')[1]
            });
        } catch (error) {
            console.error('Task Creation Error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    });

    app.put('/api/tasks/:taskId', async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, title, description, dueDate, category, priority } = req.body;
            const taskKey = `task:${taskId}`;
            
            const task = await cacheManager.get(taskKey);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const updatedTask = {
                ...task,
                title: title || task.title,
                description: description || task.description,
                dueDate: dueDate || task.dueDate,
                category: category || task.category,
                priority: priority || task.priority, // Added priority update
                status: status || task.status,
                updatedAt: new Date().toISOString()
            };

            await cacheManager.set(taskKey, updatedTask, 86400);
            res.json({
                success: true,
                message: 'Task updated successfully',
                task: updatedTask
            });
        } catch (error) {
            console.error('Task Update Error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    });

    // Add new search endpoint after existing task routes
    app.get('/api/tasks/search', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }
    
            const keys = await redisClient.keys('task:*');
            const tasks = [];
            const searchTerm = query.toLowerCase();
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && (
                    task.title.toLowerCase().includes(searchTerm) ||
                    task.description.toLowerCase().includes(searchTerm) ||
                    task.category.toLowerCase().includes(searchTerm)
                )) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }
    
            // Sort by relevance and priority
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority] || 2;
                const bPriority = priorityOrder[b.priority] || 2;
                
                // First sort by exact title match
                const aExactMatch = a.title.toLowerCase() === searchTerm;
                const bExactMatch = b.title.toLowerCase() === searchTerm;
                if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
                
                // Then by priority
                if (aPriority !== bPriority) return bPriority - aPriority;
                
                // Finally by date
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            res.json({
                results: tasks,
                total: tasks.length
            });
        } catch (error) {
            console.error('Task Search Error:', error);
            res.status(500).json({ error: 'Failed to search tasks' });
        }
    });

    app.get('/api/tasks', async (req, res) => {
        try {
            const { status, category, priority, sortBy = 'createdAt' } = req.query;
            const keys = await redisClient.keys('task:*');
            const tasks = [];

            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && 
                    (!status || task.status === status) &&
                    (!category || task.category === category) &&
                    (!priority || task.priority === priority)) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }

            // Sort tasks by priority and date
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (sortBy === 'priority') {
                    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                }
                return new Date(b[sortBy]) - new Date(a[sortBy]);
            });

            const groupedTasks = tasks.reduce((acc, task) => {
                const category = task.category || 'general';
                if (!acc[category]) {
                    acc[category] = {
                        pending: [],
                        completed: []
                    };
                }
                acc[category][task.status].push(task);
                return acc;
            }, {});

            res.json(groupedTasks);
        } catch (error) {
            console.error('Task Fetch Error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    });
1

    // Add new statistics endpoint after search endpoint
    app.get('/api/tasks/stats', async (req, res) => {
        try {
            const keys = await redisClient.keys('task:*');
            const stats = {
                total: 0,
                byStatus: { pending: 0, completed: 0 },
                byPriority: { high: 0, medium: 0, low: 0 },
                byCategory: {},
                overdue: 0,
                completedOnTime: 0,
                averageCompletionTime: 0
            };
    
            const completionTimes = [];
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task) {
                    stats.total++;
                    stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
                    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
                    stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    
                    const dueDate = new Date(task.dueDate);
                    const now = new Date();
    
                    if (task.status === 'completed' && task.updatedAt) {
                        const completionDate = new Date(task.updatedAt);
                        const completionTime = completionDate - new Date(task.createdAt);
                        completionTimes.push(completionTime);
    
                        if (dueDate >= completionDate) {
                            stats.completedOnTime++;
                        }
                    } else if (task.status === 'pending' && dueDate < now) {
                        stats.overdue++;
                    }
                }
            }
    
            // Calculate average completion time
            if (completionTimes.length > 0) {
                stats.averageCompletionTime = Math.floor(
                    completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / (1000 * 60 * 60)
                ); // Convert to hours
            }
    
            res.json({
                stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Task Stats Error:', error);
            res.status(500).json({ error: 'Failed to get task statistics' });
        }
    });

    async setReminderFromTemplate(taskId, templateName, customMessage = null, customInterval = null) {
        try {
            const template = reminderTemplates[templateName];
            if (!template) {
                throw new Error('Invalid template name');
            }

            const taskKey = `task:${taskId}`;
            const reminderKey = `reminder:${taskId}`;
            const task = await this.get(taskKey);

            if (task) {
                const now = new Date();
                const reminderTime = new Date(now.getTime() + 
                    (customInterval || template.defaultInterval) * 1000);

                await redisClient.setEx(reminderKey,
                    customInterval || template.defaultInterval,
                    JSON.stringify({
                        taskId,
                        taskTitle: task.title,
                        templateName,
                        message: customMessage || template.message,
                        reminderTime: reminderTime.toISOString(),
                        notified: false,
                        performanceTracked: false
                    })
                );

                // Track template usage and initial performance
                await this.trackTemplateUsage(templateName, taskId);
                await this.updateTemplatePerformance(templateName, taskId, true);
            }
        } catch (error) {
            console.error('Template Reminder Set Error:', error);
        }
    }
};

// Add template endpoint
app.post('/api/tasks/:taskId/reminder/template', async (req, res) => {
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

// Add template stats endpoint
app.get('/api/templates/stats/:templateName?', async (req, res) => {
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
};

// Add template report endpoints
app.get('/api/templates/reports/:templateName?', async (req, res) => {
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

// Add performance metrics endpoint
app.get('/api/templates/performance/:templateName?', async (req, res) => {
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

// Add to cacheManager
const cacheManager = {
    async set(key, value, expireTime = 3600, compressionLevel = 'BALANCED') {
        try {
            const stringValue = JSON.stringify(value);
            const options = compressionLevels[compressionLevel] || compressionLevels.BALANCED;
            const compressed = await util.promisify(zlib.gzip)(stringValue, options);
            await redisClient.setEx(key, expireTime, compressed.toString('base64'));
        } catch (error) {
            console.error('Cache Set Error:', error);
        }
    },
    
    async get(key) {
        try {
            const compressed = await redisClient.get(key);
            if (!compressed) return null;
            
            const buffer = Buffer.from(compressed, 'base64');
            const decompressed = await decompress(buffer);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    },
    
    async delete(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Cache Delete Error:', error);
        }
    },

    async cleanup() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const now = Date.now();
            
            for (const key of keys) {
                const ttl = await redisClient.ttl(key);
                if (ttl < 0 || ttl > 86400) { // Remove expired or >24h old entries
                    await this.delete(key);
                }
            }
        } catch (error) {
            console.error('Cache Cleanup Error:', error);
        }
    },

    // Fix the missing comma after getStats method
    async getStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            return {
                totalEntries: keys.length,
                prefix: 'image_analysis'
            };
        } catch (error) {
            console.error('Cache Stats Error:', error);
            return { totalEntries: 0, prefix: 'image_analysis' };
        }
    },  // Added comma here

    async getCompressionStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const stats = {
                totalOriginal: 0,
                totalCompressed: 0,
                compressionRatio: 0,
                compressionSpeed: 0
            };

            for (const key of keys) {
                const compressed = await redisClient.get(key);
                if (compressed) {
                    const startTime = process.hrtime();
                    const buffer = Buffer.from(compressed, 'base64');
                    const decompressed = await decompress(buffer);
                    const [seconds, nanoseconds] = process.hrtime(startTime);
                    
                    stats.totalOriginal += decompressed.length;
                    stats.totalCompressed += buffer.length;
                    stats.compressionSpeed += seconds * 1000 + nanoseconds / 1e6;
                }
            }

            stats.compressionRatio = stats.totalOriginal ? 
                (stats.totalCompressed / stats.totalOriginal).toFixed(2) : 0;
            stats.compressionSpeed = (stats.compressionSpeed / keys.length).toFixed(2);

            return stats;
        } catch (error) {
            console.error('Compression Stats Error:', error);
            return { 
                totalOriginal: 0, 
                totalCompressed: 0, 
                compressionRatio: 0,
                compressionSpeed: 0 
            };
        }
    }
};

// Update stats logging to include compression info
setInterval(() => {
    Promise.all([
        cacheManager.cleanup(),
        cacheManager.getStats(),
        cacheManager.getCompressionStats()
    ]).then(([_, stats, compressionStats]) => {
        console.log('Cache Stats:', { ...stats, ...compressionStats });
    });
}, 6 * 60 * 60 * 1000);

// Schedule cache cleanup every 6 hours
setInterval(() => {
    cacheManager.cleanup();
    cacheManager.getStats().then(stats => {
        console.log('Cache Stats:', stats);
    });
}, 6 * 60 * 60 * 1000);

// Connect to Redis
redisClient.connect().catch(console.error);

app.post('/api/analyze/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Generate cache key from image buffer
        const cacheKey = `image_analysis:${Buffer.from(req.file.buffer).toString('base64').slice(0, 32)}`;
        
        // Check cache
        const cachedResult = await cacheManager.get(cacheKey);
        if (cachedResult) {
            return res.json({
                data: {
                    content: cachedResult,
                    cached: true
                }
            });
        }

        // Validate file type
        const fileType = await fileTypeFromBuffer(req.file.buffer);
        if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        // Process image
        const processedImage = await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg')
            .toBuffer();

        // Convert to base64 for OpenAI API
        const base64Image = processedImage.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a health and wellness assistant analyzing images for VitalHarvest."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What can you tell me about this image in terms of health and wellness?" },
                        { type: "image_url", url: imageUrl }
                    ]
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: response.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Image analysis failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Add task routes before the PORT declaration
    app.post('/api/tasks', async (req, res) => {
        try {
            const { title, description, dueDate, category, priority } = req.body;
            
            if (!title || !description) {
                return res.status(400).json({ error: 'Title and description are required' });
            }

            const taskKey = `task:${Date.now()}`;
            await cacheManager.set(taskKey, {
                title,
                description,
                dueDate,
                category: category || 'general',
                priority: priority || 'medium', // Added priority field
                status: 'pending',
                createdAt: new Date().toISOString()
            }, 86400);

            res.json({
                success: true,
                message: 'Task created successfully',
                taskId: taskKey.split(':')[1]
            });
        } catch (error) {
            console.error('Task Creation Error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    });

    app.put('/api/tasks/:taskId', async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, title, description, dueDate, category, priority } = req.body;
            const taskKey = `task:${taskId}`;
            
            const task = await cacheManager.get(taskKey);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const updatedTask = {
                ...task,
                title: title || task.title,
                description: description || task.description,
                dueDate: dueDate || task.dueDate,
                category: category || task.category,
                priority: priority || task.priority, // Added priority update
                status: status || task.status,
                updatedAt: new Date().toISOString()
            };

            await cacheManager.set(taskKey, updatedTask, 86400);
            res.json({
                success: true,
                message: 'Task updated successfully',
                task: updatedTask
            });
        } catch (error) {
            console.error('Task Update Error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    });

    // Add new search endpoint after existing task routes
    app.get('/api/tasks/search', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }
    
            const keys = await redisClient.keys('task:*');
            const tasks = [];
            const searchTerm = query.toLowerCase();
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && (
                    task.title.toLowerCase().includes(searchTerm) ||
                    task.description.toLowerCase().includes(searchTerm) ||
                    task.category.toLowerCase().includes(searchTerm)
                )) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }
    
            // Sort by relevance and priority
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority] || 2;
                const bPriority = priorityOrder[b.priority] || 2;
                
                // First sort by exact title match
                const aExactMatch = a.title.toLowerCase() === searchTerm;
                const bExactMatch = b.title.toLowerCase() === searchTerm;
                if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
                
                // Then by priority
                if (aPriority !== bPriority) return bPriority - aPriority;
                
                // Finally by date
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            res.json({
                results: tasks,
                total: tasks.length
            });
        } catch (error) {
            console.error('Task Search Error:', error);
            res.status(500).json({ error: 'Failed to search tasks' });
        }
    });

    app.get('/api/tasks', async (req, res) => {
        try {
            const { status, category, priority, sortBy = 'createdAt' } = req.query;
            const keys = await redisClient.keys('task:*');
            const tasks = [];

            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && 
                    (!status || task.status === status) &&
                    (!category || task.category === category) &&
                    (!priority || task.priority === priority)) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }

            // Sort tasks by priority and date
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (sortBy === 'priority') {
                    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                }
                return new Date(b[sortBy]) - new Date(a[sortBy]);
            });

            const groupedTasks = tasks.reduce((acc, task) => {
                const category = task.category || 'general';
                if (!acc[category]) {
                    acc[category] = {
                        pending: [],
                        completed: []
                    };
                }
                acc[category][task.status].push(task);
                return acc;
            }, {});

            res.json(groupedTasks);
        } catch (error) {
            console.error('Task Fetch Error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    });
1

    // Add new statistics endpoint after search endpoint
    app.get('/api/tasks/stats', async (req, res) => {
        try {
            const keys = await redisClient.keys('task:*');
            const stats = {
                total: 0,
                byStatus: { pending: 0, completed: 0 },
                byPriority: { high: 0, medium: 0, low: 0 },
                byCategory: {},
                overdue: 0,
                completedOnTime: 0,
                averageCompletionTime: 0
            };
    
            const completionTimes = [];
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task) {
                    stats.total++;
                    stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
                    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
                    stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    
                    const dueDate = new Date(task.dueDate);
                    const now = new Date();
    
                    if (task.status === 'completed' && task.updatedAt) {
                        const completionDate = new Date(task.updatedAt);
                        const completionTime = completionDate - new Date(task.createdAt);
                        completionTimes.push(completionTime);
    
                        if (dueDate >= completionDate) {
                            stats.completedOnTime++;
                        }
                    } else if (task.status === 'pending' && dueDate < now) {
                        stats.overdue++;
                    }
                }
            }
    
            // Calculate average completion time
            if (completionTimes.length > 0) {
                stats.averageCompletionTime = Math.floor(
                    completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / (1000 * 60 * 60)
                ); // Convert to hours
            }
    
            res.json({
                stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Task Stats Error:', error);
            res.status(500).json({ error: 'Failed to get task statistics' });
        }
    });

    async setReminderFromTemplate(taskId, templateName, customMessage = null, customInterval = null) {
        try {
            const template = reminderTemplates[templateName];
            if (!template) {
                throw new Error('Invalid template name');
            }

            const taskKey = `task:${taskId}`;
            const reminderKey = `reminder:${taskId}`;
            const task = await this.get(taskKey);

            if (task) {
                const now = new Date();
                const reminderTime = new Date(now.getTime() + 
                    (customInterval || template.defaultInterval) * 1000);

                await redisClient.setEx(reminderKey,
                    customInterval || template.defaultInterval,
                    JSON.stringify({
                        taskId,
                        taskTitle: task.title,
                        templateName,
                        message: customMessage || template.message,
                        reminderTime: reminderTime.toISOString(),
                        notified: false,
                        performanceTracked: false
                    })
                );

                // Track template usage and initial performance
                await this.trackTemplateUsage(templateName, taskId);
                await this.updateTemplatePerformance(templateName, taskId, true);
            }
        } catch (error) {
            console.error('Template Reminder Set Error:', error);
        }
    }
};

// Add template endpoint
app.post('/api/tasks/:taskId/reminder/template', async (req, res) => {
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

// Add template stats endpoint
app.get('/api/templates/stats/:templateName?', async (req, res) => {
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
};

// Add template report endpoints
app.get('/api/templates/reports/:templateName?', async (req, res) => {
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

// Add performance metrics endpoint
app.get('/api/templates/performance/:templateName?', async (req, res) => {
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

// Add to cacheManager
const cacheManager = {
    async set(key, value, expireTime = 3600, compressionLevel = 'BALANCED') {
        try {
            const stringValue = JSON.stringify(value);
            const options = compressionLevels[compressionLevel] || compressionLevels.BALANCED;
            const compressed = await util.promisify(zlib.gzip)(stringValue, options);
            await redisClient.setEx(key, expireTime, compressed.toString('base64'));
        } catch (error) {
            console.error('Cache Set Error:', error);
        }
    },
    
    async get(key) {
        try {
            const compressed = await redisClient.get(key);
            if (!compressed) return null;
            
            const buffer = Buffer.from(compressed, 'base64');
            const decompressed = await decompress(buffer);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    },
    
    async delete(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Cache Delete Error:', error);
        }
    },

    async cleanup() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const now = Date.now();
            
            for (const key of keys) {
                const ttl = await redisClient.ttl(key);
                if (ttl < 0 || ttl > 86400) { // Remove expired or >24h old entries
                    await this.delete(key);
                }
            }
        } catch (error) {
            console.error('Cache Cleanup Error:', error);
        }
    },

    // Fix the missing comma after getStats method
    async getStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            return {
                totalEntries: keys.length,
                prefix: 'image_analysis'
            };
        } catch (error) {
            console.error('Cache Stats Error:', error);
            return { totalEntries: 0, prefix: 'image_analysis' };
        }
    },  // Added comma here

    async getCompressionStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const stats = {
                totalOriginal: 0,
                totalCompressed: 0,
                compressionRatio: 0,
                compressionSpeed: 0
            };

            for (const key of keys) {
                const compressed = await redisClient.get(key);
                if (compressed) {
                    const startTime = process.hrtime();
                    const buffer = Buffer.from(compressed, 'base64');
                    const decompressed = await decompress(buffer);
                    const [seconds, nanoseconds] = process.hrtime(startTime);
                    
                    stats.totalOriginal += decompressed.length;
                    stats.totalCompressed += buffer.length;
                    stats.compressionSpeed += seconds * 1000 + nanoseconds / 1e6;
                }
            }

            stats.compressionRatio = stats.totalOriginal ? 
                (stats.totalCompressed / stats.totalOriginal).toFixed(2) : 0;
            stats.compressionSpeed = (stats.compressionSpeed / keys.length).toFixed(2);

            return stats;
        } catch (error) {
            console.error('Compression Stats Error:', error);
            return { 
                totalOriginal: 0, 
                totalCompressed: 0, 
                compressionRatio: 0,
                compressionSpeed: 0 
            };
        }
    }
};

// Update stats logging to include compression info
setInterval(() => {
    Promise.all([
        cacheManager.cleanup(),
        cacheManager.getStats(),
        cacheManager.getCompressionStats()
    ]).then(([_, stats, compressionStats]) => {
        console.log('Cache Stats:', { ...stats, ...compressionStats });
    });
}, 6 * 60 * 60 * 1000);

// Schedule cache cleanup every 6 hours
setInterval(() => {
    cacheManager.cleanup();
    cacheManager.getStats().then(stats => {
        console.log('Cache Stats:', stats);
    });
}, 6 * 60 * 60 * 1000);

// Connect to Redis
redisClient.connect().catch(console.error);

app.post('/api/analyze/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Generate cache key from image buffer
        const cacheKey = `image_analysis:${Buffer.from(req.file.buffer).toString('base64').slice(0, 32)}`;
        
        // Check cache
        const cachedResult = await cacheManager.get(cacheKey);
        if (cachedResult) {
            return res.json({
                data: {
                    content: cachedResult,
                    cached: true
                }
            });
        }

        // Validate file type
        const fileType = await fileTypeFromBuffer(req.file.buffer);
        if (!fileType || !['image/jpeg', 'image/png', 'image/webp'].includes(fileType.mime)) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        // Process image
        const processedImage = await sharp(req.file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg')
            .toBuffer();

        // Convert to base64 for OpenAI API
        const base64Image = processedImage.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "system",
                    content: "You are a health and wellness assistant analyzing images for VitalHarvest."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What can you tell me about this image in terms of health and wellness?" },
                        { type: "image_url", url: imageUrl }
                    ]
                }
            ],
            max_tokens: 150
        });

        res.json({
            data: {
                content: response.choices[0].message.content
            }
        });
    } catch (error) {
        console.error('Image Analysis Error:', error);
        res.status(500).json({ error: 'Image analysis failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Add task routes before the PORT declaration
    app.post('/api/tasks', async (req, res) => {
        try {
            const { title, description, dueDate, category, priority } = req.body;
            
            if (!title || !description) {
                return res.status(400).json({ error: 'Title and description are required' });
            }

            const taskKey = `task:${Date.now()}`;
            await cacheManager.set(taskKey, {
                title,
                description,
                dueDate,
                category: category || 'general',
                priority: priority || 'medium', // Added priority field
                status: 'pending',
                createdAt: new Date().toISOString()
            }, 86400);

            res.json({
                success: true,
                message: 'Task created successfully',
                taskId: taskKey.split(':')[1]
            });
        } catch (error) {
            console.error('Task Creation Error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    });

    app.put('/api/tasks/:taskId', async (req, res) => {
        try {
            const { taskId } = req.params;
            const { status, title, description, dueDate, category, priority } = req.body;
            const taskKey = `task:${taskId}`;
            
            const task = await cacheManager.get(taskKey);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const updatedTask = {
                ...task,
                title: title || task.title,
                description: description || task.description,
                dueDate: dueDate || task.dueDate,
                category: category || task.category,
                priority: priority || task.priority, // Added priority update
                status: status || task.status,
                updatedAt: new Date().toISOString()
            };

            await cacheManager.set(taskKey, updatedTask, 86400);
            res.json({
                success: true,
                message: 'Task updated successfully',
                task: updatedTask
            });
        } catch (error) {
            console.error('Task Update Error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    });

    // Add new search endpoint after existing task routes
    app.get('/api/tasks/search', async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }
    
            const keys = await redisClient.keys('task:*');
            const tasks = [];
            const searchTerm = query.toLowerCase();
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && (
                    task.title.toLowerCase().includes(searchTerm) ||
                    task.description.toLowerCase().includes(searchTerm) ||
                    task.category.toLowerCase().includes(searchTerm)
                )) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }
    
            // Sort by relevance and priority
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.priority] || 2;
                const bPriority = priorityOrder[b.priority] || 2;
                
                // First sort by exact title match
                const aExactMatch = a.title.toLowerCase() === searchTerm;
                const bExactMatch = b.title.toLowerCase() === searchTerm;
                if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
                
                // Then by priority
                if (aPriority !== bPriority) return bPriority - aPriority;
                
                // Finally by date
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    
            res.json({
                results: tasks,
                total: tasks.length
            });
        } catch (error) {
            console.error('Task Search Error:', error);
            res.status(500).json({ error: 'Failed to search tasks' });
        }
    });

    app.get('/api/tasks', async (req, res) => {
        try {
            const { status, category, priority, sortBy = 'createdAt' } = req.query;
            const keys = await redisClient.keys('task:*');
            const tasks = [];

            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task && 
                    (!status || task.status === status) &&
                    (!category || task.category === category) &&
                    (!priority || task.priority === priority)) {
                    tasks.push({ ...task, id: key.split(':')[1] });
                }
            }

            // Sort tasks by priority and date
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (sortBy === 'priority') {
                    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                }
                return new Date(b[sortBy]) - new Date(a[sortBy]);
            });

            const groupedTasks = tasks.reduce((acc, task) => {
                const category = task.category || 'general';
                if (!acc[category]) {
                    acc[category] = {
                        pending: [],
                        completed: []
                    };
                }
                acc[category][task.status].push(task);
                return acc;
            }, {});

            res.json(groupedTasks);
        } catch (error) {
            console.error('Task Fetch Error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    });
1

    // Add new statistics endpoint after search endpoint
    app.get('/api/tasks/stats', async (req, res) => {
        try {
            const keys = await redisClient.keys('task:*');
            const stats = {
                total: 0,
                byStatus: { pending: 0, completed: 0 },
                byPriority: { high: 0, medium: 0, low: 0 },
                byCategory: {},
                overdue: 0,
                completedOnTime: 0,
                averageCompletionTime: 0
            };
    
            const completionTimes = [];
    
            for (const key of keys) {
                const task = await cacheManager.get(key);
                if (task) {
                    stats.total++;
                    stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
                    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
                    stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    
                    const dueDate = new Date(task.dueDate);
                    const now = new Date();
    
                    if (task.status === 'completed' && task.updatedAt) {
                        const completionDate = new Date(task.updatedAt);
                        const completionTime = completionDate - new Date(task.createdAt);
                        completionTimes.push(completionTime);
    
                        if (dueDate >= completionDate) {
                            stats.completedOnTime++;
                        }
                    } else if (task.status === 'pending' && dueDate < now) {
                        stats.overdue++;
                    }
                }
            }
    
            // Calculate average completion time
            if (completionTimes.length > 0) {
                stats.averageCompletionTime = Math.floor(
                    completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / (1000 * 60 * 60)
                ); // Convert to hours
            }
    
            res.json({
                stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Task Stats Error:', error);
            res.status(500).json({ error: 'Failed to get task statistics' });
        }
    });

    async setReminderFromTemplate(taskId, templateName, customMessage = null, customInterval = null) {
        try {
            const template = reminderTemplates[templateName];
            if (!template) {
                throw new Error('Invalid template name');
            }

            const taskKey = `task:${taskId}`;
            const reminderKey = `reminder:${taskId}`;
            const task = await this.get(taskKey);

            if (task) {
                const now = new Date();
                const reminderTime = new Date(now.getTime() + 
                    (customInterval || template.defaultInterval) * 1000);

                await redisClient.setEx(reminderKey,
                    customInterval || template.defaultInterval,
                    JSON.stringify({
                        taskId,
                        taskTitle: task.title,
                        templateName,
                        message: customMessage || template.message,
                        reminderTime: reminderTime.toISOString(),
                        notified: false,
                        performanceTracked: false
                    })
                );

                // Track template usage and initial performance
                await this.trackTemplateUsage(templateName, taskId);
                await this.updateTemplatePerformance(templateName, taskId, true);
            }
        } catch (error) {
            console.error('Template Reminder Set Error:', error);
        }
    }
};

// Add template endpoint
app.post('/api/tasks/:taskId/reminder/template', async (req, res) => {
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

// Add template stats endpoint
app.get('/api/templates/stats/:templateName?', async (req, res) => {
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
};

// Add template report endpoints
app.get('/api/templates/reports/:templateName?', async (req, res) => {
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

// Add performance metrics endpoint
app.get('/api/templates/performance/:templateName?', async (req, res) => {
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

// Add to cacheManager
const cacheManager = {
    async set(key, value, expireTime = 3600, compressionLevel = 'BALANCED') {
        try {
            const stringValue = JSON.stringify(value);
            const options = compressionLevels[compressionLevel] || compressionLevels.BALANCED;
            const compressed = await util.promisify(zlib.gzip)(stringValue, options);
            await redisClient.setEx(key, expireTime, compressed.toString('base64'));
        } catch (error) {
            console.error('Cache Set Error:', error);
        }
    },
    
    async get(key) {
        try {
            const compressed = await redisClient.get(key);
            if (!compressed) return null;
            
            const buffer = Buffer.from(compressed, 'base64');
            const decompressed = await decompress(buffer);
            return JSON.parse(decompressed.toString());
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    },
    
    async delete(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Cache Delete Error:', error);
        }
    },

    async cleanup() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const now = Date.now();
            
            for (const key of keys) {
                const ttl = await redisClient.ttl(key);
                if (ttl < 0 || ttl > 86400) { // Remove expired or >24h old entries
                    await this.delete(key);
                }
            }
        } catch (error) {
            console.error('Cache Cleanup Error:', error);
        }
    },

    // Fix the missing comma after getStats method
    async getStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            return {
                totalEntries: keys.length,
                prefix: 'image_analysis'
            };
        } catch (error) {
            console.error('Cache Stats Error:', error);
            return { totalEntries: 0, prefix: 'image_analysis' };
        }
    },  // Added comma here

    async getCompressionStats() {
        try {
            const keys = await redisClient.keys('image_analysis:*');
            const stats = {
                totalOriginal: 0,
                totalCompressed: 0,
                compressionRatio: 0,
                compressionSpeed: 0
            };

            for (const key of keys) {
                const compressed = await redisClient.get(key);
                if (compressed) {
                    const startTime = process.hrtime();
                    const buffer = Buffer.from(compressed, 'base64');
                    const decompressed = await decompress(buffer);
                    const [seconds, nanoseconds] = process.hrtime(startTime);
                    
                    stats.totalOriginal += decompressed.length;
                    stats.totalCompressed += buffer.length;
                    stats.compressionSpeed += seconds * 1000 + nanoseconds / 1e6;
                }
            }

            stats.compressionRatio = stats.totalOriginal ? 
                (stats.totalCompressed / stats.totalOriginal).toFixed(2) : 0;
            stats.compressionSpeed = (stats.compressionSpeed / keys.length).toFixed(2);

            return stats;
        } catch (error) {
            console.error('Compression Stats Error:', error);
            return { 
                totalOriginal: 0, 
                totalCompressed: 0, 
                compressionRatio: 0,
                compressionSpeed: