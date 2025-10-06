"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CourseManagement from "@/components/course-management/CourseManagement";

const CourseManagementPage = () => {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Quản lý Khóa học
        </h1>
        <p className="text-md text-muted-foreground">
          Tạo và quản lý các khóa học từ KCT blueprint với AI lesson plan generator.
        </p>
      </div>

      <CourseManagement />
    </div>
  );
};

export default CourseManagementPage;