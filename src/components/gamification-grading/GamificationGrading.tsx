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
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  StarIcon,
  TargetIcon,
  AwardIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  SettingsIcon,
  PlusCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";

// Sample data
const sampleStudents = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    level: "A1",
    xp: 1250,
    badges: ["Attendance Hero", "Grammar Guardian"],
    streak: 7,
    grade: 85,
    status: "pass",
  },
  {
    id: 2,
    name: "Trần Thị B",
    level: "B1",
    xp: 2100,
    badges: ["Speaking Sprinter", "Vocabulary Master"],
    streak: 12,
    grade: 78,
    status: "pass",
  },
  {
    id: 3,
    name: "Lê Văn C",
    level: "A2",
    xp: 890,
    badges: ["Quick Learner"],
    streak: 3,
    grade: 65,
    status: "conditional",
  },
];

const sampleBadges = [
  { id: 1, name: "Attendance Hero", description: "Điểm danh đủ 30 ngày", icon: "🏆", earned: 45 },
  { id: 2, name: "Speaking Sprinter", description: "Hoàn thành 10 bài nói", icon: "🎤", earned: 23 },
  { id: 3, name: "Grammar Guardian", description: "Điểm grammar > 80%", icon: "📚", earned: 67 },
  { id: 4, name: "Vocabulary Master", description: "Học 500 từ mới", icon: "🧠", earned: 12 },
];

const gradingRules = {
  A1: { minScore: 55, weights: { classroom: 25, group: 15, individual: 20, progress: 20, final: 20 } },
  B1: { minScore: 65, weights: { classroom: 20, group: 15, individual: 20, progress: 20, final: 25 } },
  B2: { minScore: 70, weights: { classroom: 15, group: 15, individual: 20, progress: 20, final: 30 } },
  C1: { minScore: 75, weights: { classroom: 10, group: 10, individual: 20, progress: 20, final: 40 } },
  C2: { minScore: 80, weights: { classroom: 5, group: 5, individual: 15, progress: 15, final: 60 } },
};

const GamificationGrading = () => {
  const [activeTab, setActiveTab] = useState("points");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const filteredStudents = selectedLevel === "all"
    ? sampleStudents
    : sampleStudents.filter(s => s.level === selectedLevel);

  const getStatusColor = (status) => {
    switch (status) {
      case "pass": return "bg-green-100 text-green-800";
      case "conditional": return "bg-yellow-100 text-yellow-800";
      case "fail": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 80) return "text-green-600";
    if (grade >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng XP</p>
                <p className="text-2xl font-bold">
                  {sampleStudents.reduce((sum, s) => sum + s.xp, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Huy hiệu đã trao</p>
                <p className="text-2xl font-bold">
                  {sampleStudents.reduce((sum, s) => sum + s.badges.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Streak trung bình</p>
                <p className="text-2xl font-bold">
                  {Math.round(sampleStudents.reduce((sum, s) => sum + s.streak, 0) / sampleStudents.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ pass</p>
                <p className="text-2xl font-bold">
                  {Math.round((sampleStudents.filter(s => s.status === "pass").length / sampleStudents.length) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="points">Điểm thưởng</TabsTrigger>
          <TabsTrigger value="badges">Huy hiệu</TabsTrigger>
          <TabsTrigger value="grading">Chấm điểm</TabsTrigger>
          <TabsTrigger value="pass-fail">Pass/Fail</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quy tắc tích điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Hoạt động hàng ngày</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Điểm danh đúng giờ</span>
                      <Badge variant="outline">+5 XP</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Hoàn thành homework</span>
                      <Badge variant="outline">+10 XP</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Tham gia thảo luận</span>
                      <Badge variant="outline">+8 XP</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Thành tích đặc biệt</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Mini-presentation xuất sắc</span>
                      <Badge variant="outline">+15 XP</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Streak học 7 ngày</span>
                      <Badge variant="outline">+20 XP</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Top 3 leaderboard tuần</span>
                      <Badge variant="outline">+25 XP</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bảng xếp hạng</CardTitle>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Huy hiệu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents
                    .sort((a, b) => b.xp - a.xp)
                    .map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{index + 1}</span>
                          <span>{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.level}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{student.xp.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>🔥</span>
                          <span>{student.streak}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {student.badges.slice(0, 2).map((badge, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                          {student.badges.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.badges.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleBadges.map((badge) => (
              <Card key={badge.id} className="text-center">
                <CardContent className="p-4">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-medium mb-1">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                  <Badge variant="outline">{badge.earned} học viên</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Quản lý huy hiệu</CardTitle>
                <Button>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Tạo huy hiệu mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huy hiệu</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Đã trao</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleBadges.map((badge) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{badge.icon}</span>
                          <span className="font-medium">{badge.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{badge.description}</TableCell>
                      <TableCell>{badge.earned}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">Sửa</Button>
                          <Button size="sm" variant="outline">Trao</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hệ thống chấm điểm theo Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(gradingRules).map(([level, rules]) => (
                  <div key={level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Level {level}</h3>
                      <Badge variant="outline">Min: {rules.minScore}%</Badge>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium">Classroom</div>
                        <div>{rules.weights.classroom}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Group</div>
                        <div>{rules.weights.group}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Individual</div>
                        <div>{rules.weights.individual}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Progress</div>
                        <div>{rules.weights.progress}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Final</div>
                        <div>{rules.weights.final}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kết quả học tập</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Điểm tổng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getGradeColor(student.grade)}`}>
                          {student.grade}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status === "pass" ? "Đậu" :
                           student.status === "conditional" ? "Điều kiện" : "Rớt"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">Xem chi tiết</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pass-fail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quy tắc Pass/Fail theo CEFR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Điều kiện Pass</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Điểm tổng ≥ ngưỡng Level</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Mỗi kỹ năng ≥ 50%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Attendance ≥ 80%</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Conditional Pass</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>Đạt điểm tổng nhưng 1 kỹ năng yếu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>Yêu cầu làm bài tập bù</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>Thi lại kỹ năng đó trong 2 tuần</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Fail - Học lại</h4>
                  <p className="text-sm text-muted-foreground">
                    Nếu không đạt điểm tổng hoặc nhiều kỹ năng yếu → Gợi ý học lại level trước hoặc
                    đăng ký khóa ôn tập chuyên sâu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt quy tắc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Ngưỡng điểm A1</Label>
                  <Input type="number" defaultValue="55" className="mt-1" />
                </div>
                <div>
                  <Label>Ngưỡng điểm B1</Label>
                  <Input type="number" defaultValue="65" className="mt-1" />
                </div>
                <div>
                  <Label>Ngưỡng điểm B2</Label>
                  <Input type="number" defaultValue="70" className="mt-1" />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button>Lưu thay đổi</Button>
                <Button variant="outline">Reset về mặc định</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationGrading;