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
  LineChart,
  Line,
} from "recharts";
import KpiCard from "./KpiCard";
import {
  UsersIcon,
  DollarSignIcon,
  CheckCircleIcon,
  StarIcon,
} from "lucide-react";

const revenueData = [
  { name: "IELTS", revenue: 4000 },
  { name: "Business", revenue: 3000 },
  { name: "TOEIC", revenue: 2000 },
  { name: "Kids", revenue: 2780 },
];

const enrollmentData = [
  { name: "Tháng 1", students: 25 },
  { name: "Tháng 2", students: 32 },
  { name: "Tháng 3", students: 45 },
  { name: "Tháng 4", students: 42 },
];

const OverviewDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tổng học viên"
          value="1,250"
          change="+5.2%"
          icon={UsersIcon}
          description="Số học viên đang hoạt động"
        />
        <KpiCard
          title="Doanh thu tháng"
          value="1.2 Tỷ"
          change="+12.1%"
          icon={DollarSignIcon}
          description="Doanh thu từ học phí"
        />
        <KpiCard
          title="Tỷ lệ chuyên cần"
          value="92.5%"
          change="-0.5%"
          icon={CheckCircleIcon}
          description="Tỷ lệ tham gia lớp học"
        />
        <KpiCard
          title="Mức độ hài lòng"
          value="4.7/5"
          change="+0.2"
          icon={StarIcon}
          description="Đánh giá trung bình từ học viên"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo chương trình</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu (triệu)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tuyển sinh mới</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#82ca9d"
                  name="Học viên mới"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewDashboard;