import { apiClient } from '../lib/api';

export interface Assignment {
  id: number;
  title: string;
  level: string | null;
  skill: string | null;
  type: string | null;
  durationMinutes: number;
  description: string | null;
  tags: string[];
  difficulty: string | null;
  visibility: 'public' | 'private' | null;
  ownerUserId: number | null;
  objectives: unknown | null;
  rubric: unknown | null;
  attachments: unknown[]; // can refine later
  // Phase 2: Content types and rich content
  contentType: 'mcq' | 'true_false' | 'matching' | 'essay' | 'audio' | 'speaking' | 'reading' | 'project' | 'worksheet' | 'presentation' | 'quiz' | 'diagnostic' | null;
  content: unknown | null;
  // Phase 2: Versioning system
  versionNumber: number;
  parentId: number | null;
  isLatest: boolean;
  versionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Assignment Types
export type AssignmentType =
  | 'quiz' | 'essay' | 'audio' | 'speaking' | 'reading' | 'project'
  | 'worksheet' | 'presentation' | 'diagnostic';

export type ContentType =
  | 'mcq' | 'true_false' | 'matching' | 'cloze' | 'ordering'
  | 'essay' | 'audio' | 'speaking' | 'reading' | 'project';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Visibility = 'private' | 'campus' | 'tenant' | 'public';

// Structured Content Models
export interface QuizItem {
  itemType: 'mcq' | 'true_false' | 'matching' | 'cloze' | 'ordering';
  prompt: string;
  options?: string[]; // For MCQ/matching
  answerKey: number[] | string[] | string; // Flexible for different types
  points: number;
  difficulty: Difficulty;
  skill?: string;
  tags?: string[];
  explanation?: string; // Optional explanation for answers
}

export interface QuizContent {
  type: 'quiz';
  durationMins?: number;
  instructions: string;
  items: QuizItem[];
  shuffleOptions?: boolean;
  timePerItem?: number;
  negativeMarking?: boolean;
}

export interface EssayContent {
  type: 'essay';
  prompt: string;
  instructions: string;
  minWords?: number;
  maxWords?: number;
  referenceText?: string;
  referenceImage?: string;
  timeLimit?: number;
}

export interface AudioContent {
  type: 'audio';
  mediaUrl: string;
  transcript?: string;
  segments?: Array<{
    startTime: number;
    endTime: number;
    text: string;
  }>;
  items: QuizItem[]; // Comprehension questions
  replayLimit?: number;
  autoPauseOnQuestion?: boolean;
}

export interface SpeakingContent {
  type: 'speaking';
  prompt: string;
  instructions: string;
  maxDurationSec: number;
  guidelines?: string;
  preparationTime?: number;
  exampleResponse?: string;
}

export interface ReadingContent {
  type: 'reading';
  passages: Array<{
    title?: string;
    content: string;
    source?: string;
  }>;
  items: QuizItem[];
  timeLimit?: number;
}

export interface ProjectContent {
  type: 'project';
  brief: string;
  deliverables: Array<{
    type: 'text' | 'file' | 'link' | 'video' | 'audio' | 'code';
    description: string;
    required: boolean;
  }>;
  milestones?: Array<{
    title: string;
    description: string;
    dueDate?: string;
    weight: number;
  }>;
  collaborationType?: 'individual' | 'pair' | 'group';
  maxGroupSize?: number;
}

export type AssignmentContent =
  | QuizContent
  | EssayContent
  | AudioContent
  | SpeakingContent
  | ReadingContent
  | ProjectContent;

export interface RubricCriteria {
  name: string;
  description: string;
  weight: number;
  levels: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
  };
}

export interface Rubric {
  criteria: RubricCriteria[];
  totalPoints?: number;
  gradingScale?: Record<string, string>;
}

export interface Attachment {
  id?: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'txt' | 'rtf' | 'audio' | 'video' | 'image';
  size: number;
  uploadedAt?: string;
}

export interface AssignmentCreateRequest {
  title: string;
  level?: string | null;
  skill?: string | null;
  type?: AssignmentType | null;
  durationMinutes?: number;
  description?: string | null;
  tags?: string[];
  difficulty?: Difficulty | null;
  visibility?: Visibility;
  objectives?: string[];
  rubric?: Rubric | null;
  attachments?: Attachment[];
  contentType?: ContentType | null;
  content?: AssignmentContent | null;
  versionNotes?: string | null;
  techRequirements?: string[];
  language?: string;
}

export interface AssignmentUpdateRequest {
  title?: string;
  level?: string | null;
  skill?: string | null;
  type?: AssignmentType | null;
  durationMinutes?: number;
  description?: string | null;
  tags?: string[] | null;
  difficulty?: Difficulty | null;
  visibility?: Visibility;
  ownerUserId?: number | null;
  objectives?: string[] | null;
  rubric?: Rubric | null;
  attachments?: Attachment[] | null;
  // Phase 2: Content types and rich content
  contentType?: ContentType | null;
  content?: AssignmentContent | null;
  versionNotes?: string | null;
  techRequirements?: string[];
  language?: string;
}

export interface AssignmentListFilters {
  search?: string;
  level?: string;
  skill?: string;
  type?: string;
  difficulty?: string;
  visibility?: 'public' | 'private';
  ownerOnly?: boolean;
  contentType?: 'mcq' | 'true_false' | 'matching' | 'essay' | 'audio' | 'speaking' | 'reading' | 'project' | 'worksheet' | 'presentation' | 'quiz' | 'diagnostic';
  page?: number;
  pageSize?: number;
}

export interface AssignmentListResult {
  data: Assignment[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PracticeSession {
  id: number;
  assignment_id: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  message: string;
}

interface PracticeSessionResponse {
  session: PracticeSession;
}

interface AssignmentDto {
  id: number;
  title: string;
  level: string | null;
  skill: string | null;
  type: string | null;
  duration_minutes: number;
  description: string | null;
  tags: string[] | null;
  difficulty: string | null;
  visibility: 'public' | 'private' | null;
  owner_user_id: number | null;
  objectives: unknown | null;
  rubric: unknown | null;
  attachments: unknown[] | null;
  // Phase 2: Content types and rich content
  content_type: 'mcq' | 'true_false' | 'matching' | 'essay' | 'audio' | 'speaking' | 'reading' | 'project' | 'worksheet' | 'presentation' | 'quiz' | 'diagnostic' | null;
  content: unknown | null;
  // Phase 2: Versioning system
  version_number: number;
  parent_id: number | null;
  is_latest: boolean;
  version_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AssignmentListResponse {
  data: AssignmentDto[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

interface AssignmentResponse {
  assignment: AssignmentDto;
}

const deserializeAssignment = (dto: AssignmentDto): Assignment => ({
  id: dto.id,
  title: dto.title,
  level: dto.level,
  skill: dto.skill,
  type: dto.type,
  durationMinutes: dto.duration_minutes,
  description: dto.description,
  tags: Array.isArray(dto.tags) ? dto.tags : [],
  difficulty: dto.difficulty ?? null,
  visibility: dto.visibility ?? null,
  ownerUserId: dto.owner_user_id ?? null,
  objectives: dto.objectives ?? null,
  rubric: dto.rubric ?? null,
  attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
  // Phase 2: Content types and rich content
  contentType: dto.content_type ?? null,
  content: dto.content ?? null,
  // Phase 2: Versioning system
  versionNumber: dto.version_number ?? 1,
  parentId: dto.parent_id ?? null,
  isLatest: dto.is_latest ?? true,
  versionNotes: dto.version_notes ?? null,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

const serializePayload = (
  payload: AssignmentCreateRequest | AssignmentUpdateRequest
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};

  if ('title' in payload && payload.title !== undefined) body.title = payload.title;
  if ('level' in payload && payload.level !== undefined) body.level = payload.level;
  if ('skill' in payload && payload.skill !== undefined) body.skill = payload.skill;
  if ('type' in payload && payload.type !== undefined) body.type = payload.type;
  if ('durationMinutes' in payload && payload.durationMinutes !== undefined) {
    body.duration_minutes = payload.durationMinutes;
  }
  if ('description' in payload && payload.description !== undefined) {
    body.description = payload.description;
  }
  if ('tags' in payload && payload.tags !== undefined) {
    body.tags = payload.tags;
  }
  if ('difficulty' in payload && payload.difficulty !== undefined) {
    body.difficulty = payload.difficulty;
  }
  if ('visibility' in payload && payload.visibility !== undefined) {
    body.visibility = payload.visibility;
  }
  if ('objectives' in payload && payload.objectives !== undefined) {
    body.objectives = payload.objectives;
  }
  if ('rubric' in payload && payload.rubric !== undefined) {
    body.rubric = payload.rubric;
  }
  if ('attachments' in payload && payload.attachments !== undefined) {
    body.attachments = payload.attachments;
  }
  // Phase 2: Content types and rich content
  if ('contentType' in payload && payload.contentType !== undefined) {
    body.content_type = payload.contentType;
  }
  if ('content' in payload && payload.content !== undefined) {
    body.content = payload.content;
  }
  if ('versionNotes' in payload && payload.versionNotes !== undefined) {
    body.version_notes = payload.versionNotes;
  }

  return body;
};

const buildListParams = (filters: AssignmentListFilters = {}): Record<string, string> => {
  const params: Record<string, string> = {};

  if (filters.page) params.page = filters.page.toString();
  if (filters.pageSize) params.pageSize = filters.pageSize.toString();
  if (filters.search) params.search = filters.search;
  if (filters.level) params.level = filters.level;
  if (filters.skill) params.skill = filters.skill;
  if (filters.type) params.type = filters.type;
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.visibility) params.visibility = filters.visibility;
  if (filters.ownerOnly) params.ownerOnly = 'true';
  if (filters.contentType) params.content_type = filters.contentType;

  return params;
};

export const assignmentsService = {
  async list(filters: AssignmentListFilters = {}): Promise<AssignmentListResult> {
    const response = await apiClient.get<AssignmentListResponse>('/assignments', buildListParams(filters));

    return {
      data: response.data.map(deserializeAssignment),
      page: response.pagination.page,
      pageSize: response.pagination.page_size,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    };
  },

  async get(id: number): Promise<Assignment> {
    const response = await apiClient.get<AssignmentResponse>(`/assignments/${id}`);
    return deserializeAssignment(response.assignment);
  },

  async create(payload: AssignmentCreateRequest): Promise<Assignment> {
    const response = await apiClient.post<AssignmentResponse>('/assignments', serializePayload(payload));
    return deserializeAssignment(response.assignment);
  },

  async update(id: number, payload: AssignmentUpdateRequest): Promise<Assignment> {
    const response = await apiClient.patch<AssignmentResponse>(`/assignments/${id}`, serializePayload(payload));
    return deserializeAssignment(response.assignment);
  },

  async remove(id: number): Promise<void> {
    console.log('assignmentsService.remove called with ID:', id);
    try {
      await apiClient.delete(`/assignments/${id}`);
      console.log('assignmentsService.remove success for ID:', id);
    } catch (error) {
      console.error('assignmentsService.remove failed for ID:', id, error);
      throw error;
    }
  },

  async startPractice(assignmentId: number): Promise<PracticeSession> {
    const response = await apiClient.post<PracticeSessionResponse>(`/assignments/${assignmentId}/start-practice`);
    return response.session;
  },
};
