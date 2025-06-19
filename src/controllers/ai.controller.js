const { StatusCodes } = require("http-status-codes");
const { aiService } = require("../services/ai.service");
const { logger } = require("../config/logger");

class AIController {
  /**
   * Process content using AI
   */
  async processContent(req, res) {
    try {
      const { type, content, options } = req.body;

      if (!type || !content) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Type and content are required fields",
        });
      }

      const result = await aiService.processContent({
        type,
        content,
        options: options || {},
      });

      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      logger.error("Error in AI content processing", { error: error.message });

      if (error.message.includes("Unsupported AI processing type")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: error.message,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "AI processing failed",
        error: error.message,
      });
    }
  }

    /**
   * Batch process multiple content items
   */
  async batchProcess(req, res) {
    try {
      const { requests } = req.body;
      
      if (!requests || !Array.isArray(requests) || requests.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Valid requests array is required'
        });
      }
      
      // Validate each request
      for (const request of requests) {
        if (!request.type || !request.content) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Each request must include type and content'
          });
        }
      }
      
      const results = await aiService.batchProcess(requests);
      
      return res.status(StatusCodes.OK).json({
        results,
        count: results.length
      });
    } catch (error) {
      logger.error('Error in AI batch processing', { error: error.message });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'AI batch processing failed',
        error: error.message
      });
    }
  }

    /**
   * Get AI service status
   */
  async getServiceStatus(req, res) {
    try {
      const status = await aiService.getServiceStatus();
      return res.status(StatusCodes.OK).json(status);
    } catch (error) {
      logger.error('Error getting AI service status', { error: error.message });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to get AI service status',
        error: error.message
      });
    }
  }
}




module.exports = new AIController();