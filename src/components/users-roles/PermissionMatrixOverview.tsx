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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface Permission {
  id: string;
  name: string;
  roles: {
    owner: boolean;
    bgh: boolean;
    po: boolean;
    cd: boolean;
    tch: boolean;
    adm: boolean;
    acc: boolean;
    qa: boolean;
  };
}

const mockPermissions: Permission[] = [
  {
    id: "P001",
    name: "Quản trị hệ thống",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P002",
    name: "Quản lý đa tenant",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P003",
    name: "Quản lý thanh toán & gói dịch vụ",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P004",
    name: "Quản lý người dùng",
    roles: {
      owner: true,
      bgh: true,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P005",
    name: "Cấu hình hệ thống",
    roles: {
      owner: true,
      bgh: true,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P006",
    name: "Xem báo cáo tổng quan",
    roles: {
      owner: true,
      bgh: true,
      po: true,
      cd: true,
      tch: true,
      adm: true,
      acc: true,
      qa: true,
    },
  },
  {
    id: "P007",
    name: "Quản lý học thuật",
    roles: {
      owner: true,
      bgh: true,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P008",
    name: "Duyệt khung chương trình",
    roles: {
      owner: true,
      bgh: true,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P009",
    name: "Mở/đóng chương trình đào tạo",
    roles: {
      owner: true,
      bgh: true,
      po: false,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P010",
    name: "Xem báo cáo chất lượng",
    roles: {
      owner: true,
      bgh: true,
      po: true,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: true,
    },
  },
  {
    id: "P011",
    name: "Phân bổ giảng viên",
    roles: {
      owner: true,
      bgh: true,
      po: true,
      cd: false,
      tch: false,
      adm: true,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P012",
    name: "Quản lý KCT theo ngành",
    roles: {
      owner: true,
      bgh: true,
      po: true,
      cd: false,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P013",
    name: "Theo dõi tiến độ khóa học",
    roles: {
      owner: true,
      bgh: true,
      po: true,
      cd: false,
      tch: true,
      adm: true,
      acc: false,
      qa: true,
    },
  },
  {
    id: "P014",
    name: "Quản lý nội dung",
    roles: {
      owner: true,
      bgh: false,
      po: true,
      cd: true,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P015",
    name: "Tạo/chỉnh sửa KCT",
    roles: {
      owner: true,
      bgh: false,
      po: true,
      cd: true,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P016",
    name: "Thiết kế Course/Lesson/Activity",
    roles: {
      owner: true,
      bgh: false,
      po: true,
      cd: true,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P017",
    name: "Quản lý tài liệu/quiz/assignment",
    roles: {
      owner: true,
      bgh: false,
      po: true,
      cd: true,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P018",
    name: "Gửi KCT để duyệt",
    roles: {
      owner: true,
      bgh: false,
      po: true,
      cd: true,
      tch: false,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P019",
    name: "Giảng dạy & Đánh giá",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P020",
    name: "Quản lý lớp học được phân công",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P021",
    name: "Điểm danh",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P022",
    name: "Chấm điểm & bài tập",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P023",
    name: "Quản lý lesson plan",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
  {
    id: "P024",
    name: "Giao tiếp với học viên",
    roles: {
      owner: true,
      bgh: false,
      po: false,
      cd: false,
      tch: true,
      adm: false,
      acc: false,
      qa: false,
    },
  },
];

const PermissionMatrixOverview = () => {
  const roles = ["OWN", "BGH", "PO", "CD", "TCH", "ADM", "ACC", "QA"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cấu hình chi tiết quyền hạn cho từng vai trò trong hệ thống
        </p>
        <div className="flex gap-2">
          <Button variant="outline">Khôi phục mặc định</Button>
          <Button>Lưu thay đổi</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Quyền hạn</TableHead>
              {roles.map((role) => (
                <TableHead key={role} className="text-center">
                  {role}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPermissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">{permission.name}</TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.owner} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.bgh} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.po} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.cd} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.tch} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.adm} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.acc} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={permission.roles.qa} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PermissionMatrixOverview;