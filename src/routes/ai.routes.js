const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
// const { authMiddleware } = require('../middleware/auth.middleware');
// const { validateRequest } = require('../middleware/validation.middleware');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI processing endpoints for content transformation and analysis
 */

/**
 * @swagger
 * /api/ai/process:
 *   post:
 *     summary: Process content using AI
 *     description: Send a single piece of content for AI processing based on the specified type
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             summarize:
 *               summary: Summarize text content
 *               value:
 *                 type: summarize
 *                 content: "Climate change is the long-term alteration of temperature and typical weather patterns. The cause of current climate change is largely human activity, like burning fossil fuels, which adds heat-trapping gases to Earth's atmosphere."
 *                 options:
 *                   maxLength: 50
 *                   style: "concise"
 *             sentiment:
 *               summary: Analyze sentiment of text
 *               value:
 *                 type: analyze-sentiment
 *                 content: "I absolutely love this new AI service! It's incredibly fast and accurate."
 *             keywords:
 *               summary: Extract keywords from text
 *               value:
 *                 type: extract-keywords
 *                 content: "Artificial intelligence and machine learning are transforming industries from healthcare to finance, enabling automation of complex tasks and data-driven decision making."
 *             generate:
 *               summary: Generate content from prompt
 *               value:
 *                 type: generate-content
 *                 content: "Write a short blog introduction about sustainable technology"
 *                 options:
 *                   style: "professional"
 *                   temperature: 0.7
 *                   maxTokens: 200
 *             translate:
 *               summary: Translate text to another language
 *               value:
 *                 type: translate
 *                 content: "Hello world! How are you today?"
 *                 options:
 *                   targetLanguage: "Spanish"
 *                   preserveFormatting: true
 *     responses:
 *       200:
 *         description: Content processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   enum: [summarize, analyze-sentiment, extract-keywords, generate-content, translate]
 *                 result:
 *                   type: object
 *                 processingTime:
 *                   type: number
 *             examples:
 *               summarize:
 *                 summary: Summarized text result
 *                 value:
 *                   type: summarize
 *                   result:
 *                     summary: "Climate change is human-caused temperature change resulting from fossil fuels and greenhouse gases."
 *                     originalLength: 215
 *                     summaryLength: 89
 *                     compressionRatio: 2.42
 *                   processingTime: 1687152734523
 *               sentiment:
 *                 summary: Sentiment analysis result
 *                 value:
 *                   type: analyze-sentiment
 *                   result:
 *                     sentiment: "positive"
 *                     confidence: 9.2
 *                     emotionalIndicators: ["love", "fast", "accurate"]
 *                     explanation: "Strong positive sentiment expressed through enthusiastic language and exclamation marks."
 *                   processingTime: 1687152734523
 *               keywords:
 *                 summary: Extracted keywords result
 *                 value:
 *                   type: extract-keywords
 *                   result:
 *                     keywords: [
 *                       {"keyword": "artificial intelligence", "relevance": 9.5},
 *                       {"keyword": "machine learning", "relevance": 9.2},
 *                       {"keyword": "industries", "relevance": 7.8},
 *                       {"keyword": "healthcare", "relevance": 7.5},
 *                       {"keyword": "finance", "relevance": 7.5},
 *                       {"keyword": "automation", "relevance": 8.1},
 *                       {"keyword": "data-driven decision making", "relevance": 8.7}
 *                     ]
 *                   processingTime: 1687152734524
 *               generate:
 *                 summary: Generated content result
 *                 value:
 *                   type: generate-content
 *                   result:
 *                     content: "# Sustainable Technology: Building a Greener Future\n\nIn today's rapidly evolving technological landscape, sustainability has emerged as not just a buzzword but a necessary paradigm shift. Sustainable technology represents the intersection of innovation and environmental responsibility, offering solutions that meet present needs without compromising future generations' ability to meet theirs."
 *                     wordCount: 42
 *                   processingTime: 1687152734525
 *               translate:
 *                 summary: Translated text result
 *                 value:
 *                   type: translate
 *                   result:
 *                     originalText: "Hello world! How are you today?"
 *                     translatedText: "¡Hola mundo! ¿Cómo estás hoy?"
 *                     sourceLanguage: "auto-detected"
 *                     targetLanguage: "Spanish"
 *                   processingTime: 1687152734526
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post('/process', aiController.processContent);

/**
 * @swagger
 * /api/ai/batch:
 *   post:
 *     summary: Batch process multiple content items
 *     description: Process multiple content items in a single request to improve efficiency
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchRequest'
 *     responses:
 *       200:
 *         description: Contents processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   result:
 *                     type: object
 *                   processingTime:
 *                     type: number
 *             example:
 *               - type: summarize
 *                 result:
 *                   summary: "Climate change is human-caused temperature change."
 *                   originalLength: 215
 *                   summaryLength: 45
 *                   compressionRatio: 4.78
 *                 processingTime: 1687152734001
 *               - type: analyze-sentiment
 *                 result:
 *                   sentiment: "positive"
 *                   confidence: 9.5
 *                   emotionalIndicators: ["love", "fast", "accurate"]
 *                   explanation: "Strong positive sentiment with enthusiasm."
 *                 processingTime: 1687152734002
 *               - type: translate
 *                 result:
 *                   originalText: "Hello world! How are you today?"
 *                   translatedText: "Bonjour le monde! Comment allez-vous aujourd'hui?"
 *                   sourceLanguage: "auto-detected"
 *                   targetLanguage: "French"
 *                 processingTime: 1687152734003
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post('/batch', aiController.batchProcess);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status
 *     description: Check the health and status of the underlying AI services
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Service status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceStatus'
 *       500:
 *         description: Server error
 */
router.get('/status', aiController.getServiceStatus);

module.exports = router;