"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Pencil, Loader2 } from "lucide-react";

const editSchema = z.object({
  name: z.string().min(1, "Tên KCT là bắt buộc").max(255, "Tên KCT tối đa 255 ký tự"),
  target_level: z.string().optional(),
  age_group: z.enum(["kids", "teens", "adults", "all"]).optional(),
  total_sessions: z.coerce.number().min(1, "Số buổi học tối thiểu 1").max(1000, "Số buổi học tối đa 1000").optional(),
  session_duration_hours: z.coerce.number().min(0.5, "Thời gian học tối thiểu 0.5h").max(20, "Thời gian học tối đa 20h").optional(),
  learning_method: z.string().max(128, "Cách thức học tối đa 128 ký tự").optional(),
  learning_format: z.string().max(128, "Hình thức học tối đa 128 ký tự").optional(),
  description: z.string().max(2000, "Mô tả tối đa 2000 ký tự").optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditCurriculumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curriculumId: string | null;
}

export const EditCurriculumDialog: React.FC<EditCurriculumDialogProps> = ({
  open,
  onOpenChange,
  curriculumId,
}) => {
  const queryClient = useQueryClient();

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  // Fetch curriculum details when dialog opens
  const { data: curriculum, isLoading } = useQuery({
    queryKey: ['curriculum', curriculumId],
    queryFn: () => curriculumId ? curriculumService.getCurriculum(parseInt(curriculumId)) : null,
    enabled: open && !!curriculumId,
  });

  // Update form when curriculum data loads
  useEffect(() => {
    if (curriculum) {
      form.reset({
        name: curriculum.name,
        target_level: curriculum.target_level || '',
        age_group: curriculum.age_group || 'all',
        total_sessions: curriculum.total_sessions || undefined,
        session_duration_hours: curriculum.session_duration_hours || undefined,
        learning_method: curriculum.learning_method || '',
        learning_format: curriculum.learning_format || '',
        description: curriculum.description || '',
      });
    }
  }, [curriculum, form]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      curriculumService.updateCurriculum(id, data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật khung chương trình thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật khung chương trình",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra khi cập nhật khung chương trình",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditFormData) => {
    if (!curriculumId) return;
    updateMutation.mutate({
      id: parseInt(curriculumId),
      data
    });
  };

  const isPending = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh Sửa Khung Chương Trình</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin khung chương trình. Chỉ có thể chỉnh sửa một số trường khi chương trình chưa được xuất bản.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Khung Chương Trình *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trình độ</FormLabel>
                      <FormControl>
                        <Input placeholder="A1, B1, N5..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhóm tuổi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn nhóm tuổi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kids">Trẻ em</SelectItem>
                          <SelectItem value="teens">Thiếu niên</SelectItem>
                          <SelectItem value="adults">Người lớn</SelectItem>
                          <SelectItem value="all">Tất cả</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* New Learning Structure Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="total_sessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số buổi học</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="session_duration_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thời gian học/buổi (giờ)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="2.0"
                          {...field}
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="learning_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cách thức học</FormLabel>
                      <FormControl>
                        <Input placeholder="Tự học với hướng dẫn, Hướng dẫn theo nhóm..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learning_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hình thức học</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn hình thức học" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Trực tuyến">Trực tuyến</SelectItem>
                          <SelectItem value="Trực tiếp">Trực tiếp</SelectItem>
                          <SelectItem value="Kết hợp">Kết hợp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mô tả chi tiết về khung chương trình..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {curriculum && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">
                    <strong>Mã KCT:</strong> {curriculum.code} <br />
                    <strong>Ngôn ngữ:</strong> {curriculum.language} <br />
                    <strong>Trạng thái:</strong> {curriculum.status}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-2" />
                      Cập nhật
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
