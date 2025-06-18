const { createClient } = require('redis');
const { logger } = require('../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // Default TTL: 1 hour
    this.init();
  }

  /**
   * Initialize Redis client
   */
  async init() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
      });

      // Set event handlers
      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      this.client.on('end', () => {
        logger.info('Redis client connection closed');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      
    } catch (error) {
      logger.error('Failed to initialize Redis client', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      this.isConnected = false;
      // Don't throw - allow service to work without cache
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null if not found
   */
  async get(key) {
    try {
      if (!this.client || !this.isConnected) {
        return null;
      }

      const value = await this.client.get(key);
      return value;
    } catch (error) {
      logger.error('Error getting value from cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success indicator
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.set(key, value, { EX: ttl });
      return result === 'OK';
    } catch (error) {
      logger.error('Error setting value in cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key to delete
   * @returns {Promise<boolean>} - Success indicator
   */
  async delete(key) {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Error deleting key from cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Set cache with JSON value
   * @param {string} key - Cache key
   * @param {Object} value - Object to cache 
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success indicator
   */
  async setJSON(key, value, ttl = this.defaultTTL) {
    try {
      return await this.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      logger.error('Error setting JSON in cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get JSON value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached object or null
   */
  async getJSON(key) {
    try {
      const value = await this.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Error getting JSON from cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key to check
   * @returns {Promise<boolean>} - True if key exists
   */
  async exists(key) {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking key existence in cache', { 
        key, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Set expiration time on key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success indicator
   */
  async expire(key, ttl) {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Error setting expiration on key', { 
        key, 
        ttl,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} - Success indicator
   */
  async clear() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      await this.client.flushDb();
      return true;
    } catch (error) {
      logger.error('Error clearing cache', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get cache status
   * @returns {Promise<Object>} - Cache status information
   */
  async getStatus() {
    try {
      if (!this.client || !this.isConnected) {
        return {
          connected: false,
          status: 'disconnected',
        };
      }

      const info = await this.client.info();
      const memory = await this.client.info('memory');
      const stats = await this.client.info('stats');
      
      return {
        connected: this.isConnected,
        status: 'connected',
        info: {
          memory,
          stats,
        }
      };
    } catch (error) {
      logger.error('Error getting cache status', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return {
        connected: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client connection closed');
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = { cacheService };