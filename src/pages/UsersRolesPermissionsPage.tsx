"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleOverviewDashboard from "@/components/users-roles/RoleOverviewDashboard";
import UserFilters from "@/components/users-roles/UserFilters";
import UserList from "@/components/users-roles/UserList";
import PermissionMatrixOverview from "@/components/users-roles/PermissionMatrixOverview";
import InfoCard from "@/components/users-roles/InfoCard"; // Reusing InfoCard for multi-tenant summary
import OrganizationList from "@/components/users-roles/OrganizationList";
import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const UsersRolesPermissionsPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Quản lý Tổ chức & Nhân sự</h1>
      <p className="text-md text-muted-foreground">
        Hệ thống phân quyền và quản lý vai trò cho trung tâm đào tạo
      </p>
      <Tabs defaultValue="role-overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="role-overview">Tổng quan vai trò</TabsTrigger>
          <TabsTrigger value="user-management">Quản lý người dùng</TabsTrigger>
          <TabsTrigger value="permission-matrix">Ma trận phân quyền</TabsTrigger>
          <TabsTrigger value="multi-tenant">Đa trung tâm</TabsTrigger>
        </TabsList>
        <TabsContent value="role-overview">
          <RoleOverviewDashboard />
        </TabsContent>
        <TabsContent value="user-management">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
              <Button>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Thêm người dùng
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Quản lý tài khoản và phân quyền cho 5 người dùng
            </p>
            <UserFilters />
            <h3 className="text-xl font-semibold">Danh sách người dùng</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin và phân quyền cho tất cả người dùng trong hệ thống
            </p>
            <UserList />
          </div>
        </TabsContent>
        <TabsContent value="permission-matrix">
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold">Ma trận phân quyền</h2>
            <PermissionMatrixOverview />
          </div>
        </TabsContent>
        <TabsContent value="multi-tenant">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quản lý đa trung tâm</h2>
              <Button>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Thêm tổ chức
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Quản lý 3 tổ chức và 6 trung tâm
            </p>
            {/* Summary Cards for Multi-tenant */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                title="Tổng tổ chức"
                value={3}
                description="+1 từ tháng trước"
              />
              <InfoCard
                title="Tổng trung tâm"
                value={6}
                description="Trên 3 tổ chức"
              />
              <InfoCard
                title="Tổng người dùng"
                value={228}
                description="Người dùng hoạt động"
              />
              <InfoCard
                title="Doanh thu"
                value="45M"
                description="VND từ đăng ký"
              />
            </div>
            <h3 className="text-xl font-semibold">Danh sách tổ chức</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin và gói dịch vụ cho tất cả tổ chức
            </p>
            <OrganizationList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersRolesPermissionsPage;