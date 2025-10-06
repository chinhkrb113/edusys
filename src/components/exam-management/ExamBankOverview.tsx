"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import ExamCard from "./ExamCard";

const mockExams = [
  {
    title: "Đề thi cuối kỳ IELTS B2",
    level: "IELTS B2",
    duration: 180,
    questionCount: 120,
  },
  {
    title: "Đề thi giữa kỳ Business English",
    level: "B1+",
    duration: 90,
    questionCount: 60,
  },
  {
    title: "Đề thi thử TOEIC Reading",
    level: "TOEIC 750+",
    duration: 75,
    questionCount: 100,
  },
  {
    title: "Đề thi nói A2 CEFR",
    level: "A2",
    duration: 15,
    questionCount: 3,
  },
];

const ExamBankOverview = () => {
  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm đề thi theo level, loại hình..."
          className="pl-11 h-12 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-primary"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mockExams.map((exam, index) => (
          <ExamCard key={index} {...exam} />
        ))}
      </div>
    </div>
  );
};

export default ExamBankOverview;