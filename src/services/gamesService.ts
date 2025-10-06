import { apiClient } from '../lib/api';

export interface Game {
  id: number;
  title: string;
  type: string | null;
  level: string | null;
  skill: string | null;
  durationMinutes: number;
  players: string | null;
  description: string | null;
  playsCount: number;
  rating: number;
  apiIntegration: string | null;
  tags: string[];
  difficulty: string | null;
  visibility: 'public' | 'private' | null;
  ownerUserId: number | null;
  objectives: unknown | null;
  rubric: unknown | null;
  attachments: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface GameCreateRequest {
  title: string;
  type?: string | null;
  level?: string | null;
  skill?: string | null;
  durationMinutes?: number;
  players?: string | null;
  description?: string | null;
  playsCount?: number;
  rating?: number;
  apiIntegration?: string | null;
  tags?: string[];
  difficulty?: string | null;
  visibility?: 'public' | 'private';
  objectives?: unknown | null;
  rubric?: unknown | null;
  attachments?: unknown[];
}

export interface GameUpdateRequest {
  title?: string;
  type?: string | null;
  level?: string | null;
  skill?: string | null;
  durationMinutes?: number;
  players?: string | null;
  description?: string | null;
  playsCount?: number;
  rating?: number;
  apiIntegration?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  visibility?: 'public' | 'private';
  ownerUserId?: number | null;
  objectives?: unknown | null;
  rubric?: unknown | null;
  attachments?: unknown[] | null;
}

export interface GameListFilters {
  search?: string;
  level?: string;
  skill?: string;
  type?: string;
  difficulty?: string;
  visibility?: 'public' | 'private';
  ownerOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GameListResult {
  data: Game[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface GameDto {
  id: number;
  title: string;
  type: string | null;
  level: string | null;
  skill: string | null;
  duration_minutes: number;
  players: string | null;
  description: string | null;
  plays_count: number;
  rating: number;
  api_integration: string | null;
  tags: string[] | null;
  difficulty: string | null;
  visibility: 'public' | 'private' | null;
  owner_user_id: number | null;
  objectives: unknown | null;
  rubric: unknown | null;
  attachments: unknown[] | null;
  created_at: string;
  updated_at: string;
}

interface GameListResponse {
  data: GameDto[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

interface GameResponse {
  game: GameDto;
}

const deserializeGame = (dto: GameDto): Game => ({
  id: dto.id,
  title: dto.title,
  type: dto.type,
  level: dto.level,
  skill: dto.skill,
  durationMinutes: dto.duration_minutes,
  players: dto.players,
  description: dto.description,
  playsCount: dto.plays_count,
  rating: Number(dto.rating ?? 0),
  apiIntegration: dto.api_integration,
  tags: Array.isArray(dto.tags) ? dto.tags : [],
  difficulty: dto.difficulty ?? null,
  visibility: dto.visibility ?? null,
  ownerUserId: dto.owner_user_id ?? null,
  objectives: dto.objectives ?? null,
  rubric: dto.rubric ?? null,
  attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

const serializePayload = (
  payload: GameCreateRequest | GameUpdateRequest
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};

  if ('title' in payload && payload.title !== undefined) body.title = payload.title;
  if ('type' in payload && payload.type !== undefined) body.type = payload.type;
  if ('level' in payload && payload.level !== undefined) body.level = payload.level;
  if ('skill' in payload && payload.skill !== undefined) body.skill = payload.skill;
  if ('durationMinutes' in payload && payload.durationMinutes !== undefined) {
    body.duration_minutes = payload.durationMinutes;
  }
  if ('players' in payload && payload.players !== undefined) {
    body.players = payload.players;
  }
  if ('description' in payload && payload.description !== undefined) {
    body.description = payload.description;
  }
  if ('playsCount' in payload && payload.playsCount !== undefined) {
    body.plays_count = payload.playsCount;
  }
  if ('rating' in payload && payload.rating !== undefined) {
    body.rating = payload.rating;
  }
  if ('apiIntegration' in payload && payload.apiIntegration !== undefined) {
    body.api_integration = payload.apiIntegration;
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

  return body;
};

const buildListParams = (filters: GameListFilters = {}): Record<string, string> => {
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

  return params;
};

export const gamesService = {
  async list(filters: GameListFilters = {}): Promise<GameListResult> {
    const response = await apiClient.get<GameListResponse>('/games', buildListParams(filters));

    return {
      data: response.data.map(deserializeGame),
      page: response.pagination.page,
      pageSize: response.pagination.page_size,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    };
  },

  async get(id: number): Promise<Game> {
    const response = await apiClient.get<GameResponse>(`/games/${id}`);
    return deserializeGame(response.game);
  },

  async create(payload: GameCreateRequest): Promise<Game> {
    const response = await apiClient.post<GameResponse>('/games', serializePayload(payload));
    return deserializeGame(response.game);
  },

  async update(id: number, payload: GameUpdateRequest): Promise<Game> {
    const response = await apiClient.patch<GameResponse>(`/games/${id}`, serializePayload(payload));
    return deserializeGame(response.game);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/games/${id}`);
  },
};
