const { StatusCodes } = require('http-status-codes');
const { logger } = require('../config/logger');

/**
 * Global error handler middleware
 * Catches all errors thrown in routes and other middleware
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  const errorDetails = {
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    path: `${req.method} ${req.originalUrl}`,
    params: req.params,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    userId: req.user?.id
  };
  
  logger.error('Application error:', errorDetails);
  
  // Determine status code
  const statusCode = err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  
  // Prepare error response
  const errorResponse = {
    success: false,
    message: err.message || 'An unexpected error occurred',
    error: err.name || 'ServerError',
    statusCode,
    path: `${req.method} ${req.originalUrl}`
  };
  
  // Add validation errors if available
  if (err.errors) {
    errorResponse.errors = err.errors;
  }
  
  // Add request ID if available for tracking
  if (req.id) {
    errorResponse.requestId = req.id;
  }
  
  // Special handling for known error types
  if (err.code === 'ECONNREFUSED') {
    errorResponse.message = 'Database connection failed';
    errorResponse.error = 'DatabaseError';
  } else if (err.name === 'ValidationError') {
    errorResponse.statusCode = StatusCodes.BAD_REQUEST;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    errorResponse.statusCode = StatusCodes.UNAUTHORIZED;
    errorResponse.message = 'Invalid or expired token';
    errorResponse.error = 'AuthenticationError';
  }
  
  // Send error response
  res.status(errorResponse.statusCode).json(errorResponse);
};

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode, errors = []) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
  
  static badRequest(message = 'Bad Request', errors = []) {
    return new APIError(message, StatusCodes.BAD_REQUEST, errors);
  }
  
  static unauthorized(message = 'Unauthorized', errors = []) {
    return new APIError(message, StatusCodes.UNAUTHORIZED, errors);
  }
  
  static forbidden(message = 'Forbidden', errors = []) {
    return new APIError(message, StatusCodes.FORBIDDEN, errors);
  }
  
  static notFound(message = 'Resource not found', errors = []) {
    return new APIError(message, StatusCodes.NOT_FOUND, errors);
  }
  
  static internal(message = 'Internal Server Error', errors = []) {
    return new APIError(message, StatusCodes.INTERNAL_SERVER_ERROR, errors);
  }
  
  static serviceUnavailable(message = 'Service Unavailable', errors = []) {
    return new APIError(message, StatusCodes.SERVICE_UNAVAILABLE, errors);
  }
}

module.exports = { errorHandler, APIError };