"use client";

import React from "react";
import InfoCard from "./InfoCard";
import RoleCard from "./RoleCard";
import {
  CrownIcon,
  GraduationCapIcon,
  BookIcon,
  PencilIcon,
  UsersIcon,
  HeadsetIcon,
  CalculatorIcon,
  ClipboardCheckIcon,
} from "lucide-react";

const RoleOverviewDashboard = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Tổng số vai trò"
          value={8}
          description="Vai trò được cấu hình"
        />
        <InfoCard
          title="Tổng người dùng"
          value={95}
          description="Người dùng hoạt động"
        />
        <InfoCard
          title="Trung tâm"
          value={3}
          description="Trung tâm đang quản lý"
        />
        <InfoCard
          title="Quyền hạn"
          value={32}
          description="Quyền hạn được phân chia"
        />
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RoleCard
          icon={CrownIcon}
          title="Owner / Admin"
          description="Siêu quản trị, đa tenant, gói & thanh toán"
          currentUsers={2}
          maxUsers={5}
          permissions={[
            "Quản lý đa tenant (nhiều trung tâm/trường)",
            "Quản lý gói dịch vụ, thanh toán, hạn dùng",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={GraduationCapIcon}
          title="BGH / Academic Director"
          description="Ban giám hiệu / Giám đốc học thuật"
          currentUsers={3}
          maxUsers={10}
          permissions={[
            "Duyệt và phê chuẩn Khung chương trình (KCT)",
            "Mở / khóa chương trình đào tạo mới",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={BookIcon}
          title="Program Owner"
          description="PM học thuật quản lý chương trình"
          currentUsers={8}
          maxUsers={20}
          permissions={[
            "Quản lý KCT theo ngành/ngôn ngữ",
            "Theo dõi tiến độ khóa học thuộc chương trình",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={PencilIcon}
          title="Học vụ / Curriculum Designer"
          description="Thiết kế chương trình và nội dung học"
          currentUsers={12}
          maxUsers={30}
          permissions={[
            "Tạo mới / phiên bản / đề xuất KCT",
            "Thiết kế Course, Lesson, Activity",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={UsersIcon}
          title="Teacher / TA"
          description="Giảng viên & Trợ giảng"
          currentUsers={45}
          maxUsers={100}
          permissions={[
            "Nhận & quản lý lớp được phân công",
            "Điểm danh, chấm điểm, chấm bài tập",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={HeadsetIcon}
          title="Tư vấn / CSKH"
          description="Tuyển sinh & Chăm sóc khách hàng"
          currentUsers={15}
          maxUsers={25}
          permissions={[
            "Quản lý tuyển sinh, nhập học, hợp đồng",
            "Theo dõi tiến độ & chăm sóc học viên",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={CalculatorIcon}
          title="Kế toán / Thu ngân"
          description="Quản lý tài chính và thanh toán"
          currentUsers={6}
          maxUsers={15}
          permissions={[
            "Quản lý học phí, hóa đơn, công nợ",
            "Theo dõi thanh toán theo lớp / học viên",
            "+2 quyền khác...",
          ]}
        />
        <RoleCard
          icon={ClipboardCheckIcon}
          title="QA (Quality Assurance)"
          description="Đảm bảo chất lượng giảng dạy"
          currentUsers={4}
          maxUsers={10}
          permissions={[
            "Giám sát chất lượng giảng dạy (theo rubric)",
            "Thu thập feedback học viên, phụ huynh",
            "+2 quyền khác...",
          ]}
        />
      </div>
    </div>
  );
};

export default RoleOverviewDashboard;