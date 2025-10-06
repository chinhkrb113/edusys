"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, DownloadIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

import OverviewDashboard from "@/components/analytics/OverviewDashboard";
import LearningAnalytics from "@/components/analytics/LearningAnalytics";
import TeacherPerformance from "@/components/analytics/TeacherPerformance";
import AdmissionsFunnel from "@/components/analytics/AdmissionsFunnel";
import FinancialSummary from "@/components/analytics/FinancialSummary";

const AnalyticsReportsPage = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2024, 0, 20),
    to: addDays(new Date(2024, 0, 20), 20),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Campus</SelectItem>
            <SelectItem value="hanoi">Campus Hà Nội</SelectItem>
            <SelectItem value="hcm">Campus TP.HCM</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            <SelectItem value="ielts">IELTS</SelectItem>
            <SelectItem value="business">Business English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-1 h-auto">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="learning">Học tập & Lớp học</TabsTrigger>
          <TabsTrigger value="curriculum">Chương trình đào tạo</TabsTrigger>
          <TabsTrigger value="teachers">Giáo viên</TabsTrigger>
          <TabsTrigger value="admissions">Tuyển sinh</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
          <TabsTrigger value="hr">Nhân sự</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewDashboard />
        </TabsContent>
        <TabsContent value="learning" className="mt-4">
          <LearningAnalytics />
        </TabsContent>
        <TabsContent value="curriculum" className="mt-4">
          <p>Báo cáo chương trình đào tạo...</p>
        </TabsContent>
        <TabsContent value="teachers" className="mt-4">
          <TeacherPerformance />
        </TabsContent>
        <TabsContent value="admissions" className="mt-4">
          <AdmissionsFunnel />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinancialSummary />
        </TabsContent>
        <TabsContent value="hr" className="mt-4">
          <p>Báo cáo nhân sự...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsReportsPage;