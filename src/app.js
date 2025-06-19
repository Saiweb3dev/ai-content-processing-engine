const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require('compression');
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require('express-async-errors');
const promBundle = require('express-prom-bundle');
require("dotenv").config();

const { config } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./config/logger');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

// Import routes
// const authRoutes = require('./routes/auth.routes');
// const contentRoutes = require('./routes/content.routes');
const aiRoutes = require('./routes/ai.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { notFound } = require('./middleware/notFound.middleware');

class App {
  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3000", 10);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeDatabase();
  }

  initializeMiddleware() {

  // Parse JSON bodies
  this.app.use(express.json({ limit: '10mb' }));
  // Parse URL-encoded bodies
  this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );
    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || [
          "http://localhost:3000",
        ],
        credentials: true,
        optionsSuccessStatus: 200,
      })
    );

    //Compressopm middleware
    this.app.use(compression());

    //Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === "production" ? 100 : 1000,
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    //Prometheus metrics
    const metricsMiddleware = promBundle({
      includeMethods: true,
      includePath: true,
      includeStatusCode: true,
      includeUp: true,
      customLabels: {
        project_name: "ai-content-processor-engine",
        project_version: process.env.npm_package_version || "1.0.0",
      },
      promClient: {
        collectionDefaultMetrics: {
          timeout: 1000,
        },
      },
    });
    this.app.use(metricsMiddleware);

    // Logging middleware
    const morganFormat =
      process.env.NODE_ENV === "production" ? "combined" : "dev";

    this.app.use(
      morgan(morganFormat, {
        stream: {
          write: (message) => {
            logger.info(message.trim());
          },
        },
      })
    );

    // Trust proxy for rate limiting and IP detection
    this.app.set("trust proxy", 1);
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
        res.status(200).json({
          status: "OK",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || "1.0.0",
        });
      });

    // API Documentation
    this.app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // API routes
    // this.app.use("/api/auth", authRoutes);
    // this.app.use("/api/content", contentRoutes);
    this.app.use("/api/ai", aiRoutes);

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        message: "AI Content Processing Service",
        version: process.env.npm_package_version || "1.0.0",
        documentation: "/api-docs",
        health: "/health",
      });
    });
  }

  initializeErrorHandling() {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  async initializeDatabase() {
    try {
      await config.connectDB();
      await connectRedis();
      logger.info("Database connections established");
    } catch (error) {
      logger.error("Database connection failed", error);
      process.exit(1);
    }
  }

  listen() {
    this.app.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
      logger.info(
        `📚 API Documentation: http://localhost:${this.port}/api-docs`
      );
      logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
    });
  }
  getApp() {
    return this.app;
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Unhandled promise rejection handler
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Uncaught exception handler
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  const app = new App();
  app.listen();
}

module.exports = App;
