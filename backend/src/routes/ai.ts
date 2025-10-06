import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { aiService, type ContentGenerationRequest, type RubricGenerationRequest, type FeedbackSuggestionRequest } from '../services/aiService';

const router = express.Router();

// Generate content (assignments or games)
router.post('/generate-content', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('type').isIn(['assignment', 'game']),
  body('contentType').isString().notEmpty(),
  body('topic').isString().notEmpty(),
  body('level').isString().notEmpty(),
  body('skill').optional().isString(),
  body('language').optional().isString(),
  body('additionalContext').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const request: ContentGenerationRequest = req.body;
  const result = await aiService.generateContent(request);

  res.json({ content: result });
}));

// Generate rubric
router.post('/generate-rubric', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('assignmentType').isString().notEmpty(),
  body('objectives').isArray({ min: 1 }),
  body('objectives.*').isString().notEmpty(),
  body('level').isString().notEmpty(),
  body('skill').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const request: RubricGenerationRequest = req.body;
  const result = await aiService.generateRubric(request);

  res.json({ rubric: result });
}));

// Generate feedback suggestions
router.post('/generate-feedback', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('studentAnswer').isString().notEmpty(),
  body('assignmentContent').exists(),
  body('rubric').exists(),
  body('level').isString().notEmpty()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const request: FeedbackSuggestionRequest = req.body;
  const result = await aiService.generateFeedback(request);

  res.json({ feedback: result });
}));

// Generate assignment ideas
router.post('/assignment-ideas', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('topic').isString().notEmpty(),
  body('level').isString().notEmpty(),
  body('count').optional().isInt({ min: 1, max: 10 }).default(5)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { topic, level, count = 5 } = req.body;
  const ideas = await aiService.generateAssignmentIdeas(topic, level, count);

  res.json({ ideas });
}));

// Generate game ideas
router.post('/game-ideas', [
  authenticate,
  authorize('teacher', 'curriculum_designer', 'program_owner', 'admin'),
  body('topic').isString().notEmpty(),
  body('level').isString().notEmpty(),
  body('count').optional().isInt({ min: 1, max: 10 }).default(5)
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 'VALIDATION_ERROR', 422, errors.array());
  }

  const { topic, level, count = 5 } = req.body;
  const ideas = await aiService.generateGameIdeas(topic, level, count);

  res.json({ ideas });
}));

export default router;