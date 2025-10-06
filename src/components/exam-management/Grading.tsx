"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileTextIcon,
  CheckCircleIcon,
  ClockIcon,
  BotIcon,
} from "lucide-react";

const submissions = [
  { id: 1, student: "Nguyễn Văn A", exam: "Writing Task B1", status: "pending" },
  { id: 2, student: "Trần Thị B", exam: "Speaking Test A2", status: "graded" },
  { id: 3, student: "Lê Văn C", exam: "Grammar Quiz B2", status: "auto_graded" },
];

const Grading = () => {
  const [selectedSubmission, setSelectedSubmission] = useState(submissions[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài nộp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions.map(sub => (
              <div
                key={sub.id}
                className={`border rounded-lg p-4 cursor-pointer ${selectedSubmission?.id === sub.id ? "bg-blue-50" : ""}`}
                onClick={() => setSelectedSubmission(sub)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sub.student}</span>
                  <Badge variant={sub.status === "pending" ? "secondary" : "default"}>
                    {sub.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sub.exam}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Chấm bài: {selectedSubmission.student}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Nội dung bài làm</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">This is a sample essay...</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <BotIcon className="h-4 w-4" />
              Gợi ý từ AI
            </h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">Good structure, but needs more vocabulary variety.</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Nhận xét</h4>
            <Textarea placeholder="Nhập nhận xét chi tiết..." rows={4} />
          </div>
          <Button className="w-full">Hoàn thành chấm</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Grading;