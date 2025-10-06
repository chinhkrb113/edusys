"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, FilterIcon, XIcon } from "lucide-react";
import ClassCard from "./ClassCard";

const mockClasses = [
  {
    id: "IE-F1-24A",
    name: "IELTS Fighter 1",
    program: "IELTS",
    level: "B2-C1",
    course: "IELTS Preparation B2-C1",
    teacher: "Mr. John Doe",
    campus: "Campus A",
    modality: "offline",
    location: "Campus A - Room 101",
    studentsEnrolled: 15,
    studentsMax: 20,
    startDate: "2024-09-01",
    status: "running" as const,
  },
  {
    id: "JC-C1-24B",
    name: "Junior Coders",
    program: "Coding",
    level: "C1",
    course: "Coding for Kids",
    teacher: "Ms. Ada Lovelace",
    campus: "Online",
    modality: "online",
    location: "Online - Zoom Link",
    studentsEnrolled: 12,
    studentsMax: 15,
    startDate: "2024-09-10",
    status: "running" as const,
  },
  {
    id: "BC-P1-24C",
    name: "Business Comm Pro",
    program: "Business English",
    level: "B1-B2",
    course: "Business English B1-B2",
    teacher: "Mr. Peter Drucker",
    campus: "Campus B",
    modality: "hybrid",
    location: "Hybrid - Campus B / Meet",
    studentsEnrolled: 8,
    studentsMax: 10,
    startDate: "2024-08-20",
    status: "finished" as const,
  },
  {
    id: "TO-F1-23D",
    name: "TOEIC Foundation",
    program: "TOEIC",
    level: "Foundation",
    course: "TOEIC 500+",
    teacher: "Ms. Emily Carter",
    campus: "Campus C",
    modality: "offline",
    location: "Campus C - Room 205",
    studentsEnrolled: 18,
    studentsMax: 20,
    startDate: "2023-11-01",
    status: "archived" as const,
  },
];

const ClassOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Get unique values for filters
  const programs = [...new Set(mockClasses.map(c => c.program))];
  const levels = [...new Set(mockClasses.map(c => c.level))];
  const teachers = [...new Set(mockClasses.map(c => c.teacher))];
  const campuses = [...new Set(mockClasses.map(c => c.campus))];

  // Filter classes
  const filteredClasses = mockClasses.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = selectedProgram === "all" || classItem.program === selectedProgram;
    const matchesLevel = selectedLevel === "all" || classItem.level === selectedLevel;
    const matchesTeacher = selectedTeacher === "all" || classItem.teacher === selectedTeacher;
    const matchesCampus = selectedCampus === "all" || classItem.campus === selectedCampus;
    const matchesStatus = selectedStatus === "all" || classItem.status === selectedStatus;

    return matchesSearch && matchesProgram && matchesLevel && matchesTeacher && matchesCampus && matchesStatus;
  });

  // Active filters for chips
  const activeFilters = [];
  if (selectedProgram !== "all") activeFilters.push({ key: "program", value: selectedProgram, setter: setSelectedProgram });
  if (selectedLevel !== "all") activeFilters.push({ key: "level", value: selectedLevel, setter: setSelectedLevel });
  if (selectedTeacher !== "all") activeFilters.push({ key: "teacher", value: selectedTeacher, setter: setSelectedTeacher });
  if (selectedCampus !== "all") activeFilters.push({ key: "campus", value: selectedCampus, setter: setSelectedCampus });
  if (selectedStatus !== "all") activeFilters.push({ key: "status", value: selectedStatus, setter: setSelectedStatus });

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm lớp học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedProgram} onValueChange={setSelectedProgram}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chương trình" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chương trình</SelectItem>
            {programs.map(program => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả level</SelectItem>
            {levels.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Giáo viên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả GV</SelectItem>
            {teachers.map(teacher => (
              <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCampus} onValueChange={setSelectedCampus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả campus</SelectItem>
            {campuses.map(campus => (
              <SelectItem key={campus} value={campus}>{campus}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="running">Đang chạy</SelectItem>
            <SelectItem value="finished">Hoàn thành</SelectItem>
            <SelectItem value="archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
              {filter.value}
              <XIcon
                className="h-3 w-3 cursor-pointer"
                onClick={() => filter.setter("all")}
              />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProgram("all");
              setSelectedLevel("all");
              setSelectedTeacher("all");
              setSelectedCampus("all");
              setSelectedStatus("all");
            }}
          >
            Xóa tất cả
          </Button>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredClasses.length} trên {mockClasses.length} lớp học
        </p>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {/* Classes Display */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <ClassCard key={classItem.id} {...classItem} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClasses.map((classItem) => (
            <div key={classItem.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">{classItem.name}</h3>
                    <p className="text-sm text-muted-foreground">{classItem.id}</p>
                  </div>
                  <Badge variant="outline">{classItem.program}</Badge>
                  <Badge variant="outline">{classItem.level}</Badge>
                  <span className="text-sm">{classItem.teacher}</span>
                  <span className="text-sm">{classItem.campus}</span>
                  <span className="text-sm">{classItem.studentsEnrolled}/{classItem.studentsMax}</span>
                </div>
                <div className="flex items-center gap-2">
                  {classItem.status === "running" && <Badge className="bg-green-500">Running</Badge>}
                  {classItem.status === "finished" && <Badge className="bg-blue-500">Finished</Badge>}
                  {classItem.status === "archived" && <Badge variant="outline">Archived</Badge>}
                  <Button variant="outline" size="sm">Xem</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Không tìm thấy lớp học nào</p>
        </div>
      )}
    </div>
  );
};

export default ClassOverview;