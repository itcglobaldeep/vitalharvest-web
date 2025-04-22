const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
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
            priority: priority || 'medium',
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

router.get('/', async (req, res) => {
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

router.put('/:taskId', async (req, res) => {
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
            priority: priority || task.priority,
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

router.get('/search', async (req, res) => {
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

        tasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            const aExactMatch = a.title.toLowerCase() === searchTerm;
            const bExactMatch = b.title.toLowerCase() === searchTerm;
            if (aExactMatch !== bExactMatch) return bExactMatch - aExactMatch;
            
            if (aPriority !== bPriority) return bPriority - aPriority;
            
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

router.get('/stats', async (req, res) => {
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

        if (completionTimes.length > 0) {
            stats.averageCompletionTime = Math.floor(
                completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / (1000 * 60 * 60)
            );
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

module.exports = router;