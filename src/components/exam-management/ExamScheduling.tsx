"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  PlusCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  VideoIcon,
  MonitorIcon,
  CheckCircleIcon,
} from "lucide-react";
import { format } from "date-fns";

// Sample exam sessions
const sampleSessions = [
  {
    id: 1,
    examName: "Placement Test A1-B2",
    date: new Date(2024, 10, 15, 9, 0),
    duration: 90,
    type: "online",
    room: "Zoom Meeting 1",
    capacity: 50,
    registered: 45,
    proctor: "Nguyễn Văn A",
    status: "scheduled",
  },
  {
    id: 2,
    examName: "Mid-term B1 Grammar",
    date: new Date(2024, 10, 16, 14, 0),
    duration: 60,
    type: "offline",
    room: "Phòng 201",
    capacity: 30,
    registered: 28,
    proctor: "Trần Thị B",
    status: "scheduled",
  },
  {
    id: 3,
    examName: "Final Exam C1",
    date: new Date(2024, 10, 20, 10, 0),
    duration: 120,
    type: "hybrid",
    room: "Phòng 101 + Zoom",
    capacity: 25,
    registered: 22,
    proctor: "Lê Văn C",
    status: "draft",
  },
];

const ExamScheduling = () => {
  const [sessions, setSessions] = useState(sampleSessions);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "online": return <VideoIcon className="h-4 w-4" />;
      case "offline": return <MapPinIcon className="h-4 w-4" />;
      case "hybrid": return <MonitorIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lịch thi</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Danh sách kỳ thi</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Tạo kỳ thi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Tạo kỳ thi mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Form fields here */}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kỳ thi</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead>Thí sinh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.examName}</TableCell>
                      <TableCell>{format(session.date, "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(session.type)}
                          <Badge variant="outline" className="capitalize">{session.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{session.registered}/{session.capacity}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status === "scheduled" ? "Đã lên lịch" : "Nháp"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamScheduling;