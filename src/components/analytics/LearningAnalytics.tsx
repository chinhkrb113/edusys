"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import KpiCard from "./KpiCard";
import {
  ClipboardListIcon,
  BookOpenCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const gradeDistributionData = [
  { name: "A", count: 15 },
  { name: "B", count: 45 },
  { name: "C", count: 25 },
  { name: "D/F", count: 5 },
];

const submissionData = [
  { name: "Đúng hạn", value: 85 },
  { name: "Trễ hạn", value: 10 },
  { name: "Chưa nộp", value: 5 },
];
const COLORS = ["#0088FE", "#FFBB28", "#FF8042"];

const dropoutRiskData = [
    { student: "Nguyễn Văn An", risk: "Cao", attendance: "65%", grade: "5.2" },
    { student: "Trần Thị Bình", risk: "Trung bình", attendance: "78%", grade: "6.5" },
    { student: "Lê Văn Cường", risk: "Thấp", attendance: "95%", grade: "8.8" },
];

const LearningAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Điểm trung bình"
          value="7.8/10"
          icon={TrendingUpIcon}
          description="GPA toàn hệ thống"
        />
        <KpiCard
          title="Tỷ lệ nộp bài"
          value="95%"
          icon={ClipboardListIcon}
          description="Tỷ lệ hoàn thành bài tập"
        />
        <KpiCard
          title="Tỷ lệ Pass"
          value="88%"
          icon={BookOpenCheckIcon}
          description="Tỷ lệ qua môn cuối kỳ"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân phối điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistributionData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Số lượng học viên" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tình trạng nộp bài</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={submissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label
                >
                  {submissionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Học viên có nguy cơ Dropout</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Mức độ rủi ro</TableHead>
                        <TableHead>Chuyên cần</TableHead>
                        <TableHead>Điểm TB</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dropoutRiskData.map(item => (
                        <TableRow key={item.student}>
                            <TableCell>{item.student}</TableCell>
                            <TableCell>{item.risk}</TableCell>
                            <TableCell>{item.attendance}</TableCell>
                            <TableCell>{item.grade}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningAnalytics;