"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, FilterIcon, CalendarDaysIcon, ListChecksIcon, BookIcon, BarChartIcon, BellIcon, UsersIcon, AwardIcon, EyeIcon, FileTextIcon, SettingsIcon } from "lucide-react";
import ClassOverview from "@/components/class-management/ClassOverview"; // Import the new ClassOverview component
import ScheduleCalendar from "@/components/class-management/ScheduleCalendar"; // Import the new ScheduleCalendar component
import AttendanceManagement from "@/components/class-management/AttendanceManagement"; // Import the new AttendanceManagement component

const ClassManagementPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Class Management</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <FilterIcon className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
          <Button>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Tạo lớp mới
          </Button>
        </div>
      </div>
      <p className="text-md text-muted-foreground">
        Quản lý toàn diện vòng đời của một lớp học.
      </p>

      <Tabs defaultValue="class-overview" className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-1 h-auto"> {/* Adjusted for responsiveness */}
          <TabsTrigger value="class-overview" className="flex items-center gap-2">
            <ListChecksIcon className="h-4 w-4" /> Danh sách lớp
          </TabsTrigger>
          <TabsTrigger value="schedule-calendar" className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" /> Lịch học
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <BarChartIcon className="h-4 w-4" /> Hoạt động
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ListChecksIcon className="h-4 w-4" /> Điểm danh
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <BookIcon className="h-4 w-4" /> Bài tập
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" /> Điểm số
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" /> Thông báo
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" /> Thành viên
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <AwardIcon className="h-4 w-4" /> Chứng chỉ
          </TabsTrigger>
          <TabsTrigger value="proctoring" className="flex items-center gap-2">
            <EyeIcon className="h-4 w-4" /> Giám sát
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChartIcon className="h-4 w-4" /> Báo cáo
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" /> Cấu hình
          </TabsTrigger>
        </TabsList>

        <TabsContent value="class-overview">
          <ClassOverview />
        </TabsContent>
        <TabsContent value="schedule-calendar">
          <ScheduleCalendar />
        </TabsContent>
        <TabsContent value="activities">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang quản lý hoạt động.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceManagement />
        </TabsContent>
        <TabsContent value="assignments">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang bài tập.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="gradebook">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang sổ điểm.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="notifications">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang thông báo.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="members">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang thành viên.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="certificates">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang chứng chỉ.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="proctoring">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang giám sát.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="reports">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang báo cáo.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
            <p className="text-lg text-gray-600">
              Đây là trang cấu hình.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassManagementPage;