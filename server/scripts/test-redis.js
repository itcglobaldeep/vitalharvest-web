const Redis = require('ioredis');

const redis = new Redis({
    host: 'localhost',
    port: 6379
});

async function testConnection() {
    try {
        await redis.set('test', 'Hello Redis');
        const value = await redis.get('test');
        console.log('Redis Test Result:', value);
        console.log('Redis Connection: Success');
    } catch (error) {
        console.error('Redis Connection Error:', error);
    } finally {
        redis.quit();
    }
}

testConnection();