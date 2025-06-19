const { logger } = require("../config/logger");
const { cacheService } = require("./cache.service");
const { formatResponse } = require("../utils/ai.utils");
class AIService {
  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE AI environment variable is required");
    }

    this.cacheTimeout = 3600; // 1 hour cache
    this.modelName = process.env.GOOGLE_MODEL || "gemini-1.5-pro";
    this.initialized = false;

    // Initialize the client asynchronously
    this.init();
  }

  /**
   * Initialize Google GenAI client
   */
  async init() {
    try {
      // Dynamic import of Google GenAI
      const { GoogleGenAI } = await import("@google/genai");
      this.googleGenAI = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });
      this.model = this.googleGenAI.models;
      this.initialized = true;
      logger.info("Google GenAI client initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Google GenAI client", {
        error: error.message,
      });
      this.initialized = false;
    }
  }

  /**
   * Ensure the client is initialized before using
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
      if (!this.initialized) {
        throw new Error("Failed to initialize Google GenAI client");
      }
    }
  }

  /**
   * Process text content using AI
   * @param {Object} request - Processing request object
   * @param {string} request.type - Type of processing (summarize, analyze-sentiment, etc.)
   * @param {string} request.content - Content to process
   * @param {Object} request.options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processContent(request) {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    try {
      // Check cache first
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        logger.info("AI processing result served from cache", {
          processingType: request.type,
          contentLength: request.content.length,
          cacheHit: true,
        });
        return JSON.parse(cachedResult);
      }

      let result;

      switch (request.type) {
        case "summarize":
          result = await this.summarizeText(request.content, request.options);
          break;
        case "analyze-sentiment":
          result = await this.analyzeSentiment(request.content);
          break;
        case "extract-keywords":
          result = await this.extractKeywords(request.content);
          break;
        case "generate-content":
          result = await this.generateContent(request.content, request.options);
          break;
        case "translate":
          result = await this.translateText(request.content, request.options);
          break;
        default:
          throw new Error(`Unsupported AI processing type: ${request.type}`);
      }

      // Cache the result
      await cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.cacheTimeout
      );

      const processingTime = Date.now() - startTime;
      logger.info("AI processing completed", {
        processingType: request.type,
        contentLength: request.content.length,
        processingTime,
        tokensUsed: result.tokensUsed,
      });

      return result;
    } catch (error) {
      logger.error("AI processing failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        processingType: request.type,
        contentLength: request.content.length,
      });
      throw error;
    }
  }

  /**
   * Summarize text content
   * @param {string} content - Text to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<Object>} Summarization result
   */
  async summarizeText(content, options = {}) {
    const maxLength = options.maxLength || 150;
    const style = options.style || "concise";

    const prompt = `You are an expert content summarizer. Create ${style} summaries that capture the key points and main ideas. Keep summaries under ${maxLength} words.

     Content to summarize:
     ${content}`;

    const response = await this.model.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const summary = response.text;

    return {
      type: "summarize",
      result: {
        summary,
        originalLength: content.length,
        summaryLength: summary.length,
        compressionRatio: content.length / summary.length,
      },
      processingTime: Date.now(),
    };
  }

  /**
   * Analyze sentiment of text
   * @param {string} content - Text to analyze
   * @returns {Promise<Object>} Sentiment analysis result
   */
  async analyzeSentiment(content) {
    await this.ensureInitialized();

    const prompt = `You are a sentiment analysis expert. Analyze the sentiment of the given text and provide:
  1. Overall sentiment (positive, negative, neutral)
  2. Confidence score (0-10)
  3. Key emotional indicators
  4. Brief explanation

  Respond in JSON format only

  Text to analyze:
  ${content}.`;

    try {
      const response = await this.model.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const result = formatResponse(response.text);

      return {
        type: "analyze-sentiment",
        result: result,
        processingTime: Date.now(),
      };
    } catch (error) {
      logger.error("Sentiment analysis failed", { error: error.message });
      throw error;
    }
  }

  async extractKeywords(content) {
    const prompt = `Extract the most important keywords and key phrases from the given text. Return a JSON array of keywords with their relevance scores (0-10). Focus on nouns, important adjectives, and key concepts.
    Text to analyze:
    ${content}`;

    const result = await this.model.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const response = formatResponse(result.text);

    let keywords;

    try {
      keywords = JSON.parse(response);
    } catch {
      keywords = [];
    }

    return {
      type: "extract-keywords",
      result: { response },
      processingTime: Date.now(),
    };
  }

  /**
   * Generate content based on prompt
   */
  async generateContent(prompt, options) {
    const style = options?.style || "professional";

    const systemPrompt = `You are a professional content creator. Generate high-quality, ${style} content based on the user's request. Ensure the content is engaging, well-structured, and appropriate for the intended audience.

     User request:
     ${prompt}`;

    const generationConfig = {
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.maxTokens || 1024,
    };
    const result = await this.model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig,
    });

    console.log(result);

    const generatedContent = result.text;

    return {
      type: "generate-content",
      result: {
        content: generatedContent,
        wordCount: generatedContent.split(/\s+/).length,
      },
      processingTime: Date.now(),
    };
  }

  /**
   * Translate text to target language
   */
  async translateText(content, options) {
    const targetLanguage = options?.targetLanguage || "Spanish";
    const preserveFormatting = options?.preserveFormatting || true;

    const prompt = `You are a professional translator. Translate the given text to ${targetLanguage}. ${
      preserveFormatting
        ? "Preserve the original formatting and structure."
        : ""
    } Ensure accuracy and natural flow in the target language.

    Text to translate:
    ${content}`;

    const result = await this.model.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const translatedText = result.text;

    return {
      type: "translate",
      result: {
        originalText: content,
        translatedText,
        sourceLanguage: "auto-detected",
        targetLanguage,
      },
      processingTime: Date.now(),
    };
  }

  /**
   * Batch process multiple content items
   */
  async batchProcess(requests) {
    const batchSize = 5; // Process in batches to avoid rate limits
    const results = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map((request) =>
        this.processContent(request)
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        logger.error("Batch processing failed", {
          batchIndex: Math.floor(i / batchSize),
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return results;
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(request) {
    const hash = require("crypto")
      .createHash("md5")
      .update(JSON.stringify(request))
      .digest("hex");
    return `ai:${request.type}:${hash}`;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get AI service status and usage statistics
   */
  async getServiceStatus() {
    try {
      // This would typically check API quotas, rate limits, etc.
      return {
        status: "healthy",
        provider: "googleGenAI",
        model: process.env.GOOGLE_MODEL || "gemini-2.0-flash",
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        lastChecked: new Date().toISOString(),
      };
    }
  }
}

module.exports.aiService = new AIService();
