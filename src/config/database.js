const {Pool} = require('pg');
const logger = require('./logger').logger;

const config = {
    pool: null,

    // Database configuration
    dbConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432' ,10),
        database: process.env.DB_NAME || 'ai_content_processing',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
    },

    connectDB: async function() {
        try {
            this.pool = new Pool(this.dbConfig);
            // Testing DB Connection
            const client = await this.pool.connect();
            client.release();
            logger.info('PostgreSQL database connected successfully');
            return this.pool
        } catch (error) {
            logger.error("Failed to connect to PostgreSQL database:", err)
            throw err;
        }
    },

      // Get database connection pool
  getPool: function() {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }
    return this.pool;
  },
  
  // Close database connection
  closeDb: async function() {
    if (this.pool) {
      await this.pool.end();
      logger.info('PostgreSQL database connection closed');
    }
  }
}

module.exports = { config };