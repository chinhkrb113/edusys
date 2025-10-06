import { apiClient } from '../lib/api';

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
  content: Record<string, unknown>;
  objectives?: string[];
  rubric?: RubricData;
  tags?: string[];
  estimatedDuration?: number;
  // Metadata fields from generation request
  level?: string;
  skill?: string;
  contentType?: string;
  language?: string;
  techRequirements?: string[];
}

export interface RubricData {
  criteria: RubricCriterion[];
  totalPoints?: number;
  gradingScale?: Record<string, string>;
}

export interface RubricCriterion {
  name: string;
  description?: string;
  weight?: number;
  levels: Record<string, string>;
}

export interface RubricGenerationRequest {
  assignmentType: string;
  objectives: string[];
  level: string;
  skill?: string;
}

export interface FeedbackSuggestionRequest {
  studentAnswer: string;
  assignmentContent: Record<string, unknown>;
  rubric: RubricData;
  level: string;
}

export interface FeedbackData {
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  grade: string;
}

export interface AssignmentIdea {
  title: string;
  type: string;
  description: string;
  objectives: string[];
}

export interface GameIdea {
  title: string;
  type: string;
  description: string;
  objectives: string[];
}

class AIService {
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const response = await apiClient.post<{ content: GeneratedContent }>('/ai/generate-content', request);
    return response.content;
  }

  async generateRubric(request: RubricGenerationRequest): Promise<RubricData> {
    const response = await apiClient.post<{ rubric: RubricData }>('/ai/generate-rubric', request);
    return response.rubric;
  }

  async generateFeedback(request: FeedbackSuggestionRequest): Promise<FeedbackData> {
    const response = await apiClient.post<{ feedback: FeedbackData }>('/ai/generate-feedback', request);
    return response.feedback;
  }

  async generateAssignmentIdeas(topic: string, level: string, count: number = 5): Promise<AssignmentIdea[]> {
    const response = await apiClient.post<{ ideas: AssignmentIdea[] }>('/ai/assignment-ideas', {
      topic,
      level,
      count
    });
    return response.ideas;
  }

  async generateGameIdeas(topic: string, level: string, count: number = 5): Promise<GameIdea[]> {
    const response = await apiClient.post<{ ideas: GameIdea[] }>('/ai/game-ideas', {
      topic,
      level,
      count
    });
    return response.ideas;
  }
}

export const aiService = new AIService();