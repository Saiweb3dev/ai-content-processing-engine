const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
// const { authMiddleware } = require('../middleware/auth.middleware');
// const { validateRequest } = require('../middleware/validation.middleware');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI processing endpoints
 */

/**
 * @swagger
 * /api/ai/process:
 *   post:
 *     summary: Process content using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [summarize, analyze-sentiment, extract-keywords, generate-content, translate]
 *               content:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content processed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/process', aiController.processContent);

/**
 * @swagger
 * /api/ai/batch:
 *   post:
 *     summary: Batch process multiple content items
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requests
 *             properties:
 *               requests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - content
 *                   properties:
 *                     type:
 *                       type: string
 *                     content:
 *                       type: string
 *                     options:
 *                       type: object
 *     responses:
 *       200:
 *         description: Contents processed successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/batch', aiController.batchProcess);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Service status
 *       500:
 *         description: Server error
 */
router.get('/status', aiController.getServiceStatus);

module.exports = router; 