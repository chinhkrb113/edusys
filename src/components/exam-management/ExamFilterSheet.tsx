"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExamFilterSheet: React.FC<ExamFilterSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bộ lọc đề thi</SheetTitle>
          <SheetDescription>
            Tinh chỉnh các tiêu chí để tìm kiếm đề thi phù hợp.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="filter-level">Level</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Level</SelectItem>
                <SelectItem value="a1">A1</SelectItem>
                <SelectItem value="a2">A2</SelectItem>
                <SelectItem value="b1">B1</SelectItem>
                <SelectItem value="b2">B2</SelectItem>
                <SelectItem value="c1">C1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="filter-skill">Kỹ năng</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kỹ năng</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 items-center gap-2">
            <Label htmlFor="filter-type">Loại hình</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hình</SelectItem>
                <SelectItem value="placement">Placement test</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="mid-term">Mid-term</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="mock-test">Mock test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Xóa bộ lọc</Button>
          <Button type="submit" onClick={() => onOpenChange(false)}>Áp dụng</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ExamFilterSheet;