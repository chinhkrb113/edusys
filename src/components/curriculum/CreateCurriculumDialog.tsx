"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import AIAssist from "./AIAssist";

const createSchema = z.object({
  code: z.string().min(1, "Mã KCT là bắt buộc").max(64, "Mã KCT tối đa 64 ký tự").regex(/^[A-Z0-9-_]+$/, "Mã KCT chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới"),
  name: z.string().min(1, "Tên KCT là bắt buộc").max(255, "Tên KCT tối đa 255 ký tự"),
  language: z.string().min(1, "Ngôn ngữ là bắt buộc"),
  target_level: z.string().optional(),
  age_group: z.enum(["kids", "teens", "adults", "all"]).optional(),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
});

type CreateFormData = z.infer<typeof createSchema>;

interface CreateCurriculumDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  showAIAssist?: boolean;
}

export const CreateCurriculumDialog: React.FC<CreateCurriculumDialogProps> = ({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  children
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();

  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      language: "english",
      age_group: "all",
    },
  });

  const createMutation = useMutation({
    mutationFn: curriculumService.createCurriculum,
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đã tạo khung chương trình "${data.name}" thành công`,
      });
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo khung chương trình",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra khi tạo khung chương trình",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFormData) => {
    createMutation.mutate(data as any);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Curriculum Assistant</DialogTitle>
          <DialogDescription>
            Sử dụng AI để tạo khung chương trình mới một cách thông minh
          </DialogDescription>
        </DialogHeader>
        <AIAssist />
      </DialogContent>
    </Dialog>
  );
};
