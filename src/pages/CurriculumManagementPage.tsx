"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  Plus,
  BookOpenCheck,
  LayoutGrid,
  FilePenLine,
  BarChart3,
  GitBranch,
  CheckCircle,
  Link,
  FolderOpen,
  Download,
  TrendingUp,
  Bot,
  Zap,
  Shield,
} from "lucide-react";
import CurriculumList from "@/components/curriculum/CurriculumList";
import { CreateCurriculumDialog } from "@/components/curriculum/CreateCurriculumDialog";
import StructureEditor from "@/components/curriculum/StructureEditor";
import VersionApproval from "@/components/curriculum/VersionApproval";
import CurriculumMapping from "@/components/curriculum/CurriculumMapping";
import ContentManagement from "@/components/curriculum/ContentManagement";
import AIAssist from "@/components/curriculum/AIAssist";
import ExportPublishing from "@/components/curriculum/ExportPublishing";
import AcademicReports from "@/components/curriculum/AcademicReports";
import GuardrailsValidation from "@/components/curriculum/GuardrailsValidation";

const CurriculumManagementPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "kct-list";

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case "kct-list":
        return "Danh sách KCT";
      case "create-edit":
        return "Tạo mới KCT";
      case "structure-editor":
        return "Structure Editor";
      case "versions-approval":
        return "Phiên bản & Phê duyệt";
      case "mapping":
        return "Mapping KCT";
      case "content-management":
        return "Quản lý nội dung";
      case "export-publishing":
        return "Xuất bản & Export";
      case "academic-reports":
        return "Báo cáo & Ma trận";
      case "guardrails-validation":
        return "Quy tắc & Bảo vệ";
      default:
        return "Danh sách khung chương trình";
    }
  };

  let content;
  switch (activeTab) {
    case "create-edit":
      content = (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
          <p className="text-lg text-gray-600">
            Form tạo mới/chỉnh sửa KCT với AI assist
          </p>
        </div>
      );
      break;
    case "structure-editor":
      content = <StructureEditor />;
      break;
    case "versions-approval":
      content = <VersionApproval />;
      break;
    case "mapping":
      content = <CurriculumMapping />;
      break;
    case "content-management":
      content = <ContentManagement />;
      break;
    case "export-publishing":
      content = <ExportPublishing />;
      break;
    case "academic-reports":
      content = <AcademicReports />;
      break;
    case "guardrails-validation":
      content = <GuardrailsValidation />;
      break;
    default:
      content = <CurriculumList />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Curriculum Management
        </h1>
        <h3 className="text-lg font-semibold text-muted-foreground">
          {getTabTitle(activeTab)}
        </h3>
      </div>
      <div className="mt-4">
        {content}
      </div>
    </div>
  );
};

export default CurriculumManagementPage;
