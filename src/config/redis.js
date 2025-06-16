const redis = require('redis');
const logger = require('./logger').logger;

let redisClient = null;

/** 
* Connect to Redis
* @returns {Promise<Object>} Redis client instance
*/
const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        redisClient = redis.createClient({
            url: redisUrl
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client error:', err)
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        })

        redisClient.on('reconnecting', () => {
            logger.info('Redis client reconnecting');
        });

        return redisClient;
    } catch (error) {
        logger.error('Redis connection failed:', error);
        throw error;
    }
};

/** 
 * Get Redis client instance
 * @returns {Object} Redis client
 */
const getRedisClient = () => {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis connection not initialzed");
    }
    return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Redis connection closed')
    }
};

module.exports = {
    connectRedis,
    getRedisClient,
    closeRedis
};