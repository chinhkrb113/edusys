"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, FileTextIcon } from "lucide-react";

interface ExamCardProps {
  title: string;
  level: string;
  duration: number;
  questionCount: number;
}

const ExamCard: React.FC<ExamCardProps> = ({
  title,
  level,
  duration,
  questionCount,
}) => {
  return (
    <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileTextIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {level} &bull; {duration} phút &bull; {questionCount} câu hỏi
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontalIcon className="h-5 w-5 text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamCard;