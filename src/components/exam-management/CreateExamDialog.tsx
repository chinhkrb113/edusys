"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateExamDialog: React.FC<CreateExamDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tạo kỳ thi / Đề thi mới</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết để tạo một đề thi mới trong ngân hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exam-name" className="text-right">
              Tên đề thi
            </Label>
            <Input id="exam-name" placeholder="e.g., Đề thi cuối kỳ IELTS B2" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exam-type" className="text-right">
              Phân loại
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn loại đề thi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placement">Placement test</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="mid-term">Mid-term</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="mock-test">Mock test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exam-level" className="text-right">
              Level
            </Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a1">A1</SelectItem>
                <SelectItem value="a2">A2</SelectItem>
                <SelectItem value="b1">B1</SelectItem>
                <SelectItem value="b2">B2</SelectItem>
                <SelectItem value="c1">C1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">
              Thời gian (phút)
            </Label>
            <Input id="duration" type="number" placeholder="90" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pass-mark" className="text-right">
              Điểm đạt (%)
            </Label>
            <Input id="pass-mark" type="number" placeholder="50" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Mô tả
            </Label>
            <Textarea id="description" placeholder="Mô tả ngắn về mục tiêu và quy chế của đề thi." className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit">Tạo đề thi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamDialog;