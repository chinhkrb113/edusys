"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditIcon, TrashIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  center: string;
  status: "active" | "inactive";
  lastLogin: string;
}

const mockUsers: User[] = [
  {
    id: "U001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    phone: "0987654321",
    role: "Owner / Admin",
    center: "Trung tâm Hà Nội",
    status: "active",
    lastLogin: "2024-01-15 14:30",
  },
  {
    id: "U002",
    name: "Trần Thị Bình",
    email: "binh.tran@example.com",
    phone: "0912345678",
    role: "BGH / Academic Director",
    center: "Trung tâm Hà Nội",
    status: "active",
    lastLogin: "2024-01-15 09:15",
  },
  {
    id: "U003",
    name: "Lê Minh Cường",
    email: "cuong.le@example.com",
    phone: "0934567890",
    role: "Program Owner",
    center: "Trung tâm TP.HCM",
    status: "active",
    lastLogin: "2024-01-14 16:45",
  },
  {
    id: "U004",
    name: "Phạm Thị Dung",
    email: "dung.pham@example.com",
    phone: "0945678901",
    role: "Curriculum Designer",
    center: "Trung tâm Hà Nội",
    status: "inactive",
    lastLogin: "2024-01-10 11:20",
  },
  {
    id: "U005",
    name: "Hoàng Văn Em",
    email: "em.hoang@example.com",
    phone: "0945678901",
    role: "Teacher / TA",
    center: "Trung tâm Đà Nẵng",
    status: "active",
    lastLogin: "2024-01-15 13:00",
  },
];

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length > 1) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return parts[0][0];
};

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "Owner / Admin":
      return "default";
    case "BGH / Academic Director":
      return "secondary";
    case "Program Owner":
      return "outline";
    case "Curriculum Designer":
      return "destructive"; // Using destructive for a distinct look, can be changed
    case "Teacher / TA":
      return "default";
    default:
      return "secondary";
  }
};

const getStatusBadgeVariant = (status: User["status"]) => {
  switch (status) {
    case "active":
      return "default";
    case "inactive":
      return "destructive";
    default:
      return "secondary";
  }
};

const UserList = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người dùng</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trung tâm</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Đăng nhập cuối</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-0.5">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.phone}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.center}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(user.status)}>
                  {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </TableCell>
              <TableCell>{user.lastLogin}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <EditIcon className="h-4 w-4" />
                    <span className="sr-only">Chỉnh sửa</span>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Xóa</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;