"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const teacherData = [
  { name: "Mr. John Doe", classes: 5, hours: 20, attendance: "95%", feedback: 4.8 },
  { name: "Ms. Ada Lovelace", classes: 4, hours: 16, attendance: "98%", feedback: 4.9 },
  { name: "Mr. Peter Drucker", classes: 6, hours: 22, attendance: "92%", feedback: 4.6 },
  { name: "Ms. Emily Carter", classes: 5, hours: 20, attendance: "94%", feedback: 4.7 },
];

const TeacherPerformance = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hiệu suất giảng viên</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Số lớp</TableHead>
              <TableHead>Giờ dạy/tuần</TableHead>
              <TableHead>Chuyên cần (TB)</TableHead>
              <TableHead>Feedback (TB)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teacherData.map((teacher) => (
              <TableRow key={teacher.name}>
                <TableCell className="font-medium">{teacher.name}</TableCell>
                <TableCell>{teacher.classes}</TableCell>
                <TableCell>{teacher.hours}</TableCell>
                <TableCell>
                  <Badge variant={parseFloat(teacher.attendance) > 95 ? "default" : "secondary"}>
                    {teacher.attendance}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={teacher.feedback > 4.7 ? "default" : "secondary"}>
                    {teacher.feedback}/5
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeacherPerformance;