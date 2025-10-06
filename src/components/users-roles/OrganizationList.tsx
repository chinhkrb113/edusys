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
import { Building2Icon, MailIcon } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  domain: string;
  contactEmail: string;
  servicePackage: string;
  packagePrice: string;
  usersCurrent: number;
  usersMax: number;
  centersCurrent: number;
  centersMax: number;
  status: "active" | "trial" | "expired";
  expiresAt: string;
  createdAt: string;
}

const mockOrganizations: Organization[] = [
  {
    id: "ORG001",
    name: "Trung tâm Anh ngữ ABC",
    domain: "abc-english.com",
    contactEmail: "admin@abc-english.com",
    servicePackage: "Gói Cao cấp",
    packagePrice: "10,000,000 VND/tháng",
    usersCurrent: 125,
    usersMax: 500,
    centersCurrent: 3,
    centersMax: 10,
    status: "active",
    expiresAt: "2024-12-31",
    createdAt: "2023-01-15",
  },
  {
    id: "ORG002",
    name: "Học viện Tin học DEF",
    domain: "def-tech.edu.vn",
    contactEmail: "info@def-tech.edu.vn",
    servicePackage: "Gói Tiêu chuẩn",
    packagePrice: "5,000,000 VND/tháng",
    usersCurrent: 78,
    usersMax: 200,
    centersCurrent: 2,
    centersMax: 3,
    status: "active",
    expiresAt: "2024-06-30",
    createdAt: "2023-01-20",
  },
  {
    id: "ORG003",
    name: "Trường Mầm non GHI",
    domain: "ghi-preschool",
    contactEmail: "contact@ghi-preschool.com",
    servicePackage: "Gói Cơ bản",
    packagePrice: "2,000,000 VND/tháng",
    usersCurrent: 25,
    usersMax: 50,
    centersCurrent: 1,
    centersMax: 1,
    status: "trial",
    expiresAt: "2024-02-15",
    createdAt: "2024-01-01",
  },
];

const getStatusBadgeVariant = (status: Organization["status"]) => {
  switch (status) {
    case "active":
      return "default";
    case "trial":
      return "secondary";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
};

const OrganizationList = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tổ chức</TableHead>
            <TableHead>Gói dịch vụ</TableHead>
            <TableHead>Sử dụng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hết hạn</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockOrganizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Building2Icon className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org.domain}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MailIcon className="h-3 w-3 mr-1" />
                      {org.contactEmail}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{org.servicePackage}</p>
                <p className="text-sm text-muted-foreground">
                  {org.packagePrice}
                </p>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  Người dùng: {org.usersCurrent}/{org.usersMax}
                </div>
                <div className="text-sm">
                  Trung tâm: {org.centersCurrent}/{org.centersMax}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(org.status)}>
                  {org.status === "active" && "Đang hoạt động"}
                  {org.status === "trial" && "Dùng thử"}
                  {org.status === "expired" && "Hết hạn"}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="font-medium">{org.expiresAt}</p>
                <p className="text-xs text-muted-foreground">
                  Tạo: {org.createdAt}
                </p>
              </TableCell>
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

export default OrganizationList;