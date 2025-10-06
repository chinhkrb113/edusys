import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface ContentGenerationRequest {
  type: 'assignment' | 'game';
  contentType: string;
  topic: string;
  level: string;
  skill?: string;
  language?: string;
  additionalContext?: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  content: any;
  objectives?: string[];
  rubric?: any;
  tags?: string[];
  estimatedDuration?: number;
  // Metadata fields from generation request
  level?: string;
  skill?: string;
  contentType?: string;
  language?: string;
  techRequirements?: string[];
}

export interface RubricGenerationRequest {
  assignmentType: string;
  objectives: string[];
  level: string;
  skill?: string;
}

export interface FeedbackSuggestionRequest {
  studentAnswer: string;
  assignmentContent: any;
  rubric: any;
  level: string;
}

class AIService {
  private async generateWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response from AI');
        }

        return text;
      } catch (error) {
        logger.warn(`AI generation attempt ${attempt} failed:`, error);

        if (attempt === maxRetries) {
          throw new Error(`AI generation failed after ${maxRetries} attempts: ${error}`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('AI generation failed');
  }

  private getAssignmentPrompt(request: ContentGenerationRequest): string {
    const { contentType, topic, level, skill, language = 'vietnamese', additionalContext } = request;

    let contentStructure = '';

    // Define specific content structure based on assignment type
    switch (contentType) {
      case 'reading':
        contentStructure = `{
    "instructions": "Detailed reading comprehension instructions in Vietnamese",
    "materials": ["Reading passage text"],
    "readingPassage": "A complete reading passage about the topic, written at ${level} level",
    "questions": [
      {
        "questionText": "Comprehension question 1",
        "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
        "correctAnswer": "A",
        "explanation": "Explanation for the correct answer"
      }
    ],
    "examples": []
  }`;
        break;

      case 'mcq':
        contentStructure = `{
    "instructions": "Multiple choice quiz instructions in Vietnamese",
    "materials": ["Quiz materials"],
    "readingPassage": "Optional reading passage if needed for context",
    "questions": [
      {
        "questionText": "Question text",
        "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
        "correctAnswer": "A",
        "explanation": "Explanation for the correct answer"
      }
    ],
    "examples": []
  }`;
        break;

      case 'true_false':
        contentStructure = `{
    "instructions": "True/False quiz instructions in Vietnamese",
    "materials": ["Quiz materials"],
    "questions": [
      {
        "questionText": "True or False statement",
        "correctAnswer": "true",
        "explanation": "Explanation for the correct answer"
      }
    ],
    "examples": []
  }`;
        break;

      case 'matching':
        contentStructure = `{
    "instructions": "Matching exercise instructions in Vietnamese",
    "materials": ["Matching exercise materials"],
    "questions": [
      {
        "questionText": "Match the items from column A with column B",
        "options": {
          "A1": "Item A1",
          "A2": "Item A2",
          "A3": "Item A3",
          "B1": "Item B1",
          "B2": "Item B2",
          "B3": "Item B3"
        },
        "correctAnswer": {"A1": "B1", "A2": "B2", "A3": "B3"},
        "explanation": "Explanation for the matching"
      }
    ],
    "examples": []
  }`;
        break;

      case 'essay':
        contentStructure = `{
    "instructions": "Essay writing instructions in Vietnamese",
    "materials": ["Essay prompt and guidelines"],
    "questions": [
      {
        "questionText": "Essay topic/prompt",
        "minWords": 150,
        "maxWords": 300,
        "gradingCriteria": "Essay grading criteria"
      }
    ],
    "examples": ["Sample essay structure or outline"]
  }`;
        break;

      case 'speaking':
        contentStructure = `{
    "instructions": "Speaking activity instructions in Vietnamese",
    "materials": ["Discussion prompts", "Vocabulary lists"],
    "questions": [
      {
        "questionText": "Discussion question or prompt",
        "preparationTime": 60,
        "maxDuration": 120,
        "evaluationCriteria": "Speaking evaluation criteria"
      }
    ],
    "examples": ["Sample responses or model answers"]
  }`;
        break;

      case 'audio':
        contentStructure = `{
    "instructions": "Audio listening activity instructions in Vietnamese",
    "materials": ["Audio file and transcript"],
    "questions": [
      {
        "questionText": "Question about the audio content",
        "audioUrl": "https://example.com/audio.mp3",
        "maxPlays": 2,
        "allowRewind": true,
        "explanation": "Explanation for the correct answer"
      }
    ],
    "examples": []
  }`;
        break;

      case 'project':
      case 'worksheet':
      case 'presentation':
        contentStructure = `{
    "instructions": "Project/Worksheet/Presentation instructions in Vietnamese",
    "materials": ["Required materials for the assignment"],
    "questions": [
      {
        "questionText": "Assignment description",
        "requirements": "Detailed requirements for the assignment",
        "deadlineDays": 7,
        "maxPoints": 100
      }
    ],
    "examples": ["Sample assignment or examples"]
  }`;
        break;

      case 'quiz':
      case 'diagnostic':
        contentStructure = `{
    "instructions": "Quiz/Diagnostic test instructions in Vietnamese",
    "materials": ["Test materials"],
    "questions": [
      {
        "questionType": "mcq",
        "questionText": "Question text",
        "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
        "correctAnswer": "A",
        "explanation": "Explanation for the correct answer"
      },
      {
        "questionType": "true_false",
        "questionText": "True or False statement",
        "correctAnswer": "true",
        "explanation": "Explanation for the correct answer"
      },
      {
        "questionType": "short_answer",
        "questionText": "Short answer question",
        "sampleAnswer": "Sample correct answer"
      }
    ],
    "examples": []
  }`;
        break;

      default:
        contentStructure = `{
    "instructions": "Activity instructions in Vietnamese",
    "materials": ["Required materials"],
    "questions": ["Activity questions or prompts"],
    "examples": ["Examples or samples"]
  }`;
    }

    const basePrompt = `You are an expert English language teacher creating educational content in ${language}.

Create a ${contentType} assignment about "${topic}" for ${level} level students.
${skill ? `Focus on ${skill} skill.` : ''}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

IMPORTANT: Generate actual content, not just descriptions. For reading assignments, provide a reading passage and comprehension questions with options and answers. For quizzes, provide real questions with multiple choice options.

Please provide the response in the following JSON format:
{
  "title": "Assignment title in Vietnamese",
  "description": "Brief description in Vietnamese",
  "content": ${contentStructure},
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "rubric": {
    "criteria": [
      {"name": "Criteria name", "levels": {"excellent": "Description", "good": "Description", "fair": "Description", "poor": "Description"}}
    ]
  },
  "tags": ["relevant", "tags"],
  "estimatedDuration": 30
}

Make sure the content is appropriate for ${level} level and focuses on ${skill || 'general English skills'}. Generate real, usable content - not just placeholders.`;

    return basePrompt;
  }

  private getGamePrompt(request: ContentGenerationRequest): string {
    const { contentType, topic, level, skill, language = 'vietnamese', additionalContext } = request;

    const basePrompt = `You are an expert English language teacher creating educational games in ${language}.

Create a ${contentType} game about "${topic}" for ${level} level students.
${skill ? `Focus on ${skill} skill.` : ''}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Please provide the response in the following JSON format:
{
  "title": "Game title in Vietnamese",
  "description": "Brief description in Vietnamese",
  "content": {
    "rules": "Game rules and instructions",
    "setup": "How to set up the game",
    "materials": ["Required materials"],
    "rounds": ["Description of game rounds"],
    "scoring": "How points are awarded"
  },
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "configuration": {
    "minPlayers": 1,
    "maxPlayers": 4,
    "durationMinutes": 20,
    "difficulty": "easy|medium|hard",
    "gameMode": "${contentType}"
  },
  "tags": ["relevant", "tags"],
  "estimatedDuration": 20
}

Make sure the game is engaging, educational, and appropriate for ${level} level students.`;

    return basePrompt;
  }

  private getRubricPrompt(request: RubricGenerationRequest): string {
    const { assignmentType, objectives, level, skill } = request;

    return `You are an expert English language teacher creating assessment rubrics.

Create a detailed rubric for a ${assignmentType} assignment at ${level} level.
${skill ? `Focus on ${skill} skill.` : ''}

Learning objectives: ${objectives.join(', ')}

Please provide the response in the following JSON format:
{
  "criteria": [
    {
      "name": "Criteria name (e.g., Content, Language, Structure)",
      "description": "Brief description of this criterion",
      "weight": 25,
      "levels": {
        "excellent": "Outstanding performance description",
        "good": "Good performance description",
        "fair": "Satisfactory performance description",
        "poor": "Unsatisfactory performance description"
      }
    }
  ],
  "totalPoints": 100,
  "gradingScale": {
    "A": "90-100",
    "B": "80-89",
    "C": "70-79",
    "D": "60-69",
    "F": "0-59"
  }
}

Ensure the rubric is comprehensive and aligned with the learning objectives.`;
  }

  private getFeedbackPrompt(request: FeedbackSuggestionRequest): string {
    const { studentAnswer, assignmentContent, rubric, level } = request;

    return `You are an expert English language teacher providing constructive feedback.

Assignment: ${JSON.stringify(assignmentContent)}
Rubric: ${JSON.stringify(rubric)}
Student level: ${level}

Student answer: "${studentAnswer}"

Please provide constructive feedback in Vietnamese that:
1. Highlights strengths
2. Identifies areas for improvement
3. Gives specific suggestions
4. Encourages the student

Response format:
{
  "overallFeedback": "General feedback paragraph",
  "strengths": ["Specific strengths"],
  "improvements": ["Areas to improve"],
  "suggestions": ["Specific actionable suggestions"],
  "grade": "Suggested grade (A, B, C, D, F)"
}`;
  }

  private normalizeAssignmentContent(content: any, contentType: string): any {
    if (!content || typeof content !== 'object') return content;

    const normalized = { ...content };

    // Special handling for reading and MCQ assignments
    if (contentType === 'reading' || contentType === 'mcq') {
      // Extract reading passage from materials if it contains reading text
      if (Array.isArray(normalized.materials) && normalized.materials.length > 0) {
        // Look for material that contains reading text (usually starts with ** or contains long text)
        const readingMaterial = normalized.materials.find((material: string) =>
          typeof material === 'string' &&
          (material.includes('**Văn bản đọc:**') ||
           material.includes('**Reading Text:**') ||
           material.includes('**Cà Phê') || // Specific to the generated content
           material.length > 200) // Long text is likely reading passage
        );

        if (readingMaterial) {
          // Extract reading passage and clean it
          let readingPassage = readingMaterial;
          // Remove markdown formatting if present
          readingPassage = readingPassage.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **text**
          normalized.readingPassage = readingPassage.trim();

          // Remove the reading material from materials array
          normalized.materials = normalized.materials.filter((material: string) => material !== readingMaterial);
        }
      }
    }

    // Handle questions array - normalize property names based on content type
    if (Array.isArray(normalized.questions)) {
      const questions = [];

      for (const item of normalized.questions) {
        if (typeof item === 'string') {
          // Simple string question - convert based on content type
          if (contentType === 'essay') {
            questions.push({
              questionText: item,
              minWords: 150,
              maxWords: 300,
              gradingCriteria: 'Comprehensive essay grading criteria'
            });
          } else if (contentType === 'speaking') {
            questions.push({
              questionText: item,
              preparationTime: 60,
              maxDuration: 120,
              evaluationCriteria: 'Fluency, pronunciation, vocabulary, grammar'
            });
          } else if (contentType === 'audio') {
            questions.push({
              questionText: item,
              audioUrl: '',
              maxPlays: 2,
              allowRewind: true,
              explanation: ''
            });
          } else if (['project', 'worksheet', 'presentation'].includes(contentType)) {
            questions.push({
              questionText: item,
              requirements: 'Detailed assignment requirements',
              deadlineDays: 7,
              maxPoints: 100
            });
          } else {
            questions.push({
              questionText: item,
              options: {},
              correctAnswer: '',
              explanation: ''
            });
          }
        } else if (item.question_text || item.questionText || item.question) {
          // Object question, normalize properties based on content type
          const baseQuestion = {
            questionText: item.question_text || item.questionText || item.question || '',
            explanation: item.explanation || ''
          };

          if (contentType === 'true_false') {
            questions.push({
              ...baseQuestion,
              correctAnswer: (item.correct_answer || item.correctAnswer || item.answer || 'true').toString().toLowerCase()
            });
          } else if (contentType === 'matching') {
            questions.push({
              ...baseQuestion,
              options: item.options || {},
              correctAnswer: item.correct_answer || item.correctAnswer || item.answer || {}
            });
          } else if (contentType === 'essay') {
            questions.push({
              ...baseQuestion,
              minWords: item.minWords || item.min_words || 150,
              maxWords: item.maxWords || item.max_words || 300,
              gradingCriteria: item.gradingCriteria || item.grading_criteria || 'Essay grading criteria'
            });
          } else if (contentType === 'speaking') {
            questions.push({
              ...baseQuestion,
              preparationTime: item.preparationTime || item.preparation_time || 60,
              maxDuration: item.maxDuration || item.max_duration || 120,
              evaluationCriteria: item.evaluationCriteria || item.evaluation_criteria || 'Speaking evaluation criteria'
            });
          } else if (contentType === 'audio') {
            questions.push({
              ...baseQuestion,
              audioUrl: item.audioUrl || item.audio_url || '',
              maxPlays: item.maxPlays || item.max_plays || 2,
              allowRewind: item.allowRewind !== undefined ? item.allowRewind : true
            });
          } else if (['project', 'worksheet', 'presentation'].includes(contentType)) {
            questions.push({
              ...baseQuestion,
              requirements: item.requirements || 'Assignment requirements',
              deadlineDays: item.deadlineDays || item.deadline_days || 7,
              maxPoints: item.maxPoints || item.max_points || 100
            });
          } else if (['quiz', 'diagnostic'].includes(contentType)) {
            questions.push({
              ...baseQuestion,
              questionType: item.questionType || item.question_type || 'mcq',
              options: item.options || {},
              correctAnswer: item.correct_answer || item.correctAnswer || item.answer || '',
              sampleAnswer: item.sampleAnswer || item.sample_answer || ''
            });
          } else {
            // Default MCQ structure
            questions.push({
              ...baseQuestion,
              options: item.options || {},
              correctAnswer: item.correct_answer || item.correctAnswer || item.answer || ''
            });
          }
        }
      }

      normalized.questions = questions;
    }

    // Ensure materials is an array
    if (!Array.isArray(normalized.materials)) {
      normalized.materials = normalized.materials ? [normalized.materials] : [];
    }

    // Ensure examples is an array
    if (!Array.isArray(normalized.examples)) {
      normalized.examples = normalized.examples ? [normalized.examples] : [];
    }

    return normalized;
  }

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      logger.info('Generating content with AI', { type: request.type, contentType: request.contentType, topic: request.topic });

      const prompt = request.type === 'assignment'
        ? this.getAssignmentPrompt(request)
        : this.getGamePrompt(request);

      const response = await this.generateWithRetry(prompt);

      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Parse JSON response
      const parsed = JSON.parse(cleanResponse);

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.content) {
        throw new Error('Invalid AI response: missing required fields');
      }

      // Normalize content structure for assignments
      let normalizedContent = parsed.content;
      if (request.type === 'assignment') {
        normalizedContent = this.normalizeAssignmentContent(parsed.content, request.contentType);
      }

      return {
        title: parsed.title,
        description: parsed.description,
        content: normalizedContent,
        objectives: parsed.objectives || [],
        rubric: parsed.rubric,
        tags: parsed.tags || [],
        estimatedDuration: parsed.estimatedDuration || 30,
        // Include metadata from request
        level: request.level,
        skill: request.skill,
        contentType: request.contentType,
        language: request.language,
        techRequirements: [] // Can be populated based on content type
      };

    } catch (error) {
      logger.error('Content generation failed', { error, request });
      throw new Error(`Content generation failed: ${error}`);
    }
  }

  async generateRubric(request: RubricGenerationRequest): Promise<any> {
    try {
      logger.info('Generating rubric with AI', { assignmentType: request.assignmentType, objectives: request.objectives });

      const prompt = this.getRubricPrompt(request);
      const response = await this.generateWithRetry(prompt);

      // Clean the response by removing markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const rubric = JSON.parse(cleanResponse);

      if (!rubric.criteria || !Array.isArray(rubric.criteria)) {
        throw new Error('Invalid rubric response: missing criteria');
      }

      return rubric;

    } catch (error) {
      logger.error('Rubric generation failed', { error, request });
      throw new Error(`Rubric generation failed: ${error}`);
    }
  }

  async generateFeedback(request: FeedbackSuggestionRequest): Promise<any> {
    try {
      logger.info('Generating feedback with AI', { level: request.level });

      const prompt = this.getFeedbackPrompt(request);
      const response = await this.generateWithRetry(prompt);

      const feedback = JSON.parse(response);

      return feedback;

    } catch (error) {
      logger.error('Feedback generation failed', { error, request });
      throw new Error(`Feedback generation failed: ${error}`);
    }
  }

  async generateAssignmentIdeas(topic: string, level: string, count: number = 5): Promise<any[]> {
    const prompt = `Generate ${count} creative assignment ideas for "${topic}" at ${level} level English learners.

Each idea should include:
- Title
- Type (mcq, essay, speaking, etc.)
- Brief description
- Learning objectives

Response format: JSON array of objects.`;

    try {
      const response = await this.generateWithRetry(prompt);
      return JSON.parse(response);
    } catch (error) {
      logger.error('Assignment ideas generation failed', { error, topic, level });
      return [];
    }
  }

  async generateGameIdeas(topic: string, level: string, count: number = 5): Promise<any[]> {
    const prompt = `Generate ${count} engaging game ideas for "${topic}" at ${level} level English learners.

Each idea should include:
- Title
- Type (flashcard, kahoot_style, crossword, etc.)
- Brief description
- Learning objectives

Response format: JSON array of objects.`;

    try {
      const response = await this.generateWithRetry(prompt);
      return JSON.parse(response);
    } catch (error) {
      logger.error('Game ideas generation failed', { error, topic, level });
      return [];
    }
  }
}

export const aiService = new AIService();