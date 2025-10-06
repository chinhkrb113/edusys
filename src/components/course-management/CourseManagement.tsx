"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpenIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  LinkIcon,
  TargetIcon,
  ClockIcon,
  UsersIcon,
  FileTextIcon,
  BotIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BarChartIcon,
} from "lucide-react";

// Sample data
const sampleCourses = [
  {
    id: "course-001",
    name: "IELTS Preparation B2-C1",
    level: "B2-C1",
    program: "IELTS",
    modality: "offline",
    totalHours: 60,
    sessions: 20,
    status: "published",
    mappedKCT: ["kct-001"],
    units: [
      {
        id: "unit-1",
        title: "Introduction to IELTS Speaking",
        duration: 90,
        objectives: ["Understand IELTS speaking format", "Practice basic fluency"],
        lessonPlan: {
          warmup: "5 min icebreaker discussion",
          practice: "15 min pair work on common topics",
          assessment: "10 min individual speaking test",
          homework: "Record 2-min self-introduction"
        },
        resources: ["Speaking rubric", "Sample questions"],
        assessment: "Speaking Part 1 practice",
      },
      {
        id: "unit-2",
        title: "Describing People and Places",
        duration: 90,
        objectives: ["Use descriptive language", "Practice Part 2 format"],
        lessonPlan: {
          warmup: "Photo description game",
          practice: "Group discussion about cities",
          assessment: "2-min individual description",
          homework: "Write description of hometown"
        },
        resources: ["Vocabulary list", "Model answers"],
        assessment: "Part 2 cue card practice",
      },
    ],
    assessments: [
      { type: "pre-test", name: "Initial Speaking Assessment", rubric: "IELTS Speaking Rubric" },
      { type: "mid-term", name: "Progress Test", rubric: "Custom Rubric" },
      { type: "final", name: "Final IELTS Mock Test", rubric: "Official IELTS Rubric" },
    ],
    stats: {
      passRate: 78,
      completionRate: 85,
      avgFeedback: 4.2,
      enrolledClasses: 5,
    },
  },
  {
    id: "course-002",
    name: "Business English B1-B2",
    level: "B1-B2",
    program: "Business English",
    modality: "hybrid",
    totalHours: 40,
    sessions: 16,
    status: "draft",
    mappedKCT: ["kct-002"],
    units: [],
    assessments: [],
    stats: {
      passRate: 0,
      completionRate: 0,
      avgFeedback: 0,
      enrolledClasses: 0,
    },
  },
];

const CourseManagement = () => {
  const [courses, setCourses] = useState(sampleCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedModality, setSelectedModality] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.program.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    const matchesProgram = selectedProgram === "all" || course.program === selectedProgram;
    const matchesModality = selectedModality === "all" || course.modality === selectedModality;

    return matchesSearch && matchesLevel && matchesProgram && matchesModality;
  });

  const getModalityColor = (modality) => {
    switch (modality) {
      case "offline": return "bg-blue-100 text-blue-800";
      case "online": return "bg-green-100 text-green-800";
      case "hybrid": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const generateAILessonPlan = (unitTitle, objectives) => {
    // Mock AI generation
    return {
      warmup: `5-10 min interactive activity related to ${unitTitle.toLowerCase()}`,
      practice: `15-20 min guided practice focusing on ${objectives[0]?.toLowerCase() || 'key objectives'}`,
      assessment: `5-10 min formative assessment to check understanding`,
      homework: `15-20 min independent practice or extension activity`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng khóa học</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
                <p className="text-2xl font-bold">
                  {courses.filter(c => c.status === "published").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Lớp đang học</p>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, c) => sum + c.stats.enrolledClasses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ pass TB</p>
                <p className="text-2xl font-bold">
                  {Math.round(courses.reduce((sum, c) => sum + c.stats.passRate, 0) / courses.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả level</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B1-B2">B1-B2</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="B2-C1">B2-C1</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Chương trình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chương trình</SelectItem>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="TOEIC">TOEIC</SelectItem>
                <SelectItem value="Business English">Business English</SelectItem>
                <SelectItem value="General English">General English</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger>
                <SelectValue placeholder="Hình thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="1-on-1">1-on-1</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Tạo khóa học
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo khóa học mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tên khóa học</Label>
                      <Input placeholder="IELTS Preparation B2-C1" />
                    </div>
                    <div>
                      <Label>Chương trình</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chương trình" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ielts">IELTS</SelectItem>
                          <SelectItem value="toeic">TOEIC</SelectItem>
                          <SelectItem value="business">Business English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="B2-C1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a1">A1</SelectItem>
                          <SelectItem value="b1-b2">B1-B2</SelectItem>
                          <SelectItem value="b2-c1">B2-C1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Số buổi</Label>
                      <Input type="number" placeholder="20" />
                    </div>
                    <div>
                      <Label>Hình thức</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Offline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Mục tiêu khóa học</Label>
                    <Textarea
                      placeholder="Mục tiêu và outcomes của khóa học..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Map với KCT</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn KCT" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kct-001">Tiếng Anh CEFR A1-B2</SelectItem>
                        <SelectItem value="kct-002">Business English B1-C1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1">Tạo khóa học</Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
                  <div className="flex gap-1 mb-2">
                    <Badge variant="outline">{course.level}</Badge>
                    <Badge className={getModalityColor(course.modality)}>
                      {course.modality}
                    </Badge>
                    <Badge variant={course.status === "published" ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <EditIcon className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{course.totalHours}h • {course.sessions} buổi</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  <span>{course.units.length} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Map: {course.mappedKCT.join(", ")}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-green-600">{course.stats.passRate}%</div>
                  <div>Pass Rate</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium text-blue-600">{course.stats.completionRate}%</div>
                  <div>Completion</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedCourse(course)}
                >
                  <TargetIcon className="mr-1 h-3 w-3" />
                  Chi tiết
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <UsersIcon className="mr-1 h-3 w-3" />
                  Gán lớp
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse.name}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="units">Units</TabsTrigger>
                <TabsTrigger value="assessments">Đánh giá</TabsTrigger>
                <TabsTrigger value="reports">Báo cáo</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Level:</strong> {selectedCourse.level}</p>
                      <p><strong>Chương trình:</strong> {selectedCourse.program}</p>
                      <p><strong>Hình thức:</strong> {selectedCourse.modality}</p>
                      <p><strong>Tổng giờ:</strong> {selectedCourse.totalHours}h</p>
                      <p><strong>Số buổi:</strong> {selectedCourse.sessions}</p>
                      <p><strong>Trạng thái:</strong> {selectedCourse.status}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Mapping KCT</h4>
                    <div className="space-y-1">
                      {selectedCourse.mappedKCT.map((kctId, idx) => (
                        <Badge key={idx} variant="outline">{kctId}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="units" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Danh sách Units</h4>
                  <Button size="sm">
                    <PlusCircleIcon className="mr-1 h-3 w-3" />
                    Thêm Unit
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCourse.units.map((unit, idx) => (
                    <Card key={unit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium">{unit.title}</h5>
                            <p className="text-sm text-muted-foreground">{unit.duration} phút</p>
                          </div>
                          <Badge variant="outline">Unit {idx + 1}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label className="text-xs font-medium">Mục tiêu</Label>
                            <ul className="text-xs mt-1 space-y-1">
                              {unit.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircleIcon className="h-3 w-3 text-green-500 mt-0.5" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <Label className="text-xs font-medium">Lesson Plan (AI Generated)</Label>
                            <div className="text-xs mt-1 space-y-1">
                              <p><strong>Warm-up:</strong> {unit.lessonPlan.warmup}</p>
                              <p><strong>Practice:</strong> {unit.lessonPlan.practice}</p>
                              <p><strong>Assessment:</strong> {unit.lessonPlan.assessment}</p>
                              <p><strong>Homework:</strong> {unit.lessonPlan.homework}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <BotIcon className="mr-1 h-3 w-3" />
                            Tái tạo AI
                          </Button>
                          <Button size="sm" variant="outline">
                            <EditIcon className="mr-1 h-3 w-3" />
                            Chỉnh sửa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedCourse.units.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Chưa có units nào</p>
                      <Button>
                        <BotIcon className="mr-2 h-4 w-4" />
                        Tạo Units với AI
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Bài đánh giá</h4>
                  <Button size="sm">
                    <PlusCircleIcon className="mr-1 h-3 w-3" />
                    Thêm assessment
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCourse.assessments.map((assessment, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{assessment.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {assessment.type} • Rubric: {assessment.rubric}
                            </p>
                          </div>
                          <Badge variant="outline">{assessment.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedCourse.assessments.length === 0 && (
                    <div className="text-center py-8">
                      <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Chưa có bài đánh giá nào</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {selectedCourse.stats.passRate}%
                      </div>
                      <p className="text-sm text-muted-foreground">Pass Rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {selectedCourse.stats.completionRate}%
                      </div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {selectedCourse.stats.avgFeedback}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg Feedback</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Cảnh báo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCourse.units.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Khóa học chưa có units</span>
                        </div>
                      )}

                      {selectedCourse.assessments.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Khóa học chưa có bài đánh giá</span>
                        </div>
                      )}

                      {selectedCourse.totalHours < 20 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">Khóa học có ít hơn 20 giờ</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy khóa học nào</p>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;