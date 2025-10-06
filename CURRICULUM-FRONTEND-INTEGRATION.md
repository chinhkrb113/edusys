# Curriculum Management Frontend-Backend Integration Guide

## Tổng quan

Hướng dẫn này mô tả cách kết nối Frontend React với Backend APIs cho module Quản lý Khung chương trình (Curriculum Management).

## Cấu trúc Services

### API Client Base (`src/lib/api.ts`)

```typescript
import { apiClient } from "@/lib/api";

// HTTP methods với automatic token refresh
await apiClient.get<T>("/endpoint");
await apiClient.post<T>("/endpoint", data);
await apiClient.patch<T>("/endpoint", data);
await apiClient.delete<T>("/endpoint");

// File upload
await apiClient.uploadFile<T>("/upload", file, metadata);
```

### Các Service Modules

#### 1. Curriculum Service (`src/services/curriculumService.ts`)

```typescript
import { curriculumService } from "@/services";

// List curriculums
const curriculums = await curriculumService.getCurriculums({
  page: 1,
  page_size: 20,
  search: "English",
});

// Create curriculum
const newCurriculum = await curriculumService.createCurriculum({
  code: "ENG-001",
  name: "English Foundation",
  target_level: "A1-B2",
});

// Update curriculum
await curriculumService.updateCurriculum(1, {
  name: "Updated Name",
});
```

#### 2. Version Service (`src/services/versionService.ts`)

```typescript
import { versionService } from "@/services";

// Create version
const version = await versionService.createVersion({
  framework_id: 1,
  changes: "Initial version",
});

// Submit for review
await versionService.submitForReview(1);

// Approve version
await versionService.approveVersion(1, {
  decision: "approve",
  comments: "Approved with minor changes",
});
```

#### 3. Course Service (`src/services/courseService.ts`)

```typescript
import { courseService } from "@/services";

// Create course
const course = await courseService.createCourse(1, {
  title: "Basic Grammar",
  hours: 20,
});

// Update course
await courseService.updateCourse(1, {
  title: "Advanced Grammar",
});
```

#### 4. Unit Service (`src/services/unitService.ts`)

```typescript
import { unitService } from "@/services";

// Create unit
const unit = await unitService.createUnit(1, {
  title: "Present Simple",
  objectives: ["Understand present simple usage"],
  skills: ["Grammar", "Speaking"],
});

// Split unit
await unitService.splitUnit(1, {
  split_after_order_index: 2,
  new_unit_title: "Past Simple",
});
```

#### 5. Resource Service (`src/services/resourceService.ts`)

```typescript
import { resourceService } from "@/services";

// Upload resource
const resource = await resourceService.uploadResource(1, file, {
  title: "Grammar Worksheet",
  description: "Practice exercises",
});

// AI analysis
const analysis = await resourceService.analyzeResource(1);
```

#### 6. Mapping Service (`src/services/mappingService.ts`)

```typescript
import { mappingService } from "@/services";

// Create mapping
const mapping = await mappingService.createMapping({
  framework_id: 1,
  version_id: 1,
  target_type: "class_instance",
  target_id: 123,
});

// Apply mapping
await mappingService.applyMapping(1, {
  override_reason: "Urgent deployment needed",
});
```

#### 7. Export Service (`src/services/exportService.ts`)

```typescript
import { exportService } from "@/services";

// Start export
const { export_id, job_id } = await exportService.startExport(1, {
  format: "pdf",
  watermark: true,
});

// Check status
const status = await exportService.getExportStatus(jobId);
```

#### 8. Reports Service (`src/services/reportsService.ts`)

```typescript
import { reportsService } from "@/services";

// CEFR Coverage Report
const coverage = await reportsService.getCEFCoverage({
  framework_id: 1,
});

// Approval Timeline
const timeline = await reportsService.getApprovalTime({
  days: 30,
});
```

#### 9. Comments Service (`src/services/commentsService.ts`)

```typescript
import { commentsService } from "@/services";

// Add comment
await commentsService.addComment({
  entity_type: "curriculum_framework",
  entity_id: 1,
  comment: "Great work on this curriculum!",
});

// Get threaded comments
const comments = await commentsService.getComments({
  entity_type: "curriculum_framework",
  entity_id: 1,
  include_replies: true,
});
```

#### 10. Tags Service (`src/services/tagsService.ts`)

```typescript
import { tagsService } from "@/services";

// Create tag
const tag = await tagsService.createTag({
  name: "Grammar",
  color: "#3B82F6",
});

// Attach to entity
await tagsService.attachTag(1, {
  entity_type: "curriculum_framework",
  entity_id: 1,
});
```

#### 11. Saved Views Service (`src/services/savedViewsService.ts`)

```typescript
import { savedViewsService } from "@/services";

// Create saved view
const view = await savedViewsService.createSavedView({
  name: "My Grammar Units",
  entity_type: "unit_management",
  filters: { skill: "grammar", level: "B1" },
});

// Record usage
await savedViewsService.recordUsage(1);
```

## React Hooks Integration

### Custom Hooks cho Data Fetching

#### Curriculum Hook

```typescript
// hooks/useCurriculum.ts
import { useState, useEffect } from "react";
import { curriculumService } from "@/services";

export const useCurriculum = (id?: number) => {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCurriculum(id);
    }
  }, [id]);

  const fetchCurriculum = async (curriculumId: number) => {
    setLoading(true);
    try {
      const data = await curriculumService.getCurriculum(curriculumId);
      setCurriculum(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { curriculum, loading, error, refetch: fetchCurriculum };
};
```

#### Version Management Hook

```typescript
// hooks/useVersions.ts
import { useState, useEffect } from "react";
import { versionService } from "@/services";

export const useVersions = (frameworkId: number) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await versionService.getVersionsByFramework(frameworkId);
      setVersions(data.data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async (changes: string) => {
    try {
      await versionService.createVersion({
        framework_id: frameworkId,
        changes,
      });
      await fetchVersions(); // Refetch
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [frameworkId]);

  return { versions, loading, createVersion, refetch: fetchVersions };
};
```

### React Query Integration (Recommended)

```typescript
// lib/react-query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculumService, versionService } from "@/services";

// Curriculum Queries
export const useCurriculum = (id: number) => {
  return useQuery({
    queryKey: ["curriculum", id],
    queryFn: () => curriculumService.getCurriculum(id),
    enabled: !!id,
  });
};

export const useCurriculums = (params?: any) => {
  return useQuery({
    queryKey: ["curriculums", params],
    queryFn: () => curriculumService.getCurriculums(params),
  });
};

// Version Mutations
export const useCreateVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: versionService.createVersion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions"] });
    },
  });
};
```

## Component Integration Examples

### Curriculum List Component

```typescript
// components/curriculum/CurriculumList.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { curriculumService } from "@/services";
import { CurriculumCard } from "./CurriculumCard";

export const CurriculumList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["curriculums"],
    queryFn: () => curriculumService.getCurriculums(),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.data.map((curriculum) => (
        <CurriculumCard key={curriculum.id} curriculum={curriculum} />
      ))}
    </div>
  );
};
```

### Version Approval Component

```typescript
// components/curriculum/VersionApproval.tsx
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { versionService } from "@/services";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VersionApprovalProps {
  versionId: number;
  onApproved?: () => void;
}

export const VersionApproval: React.FC<VersionApprovalProps> = ({
  versionId,
  onApproved,
}) => {
  const [comments, setComments] = useState("");
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (data: { decision: "approve" | "reject"; comments: string }) =>
      versionService.approveVersion(versionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["versions"] });
      onApproved?.();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({
      decision: "approve",
      comments,
    });
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Approval comments..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
      <Button onClick={handleApprove} disabled={approveMutation.isPending}>
        {approveMutation.isPending ? "Approving..." : "Approve Version"}
      </Button>
    </div>
  );
};
```

## Error Handling

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
import React from "react";
import { toast } from "@/hooks/use-toast";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class CurriculumErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Curriculum Error:", error, errorInfo);
    toast({
      title: "Error",
      description: "Something went wrong with the curriculum module",
      variant: "destructive",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-medium">Curriculum Module Error</h3>
          <p className="text-red-600 text-sm mt-1">
            Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## State Management

### Zustand Store cho Curriculum

```typescript
// stores/curriculumStore.ts
import { create } from "zustand";
import { curriculumService } from "@/services";

interface CurriculumState {
  curriculums: any[];
  currentCurriculum: any | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCurriculums: () => Promise<void>;
  setCurrentCurriculum: (id: number) => Promise<void>;
  createCurriculum: (data: any) => Promise<void>;
  updateCurriculum: (id: number, data: any) => Promise<void>;
}

export const useCurriculumStore = create<CurriculumState>((set, get) => ({
  curriculums: [],
  currentCurriculum: null,
  loading: false,
  error: null,

  fetchCurriculums: async () => {
    set({ loading: true, error: null });
    try {
      const response = await curriculumService.getCurriculums();
      set({ curriculums: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setCurrentCurriculum: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const curriculum = await curriculumService.getCurriculum(id);
      set({ currentCurriculum: curriculum, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCurriculum: async (data: any) => {
    set({ loading: true, error: null });
    try {
      await curriculumService.createCurriculum(data);
      await get().fetchCurriculums(); // Refetch list
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCurriculum: async (id: number, data: any) => {
    set({ loading: true, error: null });
    try {
      await curriculumService.updateCurriculum(id, data);
      await get().setCurrentCurriculum(id); // Refetch current
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
```

## Testing

### Service Testing với MSW

```typescript
// __tests__/curriculumService.test.ts
import { rest } from "msw";
import { setupServer } from "msw/node";
import { curriculumService } from "@/services";

const server = setupServer(
  rest.get("/api/v1/kct", (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: 1,
            code: "ENG-001",
            name: "English Foundation",
            status: "published",
          },
        ],
        page: 1,
        page_size: 20,
        total: 1,
        total_pages: 1,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Curriculum Service", () => {
  it("should fetch curriculums", async () => {
    const result = await curriculumService.getCurriculums();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("English Foundation");
  });
});
```

## Performance Optimization

### React Query Configuration

```typescript
// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
```

### Lazy Loading Components

```typescript
// components/curriculum/LazyCurriculumEditor.tsx
import { lazy, Suspense } from "react";

const CurriculumEditor = lazy(() => import("./CurriculumEditor"));

export const LazyCurriculumEditor: React.FC = () => (
  <Suspense fallback={<div>Loading editor...</div>}>
    <CurriculumEditor />
  </Suspense>
);
```

## Deployment Configuration

### Environment Variables

```bash
# .env.local
VITE_API_URL=http://localhost:3001
VITE_APP_ENV=development

# .env.production
VITE_API_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### Build Optimization

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          curriculum: ["./src/components/curriculum"],
          services: ["./src/services"],
        },
      },
    },
  },
});
```

## Monitoring & Analytics

### Usage Tracking

```typescript
// utils/analytics.ts
import { curriculumService } from "@/services";

export const trackCurriculumUsage = (
  action: string,
  entityId: number,
  metadata?: any
) => {
  // Send to analytics service
  console.log("Curriculum Usage:", { action, entityId, metadata });

  // Could integrate with services like Mixpanel, Amplitude, etc.
};
```

---

## Kết luận

Hướng dẫn này cung cấp framework hoàn chỉnh để kết nối Frontend React với Backend APIs cho module Curriculum Management. Các services được thiết kế để:

- **Type-safe**: Đầy đủ TypeScript types
- **Error handling**: Centralized error management
- **Performance**: Optimized với React Query
- **Scalable**: Easy to extend với new features
- **Testable**: Mock-friendly cho unit testing

Để implement, hãy bắt đầu với việc setup React Query và implement từng component một cách tuần tự, bắt đầu từ Curriculum List và Version Management.
