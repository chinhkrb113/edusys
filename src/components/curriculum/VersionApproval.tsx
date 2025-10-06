"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { versionService } from "@/services/versionService";
import { approvalsService } from "@/services/approvalsService";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GitBranchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  MessageSquareIcon,
  EyeIcon,
  DownloadIcon,
  SendIcon,
  AlertTriangleIcon,
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  TrendingUpIcon,
  ShieldIcon,
  LockIcon,
  UnlockIcon,
  RotateCcwIcon,
  PlayCircleIcon,
  ArchiveIcon,
  FileTextIcon,
  DiffIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Version {
  id: string;
  programId: string | number;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  changes: string;
  reviewers: string[];
  comments: Array<{
    id: string;
    user: string;
    text: string;
    date: string;
    resolved: boolean;
  }>;
  content: {
    courses: Array<{
      id: string;
      title: string;
      hours: number;
      units: Array<{
        id: string;
        title: string;
        duration: number;
        objectives: string[];
        skills: string[];
        assessment?: string;
      }>;
    }>;
  };
}

interface VersionDiff {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

interface RolloutPlan {
  id: string;
  name: string;
  scope: 'campus' | 'program' | 'global';
  targetIds: string[];
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  prerequisites: string[];
}

const mockVersions: Version[] = [
  {
    id: "v1.0",
    programId: "kct-001",
    status: "published",
    createdBy: "Nguyễn Văn A",
    createdAt: "2024-09-01",
    approvedBy: "Trần Thị B",
    approvedAt: "2024-09-15",
    changes: "Initial version with A1-B2 structure",
    reviewers: ["Trần Thị B", "Lê Văn C"],
    comments: [
      { id: "1", user: "Trần Thị B", text: "Approved with minor suggestions", date: "2024-09-10", resolved: true },
      { id: "2", user: "Lê Văn C", text: "Good structure, recommend adding more practice activities", date: "2024-09-12", resolved: true },
    ],
    content: {
      courses: [
        {
          id: "course-1",
          title: "Foundation Skills",
          hours: 60,
          units: [
            { id: "unit-1", title: "Greetings", duration: 90, objectives: ["Greet people"], skills: ["Speaking"] }
          ]
        }
      ]
    }
  },
  {
    id: "v1.1",
    programId: "kct-001",
    status: "approved",
    createdBy: "Nguyễn Văn A",
    createdAt: "2024-10-01",
    approvedBy: "Trần Thị B",
    approvedAt: "2024-10-10",
    changes: "Added more listening activities and updated CEFR mapping",
    reviewers: ["Trần Thị B"],
    comments: [
      { id: "3", user: "Trần Thị B", text: "Excellent improvements!", date: "2024-10-08", resolved: true },
    ],
    content: {
      courses: [
        {
          id: "course-1",
          title: "Foundation Skills",
          hours: 60,
          units: [
            { id: "unit-1", title: "Greetings", duration: 90, objectives: ["Greet people"], skills: ["Speaking", "Listening"] }
          ]
        }
      ]
    }
  },
  {
    id: "v1.2",
    programId: "kct-001",
    status: "pending_review",
    createdBy: "Nguyễn Văn A",
    createdAt: "2024-10-20",
    changes: "Updated assessment rubrics and added project-based activities",
    reviewers: ["Trần Thị B", "Lê Văn C"],
    comments: [],
    content: {
      courses: [
        {
          id: "course-1",
          title: "Foundation Skills",
          hours: 60,
          units: [
            { id: "unit-1", title: "Greetings", duration: 90, objectives: ["Greet people", "Project work"], skills: ["Speaking", "Listening"] }
          ]
        }
      ]
    }
  },
  {
    id: "v2.0",
    programId: "kct-001",
    status: "draft",
    createdBy: "Nguyễn Văn A",
    createdAt: "2024-10-25",
    changes: "Major revision: Extended to C1 level, added business English modules",
    reviewers: [],
    comments: [],
    content: {
      courses: [
        {
          id: "course-1",
          title: "Foundation Skills",
          hours: 60,
          units: [
            { id: "unit-1", title: "Greetings", duration: 90, objectives: ["Greet people"], skills: ["Speaking", "Listening"] }
          ]
        },
        {
          id: "course-2",
          title: "Business Communication",
          hours: 90,
          units: [
            { id: "unit-2", title: "Business Emails", duration: 120, objectives: ["Write business emails"], skills: ["Writing"] }
          ]
        }
      ]
    }
  },
];

const VersionApproval = () => {
  // Get curriculum ID from URL params or props (for now, use a default)
  const curriculumId = 1; // TODO: Get from URL params

  // State management
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState("");
  const [rolloutPlans, setRolloutPlans] = useState<RolloutPlan[]>([
    {
      id: "rollout-1",
      name: "Q4 2024 Rollout",
      scope: "campus",
      targetIds: ["campus-1", "campus-2"],
      scheduledDate: "2024-11-01",
      status: "scheduled",
      progress: 0,
      prerequisites: ["Complete QA testing", "Train instructors"]
    }
  ]);

  // Fetch versions for this curriculum
  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', curriculumId],
    queryFn: () => versionService.getVersionsByFramework(curriculumId),
    enabled: !!curriculumId,
  });

  const queryClient = useQueryClient();

  // Convert API data to component format
  const versions = React.useMemo(() => {
    if (versionsData?.data) {
      return versionsData.data.map((version: any) => ({
        id: version.version_no,
        programId: curriculumId,
        status: version.state,
        createdBy: version.created_by_name || 'Unknown',
        createdAt: new Date(version.created_at).toISOString().split('T')[0],
        approvedBy: version.updated_by_name,
        approvedAt: version.published_at ? new Date(version.published_at).toISOString().split('T')[0] : undefined,
        changes: version.changelog || 'No changelog',
        reviewers: [], // TODO: Get from approvals
        comments: [], // TODO: Get from comments API
        content: {
          courses: [] // TODO: Get course data
        }
      }));
    }
    return mockVersions; // Fallback
  }, [versionsData, curriculumId]);

  // Set initial selected version
  React.useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  const getStatusBadge = (status: Version['status']) => {
    const config = {
      draft: {
        label: "Bản nháp",
        icon: ClockIcon,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      pending_review: {
        label: "Chờ duyệt",
        icon: AlertTriangleIcon,
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
      approved: {
        label: "Đã duyệt",
        icon: CheckCircleIcon,
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      published: {
        label: "Đã xuất bản",
        icon: PlayCircleIcon,
        className: "bg-green-100 text-green-800 border-green-200",
      },
      archived: {
        label: "Lưu trữ",
        icon: ArchiveIcon,
        className: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };
    const current = config[status];
    const Icon = current.icon;
    return (
      <Badge variant="outline" className={`flex items-center gap-1.5 ${current.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {current.label}
      </Badge>
    );
  };

  const calculateVersionDiff = (currentVersion: Version, previousVersion?: Version): VersionDiff[] => {
    if (!previousVersion) return [];

    const diffs: VersionDiff[] = [];

    // Compare course count
    const currentCourses = currentVersion.content.courses.length;
    const previousCourses = previousVersion.content.courses.length;

    if (currentCourses !== previousCourses) {
      diffs.push({
        type: currentCourses > previousCourses ? 'added' : 'removed',
        field: 'courses',
        oldValue: previousCourses,
        newValue: currentCourses,
        description: `${Math.abs(currentCourses - previousCourses)} course(s) ${currentCourses > previousCourses ? 'added' : 'removed'}`
      });
    }

    // Compare total hours
    const currentHours = currentVersion.content.courses.reduce((sum, c) => sum + c.hours, 0);
    const previousHours = previousVersion.content.courses.reduce((sum, c) => sum + c.hours, 0);

    if (currentHours !== previousHours) {
      diffs.push({
        type: 'modified',
        field: 'totalHours',
        oldValue: previousHours,
        newValue: currentHours,
        description: `Total hours changed from ${previousHours}h to ${currentHours}h`
      });
    }

    // Compare units
    const currentUnits = currentVersion.content.courses.reduce((sum, c) => sum + c.units.length, 0);
    const previousUnits = previousVersion.content.courses.reduce((sum, c) => sum + c.units.length, 0);

    if (currentUnits !== previousUnits) {
      diffs.push({
        type: currentUnits > previousUnits ? 'added' : 'removed',
        field: 'units',
        oldValue: previousUnits,
        newValue: currentUnits,
        description: `${Math.abs(currentUnits - previousUnits)} unit(s) ${currentUnits > previousUnits ? 'added' : 'removed'}`
      });
    }

    return diffs;
  };

  const handleReviewAction = (action: string) => {
    if (action === 'approve') {
      setSelectedVersion(prev => ({ ...prev, status: 'approved', approvedBy: 'Current User', approvedAt: new Date().toISOString().split('T')[0] }));
    } else if (action === 'reject') {
      setSelectedVersion(prev => ({ ...prev, status: 'draft' }));
    }

    // Add comment
    if (reviewComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        user: "Current User",
        text: reviewComment.trim(),
        date: new Date().toISOString().split('T')[0],
        resolved: false,
      };
      setSelectedVersion(prev => ({
        ...prev,
        comments: [...prev.comments, comment]
      }));
    }

    setIsReviewDialogOpen(false);
    setReviewComment("");
    setReviewAction("");
  };

  const handlePublish = () => {
    setSelectedVersion(prev => ({ ...prev, status: 'published' }));
  };

  const handleRollback = (targetVersionId: string) => {
    const targetVersion = versions.find((v: any) => v.id === targetVersionId);
    if (targetVersion) {
      setSelectedVersion({ ...targetVersion, status: 'published' });
    }
  };

  const createRolloutPlan = () => {
    const newPlan: RolloutPlan = {
      id: `rollout-${Date.now()}`,
      name: `Rollout ${selectedVersion.id}`,
      scope: 'campus',
      targetIds: [],
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      progress: 0,
      prerequisites: []
    };
    setRolloutPlans(prev => [...prev, newPlan]);
  };

  const versionStats = useMemo(() => {
    const stats = {
      draft: versions.filter((v: any) => v.status === 'draft').length,
      pending_review: versions.filter((v: any) => v.status === 'pending_review').length,
      approved: versions.filter((v: any) => v.status === 'approved').length,
      published: versions.filter((v: any) => v.status === 'published').length,
      archived: versions.filter((v: any) => v.status === 'archived').length,
    };
    return stats;
  }, [versions]);

  const selectedVersionIndex = versions.findIndex((v: any) => v.id === selectedVersion?.id);
  const previousVersion = selectedVersionIndex > 0 ? versions[selectedVersionIndex - 1] : undefined;
  const versionDiffs = selectedVersion ? calculateVersionDiff(selectedVersion, previousVersion) : [];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{versionStats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{versionStats.pending_review}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{versionStats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PlayCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{versionStats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold">{versionStats.archived}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Versions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GitBranchIcon className="h-5 w-5" />
                Lịch sử phiên bản
              </span>
              <Button size="sm" onClick={() => setSelectedVersion({
                ...selectedVersion,
                id: `v${parseFloat(selectedVersion.id.slice(1)) + 0.1}`,
                status: 'draft',
                createdAt: new Date().toISOString().split('T')[0],
                changes: "New version created",
                comments: []
              })}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Tạo phiên bản mới
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.map((version: any) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedVersion?.id === version.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{version.id}</span>
                      {getStatusBadge(version.status)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {version.createdAt}
                    </span>
                  </div>

                  <p className="text-sm mb-2">{version.changes}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tạo bởi: {version.createdBy}</span>
                    <div className="flex items-center gap-2">
                      <MessageSquareIcon className="h-3 w-3" />
                      <span>{version.comments.length}</span>
                      <UsersIcon className="h-3 w-3 ml-2" />
                      <span>{version.reviewers.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Version Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chi tiết phiên bản {selectedVersion?.id}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <EyeIcon className="mr-1 h-3 w-3" />
                  Preview
                </Button>
                <Button size="sm" variant="outline">
                  <DownloadIcon className="mr-1 h-3 w-3" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
                <TabsTrigger value="diff">So sánh</TabsTrigger>
                <TabsTrigger value="comments">Nhận xét</TabsTrigger>
                <TabsTrigger value="actions">Thao tác</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {selectedVersion ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Trạng thái</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedVersion.status)}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Người tạo</Label>
                      <p className="mt-1 text-sm">{selectedVersion.createdBy}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Ngày tạo</Label>
                      <p className="mt-1 text-sm">{selectedVersion.createdAt}</p>
                    </div>

                    {selectedVersion.approvedBy && (
                      <div>
                        <Label className="text-sm font-medium">Người duyệt</Label>
                        <p className="mt-1 text-sm">{selectedVersion.approvedBy}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chọn một phiên bản để xem chi tiết</p>
                  </div>
                )}

                {selectedVersion && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Thay đổi</Label>
                      <p className="mt-1 text-sm">{selectedVersion.changes}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Reviewers</Label>
                      <div className="mt-1 flex gap-1">
                        {selectedVersion.reviewers.map((reviewer, idx) => (
                          <Badge key={idx} variant="outline">{reviewer}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Content Summary */}
                    <div>
                      <Label className="text-sm font-medium">Tóm tắt nội dung</Label>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedVersion.content.courses.length}
                          </div>
                          <div className="text-muted-foreground">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedVersion.content.courses.reduce((sum, c) => sum + c.units.length, 0)}
                          </div>
                          <div className="text-muted-foreground">Units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedVersion.content.courses.reduce((sum, c) => sum + c.hours, 0)}
                          </div>
                          <div className="text-muted-foreground">Hours</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="diff" className="space-y-4">
                {previousVersion ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DiffIcon className="h-4 w-4" />
                      <span className="font-medium">So sánh với {previousVersion.id}</span>
                    </div>

                    {versionDiffs.length > 0 ? (
                      <div className="space-y-2">
                        {versionDiffs.map((diff, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            diff.type === 'added' ? 'bg-green-50 border-green-200' :
                            diff.type === 'removed' ? 'bg-red-50 border-red-200' :
                            'bg-blue-50 border-blue-200'
                          }`}>
                            <div className="flex items-center gap-2">
                              {diff.type === 'added' && <PlusIcon className="h-4 w-4 text-green-600" />}
                              {diff.type === 'removed' && <XCircleIcon className="h-4 w-4 text-red-600" />}
                              {diff.type === 'modified' && <AlertTriangleIcon className="h-4 w-4 text-blue-600" />}
                              <span className="font-medium capitalize">{diff.field}</span>
                            </div>
                            <p className="text-sm mt-1">{diff.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Không có thay đổi đáng kể</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Đây là phiên bản đầu tiên</p>
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                {selectedVersion ? (
                  <div className="space-y-3">
                    {selectedVersion.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">{comment.user}</span>
                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(prev => ({
                                ...prev,
                                comments: prev.comments.map(c =>
                                  c.id === comment.id ? { ...c, resolved: !c.resolved } : c
                                )
                              }));
                            }}
                          >
                            {comment.resolved ? <CheckCircleIcon className="h-3 w-3 text-green-500" /> : <XCircleIcon className="h-3 w-3" />}
                          </Button>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}

                    {selectedVersion.comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có nhận xét nào
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chọn một phiên bản để xem nhận xét</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                {selectedVersion ? (
                  <div className="space-y-2">
                    {selectedVersion.status === 'draft' && (
                      <Button className="w-full" onClick={() => setSelectedVersion(prev => ({ ...prev, status: 'pending_review' }))}>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Gửi duyệt
                      </Button>
                    )}

                    {selectedVersion.status === 'pending_review' && (
                      <div className="space-y-2">
                        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                              <MessageSquareIcon className="mr-2 h-4 w-4" />
                              Thêm nhận xét
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Thêm nhận xét cho phiên bản {selectedVersion.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Hành động</Label>
                                <Select value={reviewAction} onValueChange={setReviewAction}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn hành động" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approve">Duyệt</SelectItem>
                                    <SelectItem value="reject">Từ chối</SelectItem>
                                    <SelectItem value="comment">Chỉ nhận xét</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Nhận xét</Label>
                                <Textarea
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  placeholder="Nhập nhận xét của bạn..."
                                  rows={4}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReviewAction(reviewAction)}
                                  disabled={!reviewAction}
                                  className="flex-1"
                                >
                                  Gửi
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsReviewDialogOpen(false)}
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button className="w-full" onClick={() => handleReviewAction('approve')}>
                          <CheckCircleIcon className="mr-2 h-4 w-4" />
                          Duyệt phiên bản
                        </Button>
                      </div>
                    )}

                    {selectedVersion.status === 'approved' && (
                      <div className="space-y-2">
                        <Button className="w-full" onClick={handlePublish}>
                          <PlayCircleIcon className="mr-2 h-4 w-4" />
                          Xuất bản
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" variant="outline">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Lên lịch rollout
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Lên lịch rollout cho {selectedVersion.id}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Scope</Label>
                                <Select defaultValue="campus">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="campus">Campus</SelectItem>
                                    <SelectItem value="program">Program</SelectItem>
                                    <SelectItem value="global">Global</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Scheduled Date</Label>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                              </div>

                              <Button onClick={createRolloutPlan} className="w-full">
                                Tạo rollout plan
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}

                    {selectedVersion.status === 'published' && (
                      <div className="space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <RotateCcwIcon className="mr-2 h-4 w-4" />
                              Rollback
                          </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rollback phiên bản</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Label>Chọn phiên bản để rollback</Label>
                              <Select onValueChange={handleRollback}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn phiên bản" />
                                </SelectTrigger>
                                <SelectContent>
                                  {versions
                                    .filter((v: any) => v.status === 'published' && v.id !== selectedVersion?.id)
                                    .map((v: any) => (
                                      <SelectItem key={v.id} value={v.id}>{v.id}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" className="w-full">
                          <ArchiveIcon className="mr-2 h-4 w-4" />
                          Archive
                        </Button>
                      </div>
                    )}

                    <Button variant="outline" className="w-full">
                      <GitBranchIcon className="mr-2 h-4 w-4" />
                      Tạo phiên bản mới
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chọn một phiên bản để xem thao tác</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Rollout Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Rollout Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rolloutPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  <Badge variant={
                    plan.status === 'completed' ? 'default' :
                    plan.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {plan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Scope:</span>
                    <span className="ml-1 capitalize">{plan.scope}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="ml-1">{plan.scheduledDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Targets:</span>
                    <span className="ml-1">{plan.targetIds.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="ml-1">{plan.progress}%</span>
                  </div>
                </div>

                {plan.prerequisites.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Prerequisites:</span>
                    <div className="flex gap-1 mt-1">
                      {plan.prerequisites.map((prereq, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plan.status === 'in_progress' && (
                  <Progress value={plan.progress} className="mt-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VersionApproval;