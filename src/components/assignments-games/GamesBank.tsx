"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gamepad2Icon,
  SearchIcon,
  FilterIcon,
  PlusCircleIcon,
  TrophyIcon,
  UsersIcon,
  ClockIcon,
  StarIcon,
  EditIcon,
  TrashIcon,
  PlayIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignmentsGamesFilters } from "@/hooks/useAssignmentsGamesFilters";
import { gamesService, type Game, type GameListResult, type GameListFilters } from "@/services/gamesService";
import { useToast } from "@/hooks/use-toast";

export interface GamesBankHandle {
  openCreateDialog: () => void;
}

const UNSET_OPTION = 'unset';

interface GameFormState {
  title: string;
  type: string;
  level: string;
  skill: string;
  durationMinutes: number;
  players: string;
  description: string;
  tags: string;
  playsCount: number;
  rating: number;
  apiIntegration: string;
}

const DEFAULT_FORM_STATE: GameFormState = {
  title: "",
  type: "",
  level: "",
  skill: "",
  durationMinutes: 15,
  players: "",
  description: "",
  tags: "",
  playsCount: 0,
  rating: 4.5,
  apiIntegration: "",
};

const GamesBank = forwardRef<GamesBankHandle>((_, ref) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    filters,
    setSearch,
    setLevel,
    setSkill,
    setType,
    setPage,
    levelOptions,
    skillOptions,
    typeOptions,
    difficultyOptions,
    visibilityOptions,
    setDifficulty,
    setVisibility,
    setOwnerOnly,
  } = useAssignmentsGamesFilters({ defaultPageSize: 6 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [formState, setFormState] = useState<GameFormState>(DEFAULT_FORM_STATE);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const listFilters: GameListFilters = useMemo(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search.trim() || undefined,
    level: filters.level !== "all" ? filters.level : undefined,
    skill: filters.skill !== "all" ? filters.skill : undefined,
    type: filters.type !== "all" ? filters.type : undefined,
    difficulty: filters.difficulty !== "all" ? filters.difficulty : undefined,
    visibility: filters.visibility !== "all" ? (filters.visibility as 'public' | 'private') : undefined,
    ownerOnly: filters.ownerOnly || undefined,
  }), [filters]);

  const gamesQuery = useQuery<GameListResult>({
    queryKey: ["games", listFilters],
    queryFn: () => gamesService.list(listFilters),
    placeholderData: (prev) => prev as GameListResult | undefined,
    staleTime: 30000,
  });

  const { data, isLoading, isFetching } = gamesQuery;
  const games = data?.data ?? [];
  const pagination = data ? {
    page: data.page,
    pageSize: data.pageSize,
    total: data.total,
    totalPages: data.totalPages,
  } : { page: 1, pageSize: filters.pageSize, total: 0, totalPages: 1 };

  const resetForm = useCallback(() => {
    setFormState(DEFAULT_FORM_STATE);
    setEditingGame(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  useImperativeHandle(ref, () => ({
    openCreateDialog: handleOpenCreate,
  }), [handleOpenCreate]);

  const setFormFromGame = useCallback((game: Game) => {
    setFormState({
      title: game.title,
      type: game.type ?? "",
      level: game.level ?? "",
      skill: game.skill ?? "",
      durationMinutes: game.durationMinutes ?? 0,
      players: game.players ?? "",
      description: game.description ?? "",
      tags: game.tags.join(", "),
      playsCount: game.playsCount ?? 0,
      rating: game.rating ?? 0,
      apiIntegration: game.apiIntegration ?? "",
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: gamesService.create,
    onSuccess: () => {
      toast({ title: "Thành công", description: "Đã thêm trò chơi mới." });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      toast({ title: "Không thể tạo trò chơi", description: "Vui lòng thử lại." , variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof gamesService.update>[1]; }) =>
      gamesService.update(id, payload),
    onSuccess: () => {
      toast({ title: "Đã cập nhật", description: "Thông tin trò chơi đã được lưu." });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      toast({ title: "Không thể cập nhật", description: "Vui lòng thử lại." , variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gamesService.remove(id),
    onSuccess: () => {
      toast({ title: "Đã xóa", description: "Trò chơi đã được xóa." });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      toast({ title: "Không thể xóa", description: "Vui lòng thử lại." , variant: "destructive" });
    },
    onSettled: () => {
      setIsDeleteDialogOpen(false);
      setGameToDelete(null);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      title: formState.title.trim(),
      type: formState.type || null,
      level: formState.level || null,
      skill: formState.skill || null,
      durationMinutes: formState.durationMinutes,
      players: formState.players.trim() || null,
      description: formState.description.trim() || null,
      playsCount: formState.playsCount,
      rating: Math.min(5, Math.max(0, formState.rating)),
      apiIntegration: formState.apiIntegration.trim() || null,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };

    if (!payload.title) {
      toast({ title: "Thiếu tiêu đề", description: "Vui lòng nhập tên trò chơi." , variant: "destructive" });
      return;
    }

    if (editingGame) {
      updateMutation.mutate({ id: editingGame.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (game: Game) => {
    setEditingGame(game);
    setFormFromGame(game);
    setIsDialogOpen(true);
  };

  const handleDelete = (game: Game) => {
    setGameToDelete(game);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (gameToDelete) {
      deleteMutation.mutate(gameToDelete.id);
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen, resetForm]);

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Card className="border-dashed">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Gamepad2Icon className="h-5 w-5" /> Ngân hàng trò chơi
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Khám phá và quản lý các trò chơi học tập dành cho từng trình độ.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm theo tên, mô tả..."
                className="pl-11 h-11"
              />
            </div>
            <Button variant="outline" className="bg-white" disabled>
              <FilterIcon className="mr-2 h-4 w-4" /> Bộ lọc nâng cao
            </Button>
            <Button onClick={handleOpenCreate}>
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Thêm trò chơi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Trình độ</Label>
              <Select value={filters.level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "Tất cả" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Kỹ năng</Label>
              <Select value={filters.skill} onValueChange={setSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {skillOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "Tất cả" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Loại trò chơi</Label>
              <Select value={filters.type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "Tất cả" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tổng số trò chơi</Label>
              <div className="h-10 flex items-center rounded-md border border-dashed border-muted px-3 text-sm text-muted-foreground">
                {data?.total ?? 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : games.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gamepad2Icon className="h-5 w-5 text-purple-500" />
                      {game.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {game.level && <Badge variant="outline">{game.level}</Badge>}
                      {game.skill && <Badge>{game.skill}</Badge>}
                      {game.type && <Badge variant="secondary">{game.type}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(game)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(game)}>
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {game.description && (
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" /> {game.durationMinutes} phút
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    {game.players ?? "Cá nhân"}
                  </div>
                  <div className="flex items-center gap-1">
                    <PlayIcon className="h-4 w-4" />
                    {game.playsCount.toLocaleString()} lượt chơi
                  </div>
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4 text-yellow-500" />
                    {game.rating.toFixed(1)} / 5.0
                  </div>
                </div>

                {game.apiIntegration && (
                  <Badge variant="secondary" className="text-xs">
                    API: {game.apiIntegration}
                  </Badge>
                )}

                {game.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    <PlayIcon className="mr-1 h-4 w-4" /> Chơi thử
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <TrophyIcon className="mr-1 h-4 w-4" /> Giao bài
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed rounded-xl">
          <Gamepad2Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Chưa có trò chơi nào phù hợp</p>
          <p className="text-sm text-muted-foreground">
            Sử dụng nút "Thêm trò chơi" để tạo mới nội dung tương tác cho học viên.
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Trang {pagination.page} / {Math.max(1, pagination.totalPages)}
          {isFetching && " • Đang tải..."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingGame ? "Chỉnh sửa trò chơi" : "Thêm trò chơi mới"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="game-title">Tên trò chơi</Label>
                <Input
                  id="game-title"
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ví dụ: Vocabulary Flashcards"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select
                  value={formState.type || UNSET_OPTION}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, type: value === UNSET_OPTION ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET_OPTION}>Không xác định</SelectItem>
                    {typeOptions
                      .filter((option) => option !== "all")
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trình độ</Label>
                <Select
                  value={formState.level || UNSET_OPTION}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, level: value === UNSET_OPTION ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trình độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET_OPTION}>Không xác định</SelectItem>
                    {levelOptions
                      .filter((option) => option !== "all")
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kỹ năng chính</Label>
                <Select
                  value={formState.skill || UNSET_OPTION}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, skill: value === UNSET_OPTION ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kỹ năng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET_OPTION}>Không xác định</SelectItem>
                    {skillOptions
                      .filter((option) => option !== "all")
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Thời lượng (phút)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.durationMinutes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Số người chơi</Label>
                <Input
                  value={formState.players}
                  onChange={(event) => setFormState((prev) => ({ ...prev, players: event.target.value }))}
                  placeholder="Ví dụ: 1-4 người"
                />
              </div>
              <div className="space-y-2">
                <Label>Lượt chơi</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.playsCount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, playsCount: Number(event.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Xếp hạng (0 - 5)</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={formState.rating}
                  onChange={(event) => setFormState((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tích hợp API</Label>
                <Input
                  value={formState.apiIntegration}
                  onChange={(event) => setFormState((prev) => ({ ...prev, apiIntegration: event.target.value }))}
                  placeholder="Ví dụ: Kahoot"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formState.description}
                onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Mô tả luật chơi, mục tiêu học tập hoặc lưu ý triển khai"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Thẻ (ngăn cách bằng dấu phẩy)</Label>
              <Input
                value={formState.tags}
                onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="Ví dụ: Vocabulary, Audio, Interactive"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingGame ? "Lưu thay đổi" : "Tạo trò chơi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trò chơi?</AlertDialogTitle>
            <AlertDialogDescription>
              Trò chơi sẽ bị xóa khỏi ngân hàng. Bạn có muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

GamesBank.displayName = "GamesBank";

export default GamesBank;
