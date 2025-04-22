const zlib = require('zlib');
const util = require('util');
const decompress = util.promisify(zlib.gunzip);

const compressionLevels = {
    HIGH: { level: 9 },
    BALANCED: { level: 6 },
    FAST: { level: 1 }
};

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

                await this.trackTemplateUsage(templateName, taskId);
                await this.updateTemplatePerformance(templateName, taskId, true);
            }
        } catch (error) {
            console.error('Template Reminder Set Error:', error);
        }
    },

    async getTemplateStats(templateName) {
        try {
            const key = templateName ? 
                `template_stats:${templateName}` : 
                'template_stats:*';
            
            const stats = await this.get(key);
            return stats || {
                usage: 0,
                successRate: 0,
                lastUsed: null
            };
        } catch (error) {
            console.error('Template Stats Error:', error);
            return null;
        }
    },

    async generateTemplateReport(templateName, timeRange = '24h') {
        try {
            const key = `template_report:${templateName}:${timeRange}`;
            let report = await this.get(key);
            
            if (!report) {
                report = {
                    templateName,
                    timeRange,
                    usage: 0,
                    effectiveness: 0,
                    generatedAt: new Date().toISOString()
                };
                await this.set(key, report, 3600);
            }
            
            return report;
        } catch (error) {
            console.error('Template Report Error:', error);
            return null;
        }
    },

    async trackTemplateUsage(templateName, taskId) {
        try {
            const key = `template_usage:${templateName}`;
            const usage = await this.get(key) || { count: 0, tasks: [] };
            
            usage.count++;
            usage.tasks.push(taskId);
            usage.lastUsed = new Date().toISOString();
            
            await this.set(key, usage, 86400);
        } catch (error) {
            console.error('Template Usage Track Error:', error);
        }
    },

    async updateTemplatePerformance(templateName, taskId, success) {
        try {
            const key = `template_performance:${templateName}`;
            const performance = await this.get(key) || {
                totalUsage: 0,
                successCount: 0,
                failureCount: 0
            };
            
            performance.totalUsage++;
            if (success) {
                performance.successCount++;
            } else {
                performance.failureCount++;
            }
            
            await this.set(key, performance, 86400);
        } catch (error) {
            console.error('Template Performance Update Error:', error);
        }
    }
};

module.exports = cacheManager;