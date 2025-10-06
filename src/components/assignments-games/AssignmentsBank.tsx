"use client";

import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, SparklesIcon, FileTextIcon, PlusIcon, Wand2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAssignmentsGamesFilters } from "@/hooks/useAssignmentsGamesFilters";
import AssignmentCard from "./AssignmentCard";
import ContentEditor from "./ContentEditor";
import RubricEditor from "./RubricEditor";
import { assignmentsService, type Assignment, type AssignmentListResult, type AssignmentListFilters, type AssignmentType, type Difficulty, type Visibility, type AssignmentContent, type Rubric, type ContentType } from "@/services/assignmentsService";
import { aiService, type GeneratedContent } from "@/services/aiService";
import { contentTemplates, getTemplatesByType, type ContentTemplate } from "@/data/contentTemplates";
import { useToast } from "@/hooks/use-toast";

export interface AssignmentsBankHandle {
  openCreateDialog: () => void;
}

const UNSET_OPTION = 'unset';

interface AssignmentFormState {
  // Basic fields
  title: string;
  level: string;
  skill: string;
  type: string;
  durationMinutes: number;
  description: string;
  tags: string;

  // Enhanced metadata
  difficulty: Difficulty;
  visibility: Visibility;
  objectives: string; // Learning objectives as newline-separated
  techRequirements: string;
  language: string;

  // Phase 2: Enhanced content fields
  contentType: string;
  content: string; // Rich text content or JSON
  rubric: string; // JSON string
  attachments: string; // JSON string

  // AI Generation fields
  aiTopic: string;
  aiLevel: string;
  aiSkill: string;
  aiContentType: string;

  // Template selection
  selectedTemplate: string;
}

const DEFAULT_FORM_STATE: AssignmentFormState = {
  // Basic fields
  title: "",
  level: "",
  skill: "",
  type: "",
  durationMinutes: 30,
  description: "",
  tags: "",

  // Enhanced metadata
  difficulty: "medium" as Difficulty,
  visibility: "private" as Visibility,
  objectives: "",
  techRequirements: "",
  language: "vietnamese",

  // Phase 2: Enhanced content fields
  contentType: "",
  content: "",
  rubric: "",
  attachments: "",

  // AI Generation fields
  aiTopic: "",
  aiLevel: "",
  aiSkill: "",
  aiContentType: "",

  // Template selection
  selectedTemplate: "",
};

const AssignmentsBank = forwardRef<AssignmentsBankHandle>((_, ref) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    filters,
    setSearch,
    setLevel,
    setSkill,
    setType,
    setPage,
    levelOptions,
    skillOptions,
    typeOptions,
    difficultyOptions,
    visibilityOptions,
    setDifficulty,
    setVisibility,
    setOwnerOnly,
  } = useAssignmentsGamesFilters({ defaultPageSize: 8 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [formState, setFormState] = useState<AssignmentFormState>(DEFAULT_FORM_STATE);

  // Phase 2: Enhanced dialog state
  const [activeTab, setActiveTab] = useState("manual");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);

  const listFilters: AssignmentListFilters = useMemo(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search.trim() || undefined,
    level: filters.level !== "all" ? filters.level : undefined,
    skill: filters.skill !== "all" ? filters.skill : undefined,
    type: filters.type !== "all" ? filters.type : undefined,
    difficulty: filters.difficulty !== "all" ? filters.difficulty : undefined,
    visibility: filters.visibility !== "all" ? (filters.visibility as 'public' | 'private') : undefined,
    ownerOnly: filters.ownerOnly || undefined,
  }), [filters]);

  const assignmentsQuery = useQuery<AssignmentListResult>({
    queryKey: ["assignments", listFilters],
    queryFn: () => assignmentsService.list(listFilters),
    placeholderData: (prev) => prev as AssignmentListResult | undefined,
    staleTime: 30000,
  });

  const { data, isLoading, isFetching } = assignmentsQuery;
  const assignments = data?.data ?? [];
  const pagination = data ? {
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    totalPages: data.totalPages,
  } : { page: 1, pageSize: filters.pageSize, total: 0, totalPages: 1 };

  const resetForm = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    setEditingAssignment(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  useImperativeHandle(ref, () => ({
    openCreateDialog: handleOpenCreate,
  }), [handleOpenCreate]);

  const setFormFromAssignment = useCallback((assignment: Assignment) => {
    // Format content for display
    let displayContent = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawContent = (assignment as any).content;
    if (rawContent) {
      if (typeof rawContent === 'string') {
        if (isJsonContent(rawContent)) {
          displayContent = rawContent; // Keep JSON string for display formatting
        } else {
          displayContent = rawContent; // HTML content
        }
      } else if (typeof rawContent === 'object') {
        // Content is already parsed object, stringify it
        displayContent = JSON.stringify(rawContent, null, 2);
      }
    }

    setFormState({
      // Basic fields
      title: assignment.title,
      level: assignment.level ?? "",
      skill: assignment.skill ?? "",
      type: assignment.type ?? "",
      durationMinutes: assignment.durationMinutes ?? 0,
      description: assignment.description ?? "",
      tags: assignment.tags.join(", "),

      // Enhanced metadata
      difficulty: (assignment.difficulty as Difficulty) ?? "medium",
      visibility: (assignment.visibility as Visibility) ?? "private",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      objectives: Array.isArray((assignment as any).objectives)
        ? (assignment as any).objectives.join('\n')
        : (assignment as any).objectives ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      techRequirements: (assignment as any).techRequirements ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      language: (assignment as any).language ?? "vietnamese",

      // Phase 2: Enhanced content fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentType: (assignment as any).contentType ?? "",
      content: displayContent,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rubric: (assignment as any).rubric ? JSON.stringify((assignment as any).rubric, null, 2) : "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attachments: (assignment as any).attachments ? JSON.stringify((assignment as any).attachments, null, 2) : "",

      // AI Generation fields (reset for editing)
      aiTopic: "",
      aiLevel: "",
      aiSkill: "",
      aiContentType: "",

      // Template selection (reset for editing)
      selectedTemplate: "",
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: assignmentsService.create,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm bài tập mới." });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: () => {
      toast({ title: "Không thể tạo bài tập", description: "Vui lòng thử lại.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof assignmentsService.update>[1]; }) =>
      assignmentsService.update(id, payload),
    onSuccess: () => {
      toast({ title: "Đã cập nhật", description: "Thông tin bài tập đã được lưu." });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: () => {
      toast({ title: "Không thể cập nhật", description: "Vui lòng thử lại.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      console.log('Deleting assignment with ID:', id);
      return assignmentsService.remove(id);
    },
    onSuccess: () => {
      console.log('Delete successful');
      toast({ title: "Đã xóa", description: "Bài tập đã được xóa." });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      toast({ title: "Không thể xóa", description: "Vui lòng thử lại.", variant: "destructive" });
    },
    onSettled: () => {
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    },
  });

  // Phase 2: AI and Template mutations
  const generateContentMutation = useMutation({
    mutationFn: (params: { topic: string; contentType: string; level: string; skill?: string }) =>
      aiService.generateContent({
        type: 'assignment',
        contentType: params.contentType,
        topic: params.topic,
        level: params.level,
        skill: params.skill,
        language: 'english'
      }),
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({ title: "Thành công", description: "Đã tạo nội dung với AI." });
    },
    onError: () => {
      toast({ title: "Không thể tạo nội dung", description: "Vui lòng thử lại.", variant: "destructive" });
    },
  });

  const generateRubricMutation = useMutation({
    mutationFn: (params: { objectives: string[]; level: string; skill?: string }) =>
      aiService.generateRubric({
        assignmentType: 'general',
        objectives: params.objectives,
        level: params.level,
        skill: params.skill
      }),
    onSuccess: (data) => {
      setFormState(prev => ({ ...prev, rubric: JSON.stringify(data, null, 2) }));
      toast({ title: "Thành công", description: "Đã tạo rubric với AI." });
    },
    onError: () => {
      toast({ title: "Không thể tạo rubric", description: "Vui lòng thử lại.", variant: "destructive" });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: formState.title.trim(),
      level: formState.level || undefined,
      skill: formState.skill || undefined,
      type: (formState.type as AssignmentType) || undefined,
      durationMinutes: formState.durationMinutes,
      description: formState.description.trim() || undefined,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      // Enhanced metadata
      difficulty: formState.difficulty,
      visibility: formState.visibility,
      objectives: formState.objectives ? formState.objectives.split('\n').filter(obj => obj.trim()) : undefined,
      techRequirements: formState.techRequirements ? formState.techRequirements.split(',').map(req => req.trim()).filter(req => req.length > 0) : undefined,
      language: formState.language,
      // Phase 2: Enhanced fields
      contentType: (formState.contentType as ContentType) || undefined,
      content: formState.content ? JSON.parse(formState.content) : undefined,
      rubric: formState.rubric ? JSON.parse(formState.rubric) : undefined,
      attachments: formState.attachments ? JSON.parse(formState.attachments) : undefined,
    };

    if (!payload.title) {
      toast({ title: "Thiếu tiêu đề", description: "Vui lòng nhập tên bài tập.", variant: "destructive" });
      return;
    }

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormFromAssignment(assignment);
    setIsDialogOpen(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log('handleConfirmDelete called, assignmentToDelete:', assignmentToDelete);
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete.id);
    } else {
      console.log('No assignment to delete');
    }
  };

  // Phase 2: Helper functions
  const handleGenerateContent = () => {
    if (!formState.aiTopic || !formState.aiContentType || !formState.aiLevel) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ thông tin để tạo nội dung.", variant: "destructive" });
      return;
    }

    generateContentMutation.mutate({
      topic: formState.aiTopic,
      contentType: formState.aiContentType,
      level: formState.aiLevel,
      skill: formState.aiSkill || undefined
    });
  };

  const handleApplyGeneratedContent = () => {
    if (!generatedContent) return;

    setFormState(prev => ({
      ...prev,
      title: generatedContent.title,
      description: generatedContent.description,
      content: JSON.stringify(generatedContent.content, null, 2),
      objectives: generatedContent.objectives?.join('\n') || '',
      rubric: generatedContent.rubric ? JSON.stringify(generatedContent.rubric, null, 2) : '',
      tags: generatedContent.tags?.join(', ') || '',
      // Populate metadata fields from AI response
      level: generatedContent.level || '',
      skill: generatedContent.skill || '',
      contentType: generatedContent.contentType || '',
      language: generatedContent.language || 'vietnamese',
      techRequirements: generatedContent.techRequirements?.join(', ') || ''
    }));

    setGeneratedContent(null);
    setActiveTab("manual");
  };

  const handleSelectTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setFormState(prev => ({
      ...prev,
      title: template.template.title,
      description: template.template.description,
      content: JSON.stringify(template.template.content, null, 2),
      objectives: template.template.objectives?.join('\n') || '',
      rubric: template.template.rubric ? JSON.stringify(template.template.rubric, null, 2) : '',
      tags: template.template.tags?.join(', ') || '',
      contentType: template.contentType,
      durationMinutes: template.template.estimatedDuration || 30
    }));
  };

  const handleGenerateRubric = () => {
    if (!formState.objectives.trim()) {
      toast({ title: "Thiếu mục tiêu", description: "Vui lòng nhập mục tiêu học tập trước.", variant: "destructive" });
      return;
    }

    const objectives = formState.objectives.split('\n').filter(obj => obj.trim());
    generateRubricMutation.mutate({
      objectives,
      level: formState.level || 'B1',
      skill: formState.skill || undefined
    });
  };

  const assignmentTemplates = getTemplatesByType('assignment');

  // Helper functions for content display
  const isJsonContent = (content: string): boolean => {
    if (!content) return false;
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  };

  const formatJsonContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === 'object' && parsed !== null) {
        // Format structured content
        let formatted = '';
        if (parsed.instructions) {
          formatted += `📝 Hướng dẫn:\n${parsed.instructions}\n\n`;
        }
        if (parsed.materials && Array.isArray(parsed.materials) && parsed.materials.length > 0) {
          formatted += `🛠️ Vật liệu cần thiết:\n${parsed.materials.map((item: string) => `• ${item}`).join('\n')}\n\n`;
        }
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          formatted += `❓ Câu hỏi:\n${parsed.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n\n`;
        }
        if (parsed.examples && Array.isArray(parsed.examples) && parsed.examples.length > 0) {
          formatted += `💡 Ví dụ:\n${parsed.examples.map((ex: string) => `• ${ex}`).join('\n')}\n\n`;
        }
        return formatted.trim() || JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen, resetForm]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="relative md:max-w-md">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm bài tập theo tiêu đề, mô tả..."
            className="pl-11 h-12 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-full md:w-auto">
            <Label className="text-xs text-muted-foreground">Trình độ</Label>
            <Select value={filters.level} onValueChange={setLevel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Tất cả" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-xs text-muted-foreground">Kỹ năng</Label>
            <Select value={filters.skill} onValueChange={setSkill}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {skillOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Tất cả" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-xs text-muted-foreground">Loại bài tập</Label>
            <Select value={filters.type} onValueChange={setType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Tất cả" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-xs text-muted-foreground">Độ khó</Label>
            <Select value={filters.difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Tất cả" : option === "easy" ? "Dễ" : option === "medium" ? "Trung bình" : "Khó"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <Label className="text-xs text-muted-foreground">Hiển thị</Label>
            <Select value={filters.visibility} onValueChange={setVisibility}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "Tất cả" : option === "public" ? "Công khai" : "Riêng tư"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 px-2 py-1 rounded-md border bg-white">
            <Switch id="ownerOnly" checked={filters.ownerOnly} onCheckedChange={setOwnerOnly} />
            <Label htmlFor="ownerOnly" className="text-xs text-muted-foreground">Chỉ của tôi</Label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : assignments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed rounded-xl">
          <p className="text-lg text-muted-foreground mb-2">Chưa có bài tập nào</p>
          <p className="text-sm text-muted-foreground">
            Hãy nhấn "Tạo mới" để thêm bài tập đầu tiên cho trung tâm.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Trang {pagination.page} / {Math.max(1, pagination.totalPages)}
          {isFetching && " • Đang tải..."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                Tạo với AI
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <FileTextIcon className="h-4 w-4" />
                Từ Template
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Tạo mới
              </TabsTrigger>
            </TabsList>

            {/* AI Generation Tab */}
            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chủ đề</Label>
                  <Input
                    value={formState.aiTopic}
                    onChange={(event) => setFormState((prev) => ({ ...prev, aiTopic: event.target.value }))}
                    placeholder="Ví dụ: Môi trường, Công nghệ, Văn hóa..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cấp độ</Label>
                  <Select
                    value={formState.aiLevel}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, aiLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.filter((option) => option !== "all").map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kỹ năng</Label>
                  <Select
                    value={formState.aiSkill}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, aiSkill: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỹ năng (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillOptions.filter((option) => option !== "all").map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loại bài tập</Label>
                  <Select
                    value={formState.aiContentType}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, aiContentType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Trắc nghiệm (MCQ)</SelectItem>
                      <SelectItem value="true_false">Đúng/Sai</SelectItem>
                      <SelectItem value="matching">Ghép đôi</SelectItem>
                      <SelectItem value="essay">Bài luận</SelectItem>
                      <SelectItem value="speaking">Thuyết trình</SelectItem>
                      <SelectItem value="reading">Đọc hiểu</SelectItem>
                      <SelectItem value="audio">Bài nghe</SelectItem>
                      <SelectItem value="project">Dự án</SelectItem>
                      <SelectItem value="worksheet">Bài tập thực hành</SelectItem>
                      <SelectItem value="presentation">Bài thuyết trình</SelectItem>
                      <SelectItem value="quiz">Bài kiểm tra</SelectItem>
                      <SelectItem value="diagnostic">Bài chẩn đoán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateContent}
                disabled={generateContentMutation.isPending}
                className="w-full">
                <SparklesIcon className="mr-2 h-4 w-4" />
                {generateContentMutation.isPending ? "Đang tạo..." : "Tạo với AI"}
              </Button>

              {generatedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nội dung đã tạo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="font-medium">Tiêu đề:</Label>
                      <p className="text-sm text-muted-foreground">{generatedContent.title}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Mô tả:</Label>
                      <p className="text-sm text-muted-foreground">{generatedContent.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleApplyGeneratedContent} size="sm">
                        Sử dụng nội dung này
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratedContent(null)}>
                        Tạo lại
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Template Tab */}
            <TabsContent value="template" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignmentTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {template.level}
                        </Badge>
                        {template.skill && (
                          <Badge variant="outline" className="text-xs">
                            {template.skill}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Template đã chọn: {selectedTemplate.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Template sẽ được áp dụng vào form tạo bài tập.
                    </p>
                    <Button onClick={() => setActiveTab("manual")}>
                      Tiếp tục chỉnh sửa
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Manual Creation Tab */}
            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-title">Tiêu đề</Label>
                    <Input
                      id="assignment-title"
                      value={formState.title}
                      onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Ví dụ: Luyện đọc - Công nghệ số"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loại nội dung</Label>
                    <Select
                      value={formState.contentType}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, contentType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại nội dung" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Trắc nghiệm (MCQ)</SelectItem>
                        <SelectItem value="true_false">Đúng/Sai</SelectItem>
                        <SelectItem value="matching">Ghép đôi</SelectItem>
                        <SelectItem value="essay">Bài luận</SelectItem>
                        <SelectItem value="speaking">Thuyết trình</SelectItem>
                        <SelectItem value="reading">Đọc hiểu</SelectItem>
                        <SelectItem value="audio">Bài nghe</SelectItem>
                        <SelectItem value="project">Dự án</SelectItem>
                        <SelectItem value="worksheet">Bài tập thực hành</SelectItem>
                        <SelectItem value="presentation">Bài thuyết trình</SelectItem>
                        <SelectItem value="quiz">Bài kiểm tra</SelectItem>
                        <SelectItem value="diagnostic">Bài chẩn đoán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Trình độ</Label>
                    <Select
                      value={formState.level || UNSET_OPTION}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, level: value === UNSET_OPTION ? '' : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trình độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNSET_OPTION}>Không xác định</SelectItem>
                        {levelOptions
                          .filter((option) => option !== "all")
                          .map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kỹ năng chính</Label>
                    <Select
                      value={formState.skill || UNSET_OPTION}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, skill: value === UNSET_OPTION ? '' : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kỹ năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNSET_OPTION}>Không xác định</SelectItem>
                        {skillOptions
                          .filter((option) => option !== "all")
                          .map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Thời lượng (phút)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formState.durationMinutes}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))}>
                      required
                    </Input>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Hiển thị</Label>
                    <Select
                      value={formState.visibility}
                      onValueChange={(value: Visibility) =>
                        setFormState((prev) => ({ ...prev, visibility: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quyền hiển thị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Riêng tư</SelectItem>
                        <SelectItem value="campus">Trường học</SelectItem>
                        <SelectItem value="tenant">Tổ chức</SelectItem>
                        <SelectItem value="public">Công khai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <Select
                      value={formState.language}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
                        <SelectItem value="english">Tiếng Anh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Yêu cầu kỹ thuật</Label>
                    <Input
                      value={formState.techRequirements}
                      onChange={(event) => setFormState((prev) => ({ ...prev, techRequirements: event.target.value }))}
                      placeholder="Ví dụ: Máy tính, tai nghe..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={formState.description}
                    onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Tóm tắt nội dung, yêu cầu hoặc tiêu chí đánh giá"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mục tiêu học tập</Label>
                  <Textarea
                    value={formState.objectives}
                    onChange={(event) => setFormState((prev) => ({ ...prev, objectives: event.target.value }))}
                    placeholder="Mỗi mục tiêu trên một dòng"
                    rows={3}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRubric}
                    disabled={generateRubricMutation.isPending}>
                    <Wand2Icon className="mr-2 h-4 w-4" />
                    {generateRubricMutation.isPending ? "Đang tạo..." : "Tạo Rubric với AI"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Nội dung chi tiết</Label>
                  <ContentEditor
                    value={formState.content}
                    onChange={(value) => setFormState((prev) => ({ ...prev, content: value }))}
                    contentType={formState.contentType}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rubric</Label>
                  <RubricEditor
                    value={formState.rubric}
                    onChange={(value) => setFormState((prev) => ({ ...prev, rubric: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thẻ (ngăn cách bằng dấu phẩy)</Label>
                  <Input
                    value={formState.tags}
                    onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
                    placeholder="Ví dụ: Từ học, Công nghệ, Tranh luận"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAssignment ? "Lưu thay đổi" : "Tạo bài tập"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
    </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài tập?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài tập sẽ bị ẩn khỏi danh sách và tất cả lớp học liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

AssignmentsBank.displayName = "AssignmentsBank";

export default AssignmentsBank;
