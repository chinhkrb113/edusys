"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  QrCodeIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  CameraIcon,
  MonitorIcon,
  SmartphoneIcon,
  FileTextIcon
} from "lucide-react";

// Sample attendance data
const sampleStudents = [
  { id: 1, name: "Nguyễn Văn A", email: "a@example.com", status: "present", checkInTime: "09:00", method: "qr" },
  { id: 2, name: "Trần Thị B", email: "b@example.com", status: "late", checkInTime: "09:15", method: "manual" },
  { id: 3, name: "Lê Văn C", email: "c@example.com", status: "absent", checkInTime: null, method: null },
  { id: 4, name: "Phạm Thị D", email: "d@example.com", status: "present", checkInTime: "08:55", method: "zoom" },
  { id: 5, name: "Hoàng Văn E", email: "e@example.com", status: "present", checkInTime: "09:02", method: "kiosk" },
];

const AttendanceManagement = () => {
  const [students, setStudents] = useState(sampleStudents);
  const [selectedSession, setSelectedSession] = useState("2024-10-29-09:00");
  const [qrCode, setQrCode] = useState("ABC123XYZ"); // Dynamic QR code
  const [qrExpiry, setQrExpiry] = useState(30); // seconds

  // Calculate attendance stats
  const stats = {
    total: students.length,
    present: students.filter(s => s.status === "present").length,
    late: students.filter(s => s.status === "late").length,
    absent: students.filter(s => s.status === "absent").length,
    attendanceRate: Math.round((students.filter(s => s.status === "present" || s.status === "late").length / students.length) * 100),
  };

  // Handle manual attendance update
  const updateAttendance = (studentId, status) => {
    setStudents(students.map(student =>
      student.id === studentId ? { ...student, status, checkInTime: status !== "absent" ? new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : null, method: "manual" } : student
    ));
  };

  // Generate new QR code
  const generateNewQR = () => {
    setQrCode(Math.random().toString(36).substring(2, 15));
    setQrExpiry(30);
  };

  // Auto-decrement QR expiry (simulate)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setQrExpiry(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "present": return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "late": return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case "absent": return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "qr": return <QrCodeIcon className="h-4 w-4" />;
      case "zoom": return <MonitorIcon className="h-4 w-4" />;
      case "kiosk": return <SmartphoneIcon className="h-4 w-4" />;
      case "manual": return <UsersIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng học viên</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Có mặt</p>
                <p className="text-2xl font-bold">{stats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Đến muộn</p>
                <p className="text-2xl font-bold">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ chuyên cần</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance-list" className="w-full">
        <TabsList>
          <TabsTrigger value="attendance-list">Danh sách điểm danh</TabsTrigger>
          <TabsTrigger value="qr-checkin">QR Check-in</TabsTrigger>
          <TabsTrigger value="zoom-integration">Tích hợp Zoom</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance-list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Điểm danh buổi học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="session-select">Chọn buổi học</Label>
                  <Select value={selectedSession} onValueChange={setSelectedSession}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-10-29-09:00">29/10/2024 - 09:00</SelectItem>
                      <SelectItem value="2024-10-30-14:00">30/10/2024 - 14:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Xuất báo cáo
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(student.status)}
                          <Badge variant={
                            student.status === "present" ? "default" :
                            student.status === "late" ? "secondary" : "destructive"
                          }>
                            {student.status === "present" ? "Có mặt" :
                             student.status === "late" ? "Đến muộn" : "Vắng"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.checkInTime ? (
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {student.checkInTime}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.method && (
                          <div className="flex items-center gap-1">
                            {getMethodIcon(student.method)}
                            <span className="text-sm capitalize">{student.method}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={student.status === "present" ? "default" : "outline"}
                            onClick={() => updateAttendance(student.id, "present")}
                          >
                            Có mặt
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "late" ? "default" : "outline"}
                            onClick={() => updateAttendance(student.id, "late")}
                          >
                            Muộn
                          </Button>
                          <Button
                            size="sm"
                            variant={student.status === "absent" ? "destructive" : "outline"}
                            onClick={() => updateAttendance(student.id, "absent")}
                          >
                            Vắng
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-checkin" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCodeIcon className="h-5 w-5" />
                  QR Code Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="bg-gray-100 p-8 rounded-lg inline-block">
                    {/* Placeholder for QR code - in real app, use a QR library */}
                    <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                      <QrCodeIcon className="h-24 w-24 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Code: {qrCode} | Hết hạn: {qrExpiry}s
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateNewQR} className="flex-1">
                    Tạo QR mới
                  </Button>
                  <Button variant="outline">
                    <CameraIcon className="mr-2 h-4 w-4" />
                    Chụp ảnh
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Cài đặt QR</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox id="auto-rotate" defaultChecked />
                    <Label htmlFor="auto-rotate" className="text-sm">Tự động xoay QR (30s)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="location-check" />
                    <Label htmlFor="location-check" className="text-sm">Kiểm tra vị trí</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kiosk Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Chế độ kiosk cho máy tính bảng tại cửa lớp
                </p>

                <div className="space-y-2">
                  <Button className="w-full">
                    <SmartphoneIcon className="mr-2 h-4 w-4" />
                    Kích hoạt Kiosk
                  </Button>
                  <Button variant="outline" className="w-full">
                    Cấu hình thiết bị
                  </Button>
                </div>

                <div className="border rounded p-4">
                  <h4 className="font-medium mb-2">Thiết bị kết nối</h4>
                  <div className="space-y-1 text-sm">
                    <p>📱 iPad Classroom A - Online</p>
                    <p>📱 Android Tablet B - Online</p>
                    <p>💻 Laptop Teacher - Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zoom-integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorIcon className="h-5 w-5" />
                Tích hợp Zoom Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Meeting ID</Label>
                  <Input placeholder="123 456 7890" />
                </div>
                <div>
                  <Label>Passcode</Label>
                  <Input type="password" placeholder="******" />
                </div>
              </div>

              <Button>
                Đồng bộ từ Zoom Logs
              </Button>

              <div className="border rounded p-4">
                <h4 className="font-medium mb-2">Logs gần đây</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nguyễn Văn A joined</span>
                    <span className="text-muted-foreground">09:00:15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trần Thị B joined</span>
                    <span className="text-muted-foreground">09:02:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nguyễn Văn A left</span>
                    <span className="text-muted-foreground">10:25:45</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo chuyên cần</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Báo cáo chi tiết về tỷ lệ chuyên cần theo học viên và lớp học.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Chọn khoảng thời gian</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tuần này" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Tuần này</SelectItem>
                      <SelectItem value="month">Tháng này</SelectItem>
                      <SelectItem value="semester">Học kỳ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Định dạng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="PDF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Tạo báo cáo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceManagement;