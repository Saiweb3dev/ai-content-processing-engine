const { StatusCodes } = require('http-status-codes');
const { logger } = require('../config/logger');

/**
 * Middleware to handle 404 Not Found errors
 * This is called when no routes match the requested URL
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
  const path = `${req.method} ${req.originalUrl}`;
  
  logger.warn(`Route not found: ${path}`);
  
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    error: 'Not Found',
    statusCode: StatusCodes.NOT_FOUND,
    path
  });
};

module.exports = { notFound };