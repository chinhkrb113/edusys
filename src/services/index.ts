// API Client
export { apiClient } from '../lib/api';
export type { ApiResponse, PaginatedResponse, ApiError } from '../lib/api';

// Authentication Service
export { authService } from './authService';

// Curriculum Management Services
export { curriculumService } from './curriculumService';

export { versionService } from './versionService';
export type {
  CurriculumVersion,
  VersionCreateRequest,
  VersionUpdateRequest,
  VersionApprovalRequest,
  VersionPublishRequest
} from './versionService';

export { courseService } from './courseService';

export { unitService } from './unitService';
export type {
  UnitBlueprint,
  UnitCreateRequest,
  UnitUpdateRequest,
  UnitReorderRequest,
  UnitSplitRequest
} from './unitService';

export { resourceService } from './resourceService';
export type {
  UnitResource,
  ResourceCreateRequest,
  ResourceUpdateRequest,
  ResourceUploadRequest
} from './resourceService';

export { mappingService } from './mappingService';
export type {
  KCTMapping,
  MappingCreateRequest,
  MappingApplyRequest,
  MappingValidationResult
} from './mappingService';

export { exportService } from './exportService';
export type {
  ExportJob,
  ExportRequest,
  ExportRecord
} from './exportService';

export { reportsService } from './reportsService';
export type {
  CEFCoverageReport,
  ApprovalTimeReport,
  CEFRMatrixReport,
  CurriculumImpactReport,
  AdoptionReport
} from './reportsService';

export { commentsService } from './commentsService';
export type {
  Comment,
  CommentWithUser,
  ThreadedComment,
  CommentCreateRequest,
  CommentUpdateRequest
} from './commentsService';

export { tagsService } from './tagsService';
export type {
  Tag,
  TagWithUsage,
  TagCreateRequest,
  TagUpdateRequest
} from './tagsService';

export { savedViewsService } from './savedViewsService';
export type {
  SavedView,
  SavedViewWithCreator,
  SavedViewCreateRequest,
  SavedViewUpdateRequest
} from './savedViewsService';

export { approvalsService } from './approvalsService';
export type {
  Approval,
  ApprovalCreateRequest,
  ApprovalDecisionRequest,
  ApprovalEscalationRequest
} from './approvalsService';

export { settingsService } from './settingsService';
export type {
  TenantSettings,
  SettingsUpdateRequest,
  CampusSettings,
  CampusSettingsUpdateRequest
} from './settingsService';

export { analyticsService } from './analyticsService';
export type {
  UsageTracking,
  LearningOutcomeTracking,
  UsageTrackingCreateRequest,
  LearningOutcomeCreateRequest
} from './analyticsService';

export { tenantService } from './tenantService';
export type {
  Tenant,
  Campus,
  User,
  TenantCreateRequest,
  CampusCreateRequest,
  UserCreateRequest,
  TenantUpdateRequest,
  CampusUpdateRequest,
  UserUpdateRequest
} from './tenantService';
export { assignmentsService } from './assignmentsService';
export type {
  Assignment,
  AssignmentCreateRequest,
  AssignmentUpdateRequest,
  AssignmentListFilters,
  AssignmentListResult
} from './assignmentsService';

export { gamesService } from './gamesService';
export type {
  Game,
  GameCreateRequest,
  GameUpdateRequest,
  GameListFilters,
  GameListResult
} from './gamesService';

