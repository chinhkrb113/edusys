"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, FilterIcon, FileTextIcon, CalendarIcon, VideoIcon, EditIcon } from "lucide-react";
import ExamBankOverview from "@/components/exam-management/ExamBankOverview";
import ExamScheduling from "@/components/exam-management/ExamScheduling";
import Proctoring from "@/components/exam-management/Proctoring";
import Grading from "@/components/exam-management/Grading";
import CreateExamDialog from "@/components/exam-management/CreateExamDialog";
import ExamFilterSheet from "@/components/exam-management/ExamFilterSheet";

const ExamManagementPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      <CreateExamDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <ExamFilterSheet open={isFilterOpen} onOpenChange={setIsFilterOpen} />

      <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Exam Management</h1>
            <p className="text-md text-muted-foreground">
              Quản lý hoạt động thi cử từ A đến Z.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-white" onClick={() => setIsFilterOpen(true)}>
              <FilterIcon className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsCreateOpen(true)}>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Tạo mới
            </Button>
          </div>
        </div>

        <Tabs defaultValue="exam-bank" className="w-full">
          <TabsList className="bg-gray-200/70 p-1 rounded-lg inline-flex">
            <TabsTrigger value="exam-bank" className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4" /> Ngân hàng Đề thi
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Lịch thi
            </TabsTrigger>
            <TabsTrigger value="proctoring" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" /> Giám sát
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-2">
              <EditIcon className="h-4 w-4" /> Chấm thi
            </TabsTrigger>
          </TabsList>
          <TabsContent value="exam-bank">
            <ExamBankOverview />
          </TabsContent>
          <TabsContent value="scheduling">
            <ExamScheduling />
          </TabsContent>
          <TabsContent value="proctoring">
            <Proctoring />
          </TabsContent>
          <TabsContent value="grading">
            <Grading />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ExamManagementPage;