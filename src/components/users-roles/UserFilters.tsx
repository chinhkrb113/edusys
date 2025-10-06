"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

const UserFilters = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm kiếm theo tên hoặc email..." className="pl-9" />
      </div>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tất cả vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả vai trò</SelectItem>
          <SelectItem value="owner">Owner / Admin</SelectItem>
          <SelectItem value="bgh">BGH / Academic Director</SelectItem>
          <SelectItem value="program_owner">Program Owner</SelectItem>
          <SelectItem value="curriculum_designer">Học vụ / Curriculum Designer</SelectItem>
          <SelectItem value="teacher">Teacher / TA</SelectItem>
          <SelectItem value="consultant">Tư vấn / CSKH</SelectItem>
          <SelectItem value="accountant">Kế toán / Thu ngân</SelectItem>
          <SelectItem value="qa">QA (Quality Assurance)</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tất cả trung tâm" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trung tâm</SelectItem>
          <SelectItem value="hanoi">Trung tâm Hà Nội</SelectItem>
          <SelectItem value="hcm">Trung tâm TP.HCM</SelectItem>
          <SelectItem value="danang">Trung tâm Đà Nẵng</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserFilters;