"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { unitService } from "@/services/unitService";
import { courseService } from "@/services/courseService";
import { versionService } from "@/services/versionService";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  PlusCircleIcon,
  GripVerticalIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  EyeIcon,
  BookOpenIcon,
  TargetIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  BotIcon,
  MessageSquareIcon,
  UsersIcon,
  CopyIcon,
  SplitIcon,
  MergeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sample data structure
const sampleProgram = {
  id: "kct-001",
  name: "Business English B1-B2",
  level: "B1-B2",
  ageGroup: "Adults",
  programType: "Business Communication",
  totalHours: 150,
  courses: [
    {
      id: "course-1",
      title: "Business Communication Fundamentals",
      level: "B1",
      hours: 60,
      order: 1,
      units: [
        {
          id: "unit-1",
          title: "Email Writing",
          duration: 90,
          order: 1,
          objectives: ["Write professional emails", "Use appropriate business language"],
          skills: ["Writing", "Grammar"],
          activities: [
            { type: "Individual", name: "Email drafting exercise", duration: 30 },
            { type: "Group", name: "Peer review session", duration: 30 },
            { type: "Class", name: "Email etiquette discussion", duration: 30 },
          ],
          resources: [
            { type: "PDF", name: "Business Email Templates", url: "#" },
            { type: "Video", name: "Email Writing Tips", url: "#" },
          ],
          assessment: {
            type: "Written",
            rubric: [
              { criterion: "Content", weight: 40, levels: ["Poor", "Fair", "Good", "Excellent"] },
              { criterion: "Language", weight: 35, levels: ["Poor", "Fair", "Good", "Excellent"] },
              { criterion: "Format", weight: 25, levels: ["Poor", "Fair", "Good", "Excellent"] },
            ],
            passingScore: 70,
          },
          homework: "Write a business email to a client",
          completeness: 95,
          comments: [
            { id: "1", user: "Alice", text: "Good structure, consider adding more examples", date: "2024-01-15", resolved: false },
            { id: "2", user: "Bob", text: "Rubric looks comprehensive", date: "2024-01-16", resolved: true },
          ],
        },
        {
          id: "unit-2",
          title: "Presentation Skills",
          duration: 120,
          order: 2,
          objectives: ["Deliver effective presentations", "Handle Q&A sessions"],
          skills: ["Speaking", "Listening"],
          activities: [
            { type: "Individual", name: "Presentation preparation", duration: 45 },
            { type: "Group", name: "Presentation delivery", duration: 45 },
            { type: "Class", name: "Feedback session", duration: 30 },
          ],
          resources: [
            { type: "Slide", name: "Presentation Tips", url: "#" },
            { type: "Video", name: "TED Talk Examples", url: "#" },
          ],
          assessment: {
            type: "Oral",
            rubric: [
              { criterion: "Content", weight: 40, levels: ["Poor", "Fair", "Good", "Excellent"] },
              { criterion: "Delivery", weight: 35, levels: ["Poor", "Fair", "Good", "Excellent"] },
              { criterion: "Q&A Handling", weight: 25, levels: ["Poor", "Fair", "Good", "Excellent"] },
            ],
            passingScore: 75,
          },
          homework: "Prepare a 5-minute presentation",
          completeness: 88,
          comments: [],
        },
      ],
    },
    {
      id: "course-2",
      title: "Advanced Business Writing",
      level: "B2",
      hours: 90,
      order: 2,
      units: [],
    },
  ],
};

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  field: string;
}

interface Unit {
  id: string;
  title: string;
  duration: number;
  order: number;
  objectives: string[];
  skills: string[];
  activities: Array<{
    type: string;
    name: string;
    duration: number;
  }>;
  resources: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  assessment: {
    type: string;
    rubric: Array<{
      criterion: string;
      weight: number;
      levels: string[];
    }>;
    passingScore: number;
  } | null;
  homework: string;
  completeness: number;
  comments: Array<{
    id: string;
    user: string;
    text: string;
    date: string;
    resolved: boolean;
  }>;
}

interface DraggedItem {
  item: Unit | Course;
  type: string;
}

interface Course {
  id: string;
  title: string;
  level: string;
  hours: number;
  order: number;
  units: Unit[];
}

const StructureEditor = () => {
  // Get curriculum ID from URL params or props (for now, use a default)
  const curriculumId = 1; // TODO: Get from URL params

  // Fetch curriculum details
  const { data: curriculumData, isLoading: curriculumLoading } = useQuery({
    queryKey: ['curriculum', curriculumId],
    queryFn: () => curriculumService.getCurriculum(curriculumId),
    enabled: !!curriculumId,
  });

  // State management
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  // Fetch versions for this curriculum
  const { data: versionsData } = useQuery({
    queryKey: ['versions', curriculumId],
    queryFn: () => versionService.getVersionsByFramework(curriculumId),
    enabled: !!curriculumId,
  });

  // Get latest version
  const latestVersion = versionsData?.data?.find((v: any) => v.state === 'published') ||
                        versionsData?.data?.find((v: any) => v.state === 'approved') ||
                        versionsData?.data?.[0];

  // Fetch courses for latest version
  const { data: coursesData } = useQuery({
    queryKey: ['courses', latestVersion?.id],
    queryFn: () => courseService.getCoursesByVersion(latestVersion!.id),
    enabled: !!latestVersion?.id,
  });

  // Fetch units for selected course
  const { data: unitsData } = useQuery({
    queryKey: ['units', selectedCourse?.id],
    queryFn: () => unitService.getUnitsByCourse(selectedCourse!.id),
    enabled: !!selectedCourse?.id,
  });

  const queryClient = useQueryClient();

  // Update mutations
  const updateUnitMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => unitService.updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', selectedCourse?.id] });
      toast({ title: "Unit updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update unit", variant: "destructive" });
    }
  });

  // Set initial selected course and unit when data loads
  React.useEffect(() => {
    if (coursesData && !selectedCourse) {
      setSelectedCourse(coursesData[0]);
    }
  }, [coursesData, selectedCourse]);

  React.useEffect(() => {
    if (unitsData && !selectedUnit) {
      setSelectedUnit(unitsData[0]);
    }
  }, [unitsData, selectedUnit]);

  // Fallback to sample data if API fails
  const program = React.useMemo(() => {
    if (curriculumData && latestVersion && coursesData) {
      return {
        id: curriculumData.id,
        name: curriculumData.name,
        level: curriculumData.target_level || 'B1',
        ageGroup: curriculumData.age_group || 'Adults',
        programType: curriculumData.language,
        totalHours: curriculumData.total_hours,
        courses: coursesData.map((course: any) => ({
          id: course.id,
          title: course.title,
          level: course.level || curriculumData.target_level,
          hours: course.hours,
          order: course.order_index,
          units: unitsData || []
        }))
      };
    }
    return sampleProgram; // Fallback
  }, [curriculumData, latestVersion, coursesData, unitsData]);

  // Calculate completeness score
  const calculateCompleteness = useCallback((unit: Unit) => {
    const fields = [
      unit.objectives?.length > 0,
      unit.skills?.length > 0,
      unit.activities?.length > 0,
      unit.resources?.length > 0,
      unit.assessment,
      unit.homework,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, []);

  // Real-time validation
  const validateUnit = useCallback((unit: Unit): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check objectives
    if (!unit.objectives || unit.objectives.length === 0) {
      errors.push({
        type: 'error',
        message: 'Unit phải có ít nhất 1 mục tiêu học tập',
        field: 'objectives'
      });
    }

    // Check skills
    if (!unit.skills || unit.skills.length === 0) {
      errors.push({
        type: 'warning',
        message: 'Nên chỉ định kỹ năng được phát triển',
        field: 'skills'
      });
    }

    // Check assessment
    if (!unit.assessment) {
      errors.push({
        type: 'error',
        message: 'Unit phải có phương pháp đánh giá',
        field: 'assessment'
      });
    }

    // Check resources
    if (!unit.resources || unit.resources.length === 0) {
      errors.push({
        type: 'warning',
        message: 'Nên có tài liệu đính kèm',
        field: 'resources'
      });
    }

    // Check duration vs activities
    const totalActivityDuration = unit.activities?.reduce((sum: number, act) => sum + act.duration, 0) || 0;
    if (totalActivityDuration > unit.duration) {
      errors.push({
        type: 'error',
        message: `Tổng thời gian hoạt động (${totalActivityDuration}min) vượt quá thời gian unit (${unit.duration}min)`,
        field: 'duration'
      });
    }

    return errors;
  }, []);

  // AI suggestions for CEFR mapping
  const getAISuggestions = useCallback((unit: Unit) => {
    const suggestions = {
      objectives: [
        "Map to CEFR B1.2: Can understand main points of clear standard input",
        "Include practical application objectives"
      ],
      skills: ["Consider adding 'Presentation' skill for business context"],
      activities: [
        "Add peer feedback activity",
        "Include real-world business scenarios"
      ],
      assessment: "Use CEFR-aligned rubric for speaking assessment",
    };
    return suggestions;
  }, []);

  const handleDragStart = (e: React.DragEvent, item: Unit | Course, type: string) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: Unit | Course, targetType: string) => {
    e.preventDefault();

    if (!draggedItem) return;

    // Handle reordering logic here
    console.log('Dropped', draggedItem, 'onto', targetItem, targetType);
    setDraggedItem(null);
  };

  const addNewUnit = async (courseId: number) => {
    try {
      const newUnitData = {
        title: "Unit mới",
        objectives: [],
        skills: [],
        activities: [],
        duration: 90,
        order_index: selectedCourse?.units?.length + 1 || 1,
      };

      const result = await unitService.createUnit(courseId, newUnitData);
      queryClient.invalidateQueries({ queryKey: ['units', courseId] });
      setSelectedUnit(result);
      toast({ title: "Unit created successfully" });
    } catch (error) {
      toast({ title: "Failed to create unit", variant: "destructive" });
    }
  };

  const addComment = (unitId: string, text: string) => {
    if (!text.trim()) return;

    // For now, just update local state since comments API is not implemented yet
    const comment = {
      id: Date.now().toString(),
      user: "Current User",
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
      resolved: false,
    };

    // Update local state temporarily
    setSelectedUnit(prev => prev ? {
      ...prev,
      comments: [...(prev.comments || []), comment]
    } : null);

    setNewComment("");
    setShowCommentDialog(false);
  };

  const toggleCommentResolved = (unitId: string, commentId: string) => {
    // Update local state temporarily
    setSelectedUnit(prev => prev ? {
      ...prev,
      comments: prev.comments?.map(comment =>
        comment.id === commentId
          ? { ...comment, resolved: !comment.resolved }
          : comment
      ) || []
    } : null);
  };

  const selectedUnitValidation = selectedUnit ? validateUnit(selectedUnit) : [];
  const aiSuggestions = selectedUnit ? getAISuggestions(selectedUnit) : {};

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Pane 1: Tree Structure */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Cấu trúc KCT
              </span>
              <Button size="sm" variant="outline" onClick={() => addNewUnit(selectedCourse.id)}>
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                Course
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {program.courses?.map((course) => (
                  <div key={course?.id || Math.random()} className="space-y-1">
                    <div
                      className={`p-2 rounded cursor-pointer hover:bg-gray-100 border ${
                        selectedCourse?.id === course?.id ? "bg-blue-50 border-blue-200" : "border-transparent"
                      }`}
                      onClick={() => setSelectedCourse(course)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, course, 'course')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, course, 'course')}
                    >
                      <div className="flex items-center gap-2">
                        <GripVerticalIcon className="h-4 w-4 text-gray-400 cursor-move" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {course.level} • {course.hours}h • {course.units.length} units
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontalIcon className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => addNewUnit(course.id)}>
                              <PlusCircleIcon className="h-4 w-4 mr-2" />
                              Thêm Unit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CopyIcon className="h-4 w-4 mr-2" />
                              Nhân bản
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {selectedCourse?.id === course?.id && (
                      <div className="ml-6 space-y-1">
                        {course?.units?.map((unit) => {
                          const completeness = calculateCompleteness(unit);
                          const validationErrors = validateUnit(unit);
                          const hasErrors = validationErrors.some(e => e.type === 'error');

                          return (
                            <div
                              key={unit.id}
                              className={`p-2 rounded cursor-pointer hover:bg-gray-100 border ${
                                selectedUnit?.id === unit.id ? "bg-blue-50 border-blue-200" : "border-transparent"
                              }`}
                              onClick={() => setSelectedUnit(unit)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, unit, 'unit')}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, unit, 'unit')}
                            >
                              <div className="flex items-center gap-2">
                                <GripVerticalIcon className="h-3 w-3 text-gray-400 cursor-move" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium">{unit.title}</p>
                                    {hasErrors && <XCircleIcon className="h-3 w-3 text-red-500" />}
                                    {!hasErrors && completeness >= 80 && <CheckCircleIcon className="h-3 w-3 text-green-500" />}
                                    {!hasErrors && completeness < 80 && <AlertTriangleIcon className="h-3 w-3 text-yellow-500" />}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    <span className="text-xs text-muted-foreground">{unit.duration}min</span>
                                    <span className={`text-xs ${
                                      completeness >= 80 ? "text-green-600" :
                                      completeness >= 60 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                      {completeness}%
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCommentDialog(true);
                                    }}
                                  >
                                    <MessageSquareIcon className="h-3 w-3" />
                                    {unit.comments.length}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pane 2: Canvas Editor */}
      <div className="col-span-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Canvas chỉnh sửa</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? <SaveIcon className="h-4 w-4 mr-1" /> : <EditIcon className="h-4 w-4 mr-1" />}
                  {isEditing ? "Lưu" : "Chỉnh sửa"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUnit ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {/* Validation Errors */}
                  {selectedUnitValidation.length > 0 && (
                    <Alert>
                      <AlertTriangleIcon className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          {selectedUnitValidation.map((error, idx) => (
                            <div key={idx} className={`text-sm ${
                              error.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              • {error.message}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Unit Header */}
                  <div className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TargetIcon className="h-5 w-5" />
                      <h3 className="text-lg font-semibold">{selectedUnit.title}</h3>
                      <Badge variant="outline">{selectedUnit.duration} phút</Badge>
                    </div>
                    <div className="flex gap-2">
                      {selectedUnit.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Objectives */}
                  <div>
                    <Label className="text-sm font-medium">Mục tiêu học tập</Label>
                    {isEditing ? (
                      <Textarea
                        value={selectedUnit.objectives?.join("\n") || ""}
                        onChange={(e) => {
                          const objectives = e.target.value.split("\n").filter(Boolean);
                          setSelectedUnit(prev => prev ? { ...prev, objectives } : null);
                        }}
                        className="mt-1"
                        rows={3}
                        placeholder="Nhập mục tiêu học tập, mỗi dòng một mục tiêu..."
                      />
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {selectedUnit.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Separator />

                  {/* Activities */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Hoạt động</Label>
                      {isEditing && (
                        <Button size="sm" variant="outline">
                          <PlusCircleIcon className="h-3 w-3 mr-1" />
                          Thêm hoạt động
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedUnit.activities.map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Badge variant={
                            activity.type === "Class" ? "default" :
                            activity.type === "Group" ? "secondary" : "outline"
                          }>
                            {activity.type}
                          </Badge>
                          <span className="text-sm flex-1">{activity.name}</span>
                          <span className="text-xs text-muted-foreground">{activity.duration}min</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Resources */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Tài nguyên</Label>
                      {isEditing && (
                        <Button size="sm" variant="outline">
                          <PlusCircleIcon className="h-3 w-3 mr-1" />
                          Thêm tài nguyên
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {selectedUnit.resources.map((resource, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileTextIcon className="h-4 w-4" />
                          <span className="text-sm">{resource.name}</span>
                          <Badge variant="outline">{resource.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Assessment & Homework */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Đánh giá</Label>
                      {isEditing ? (
                        <Textarea
                          value={selectedUnit.assessment ? `${selectedUnit.assessment.type}: ${selectedUnit.assessment.passingScore}% passing` : ""}
                          onChange={(e) => {
                            // Handle assessment editing
                          }}
                          className="mt-1"
                          rows={3}
                          placeholder="Mô tả phương pháp đánh giá..."
                        />
                      ) : (
                        <div className="mt-1 text-sm">
                          {selectedUnit.assessment ? (
                            <div>
                              <p><strong>Loại:</strong> {selectedUnit.assessment.type}</p>
                              <p><strong>Điểm qua:</strong> {selectedUnit.assessment.passingScore}%</p>
                            </div>
                          ) : (
                            "Chưa có phương pháp đánh giá"
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Bài tập về nhà</Label>
                      {isEditing ? (
                        <Input
                          value={selectedUnit.homework || ""}
                          onChange={(e) => {
                            setSelectedUnit(prev => prev ? { ...prev, homework: e.target.value } : null);
                          }}
                          className="mt-1"
                          placeholder="Mô tả bài tập về nhà..."
                        />
                      ) : (
                        <p className="mt-1 text-sm">{selectedUnit.homework || "Chưa có bài tập về nhà"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Chọn một Unit để chỉnh sửa</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pane 3: Properties & AI Suggestions */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Properties & AI</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="properties">Thuộc tính</TabsTrigger>
                  <TabsTrigger value="ai-suggestions">AI Gợi ý</TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">CEFR Level</Label>
                    <Input value={selectedCourse?.level} className="mt-1" readOnly />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Thời lượng (phút)</Label>
                    <Input
                      type="number"
                      value={selectedUnit?.duration || 0}
                      onChange={(e) => selectedUnit && setSelectedUnit(prev => prev ? { ...prev, duration: parseInt(e.target.value) } : null)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Kỹ năng</Label>
                    <div className="mt-1 space-y-1">
                      {["Listening", "Speaking", "Reading", "Writing", "Grammar", "Vocabulary", "Presentation"].map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={skill}
                            checked={selectedUnit?.skills.includes(skill)}
                            onChange={(e) => {
                              if (!selectedUnit) return;
                              const skills = e.target.checked
                                ? [...selectedUnit.skills, skill]
                                : selectedUnit.skills.filter(s => s !== skill);
                              setSelectedUnit(prev => prev ? { ...prev, skills } : null);
                            }}
                          />
                          <Label htmlFor={skill} className="text-sm">{skill}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Completeness Score</Label>
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedUnit ? calculateCompleteness(selectedUnit) : 0}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${
                          selectedUnit && calculateCompleteness(selectedUnit) >= 80 ? "text-green-600" :
                          selectedUnit && calculateCompleteness(selectedUnit) >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {selectedUnit ? calculateCompleteness(selectedUnit) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <Label className="text-sm font-medium">Comments ({selectedUnit?.comments.length})</Label>
                    <div className="mt-2 space-y-2">
                      {selectedUnit?.comments.map((comment) => (
                        <div key={comment.id} className="border rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-3 w-3" />
                              <span className="text-xs font-medium">{comment.user}</span>
                              <span className="text-xs text-muted-foreground">{comment.date}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCommentResolved(selectedUnit.id, comment.id)}
                            >
                              {comment.resolved ? <CheckCircleIcon className="h-3 w-3 text-green-500" /> : <XCircleIcon className="h-3 w-3" />}
                            </Button>
                          </div>
                          <p className="text-xs">{comment.text}</p>
                        </div>
                      ))}

                      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            Thêm comment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Thêm nhận xét</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Nhập nhận xét của bạn..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => selectedUnit && addComment(selectedUnit.id, newComment)}>
                                Gửi
                              </Button>
                              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                                Hủy
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ai-suggestions" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <BotIcon className="h-4 w-4" />
                      AI Suggestions
                    </Label>
                    {selectedUnit && (
                      <div className="mt-2 space-y-3">
                        {Object.entries(aiSuggestions).map(([key, suggestions]) => (
                          <div key={key} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-medium text-blue-800 capitalize mb-1">
                              {key}:
                            </div>
                            <div className="text-xs text-blue-700 space-y-1">
                              {Array.isArray(suggestions) ? (suggestions as string[]).map((s, i) => (
                                <div key={i}>• {s}</div>
                              )) : suggestions}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button size="sm" className="w-full" variant="outline">
                    <BotIcon className="mr-2 h-4 w-4" />
                    Generate AI Content
                  </Button>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StructureEditor;