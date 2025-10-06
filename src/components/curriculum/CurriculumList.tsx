"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { curriculumService } from "@/services/curriculumService";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  SearchIcon,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  CheckCircle2,
  PlayCircle,
  Archive,
  Filter,
  Download,
  Settings,
  CalendarIcon,
  X,
  Save,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { CreateCurriculumDialog } from "./CreateCurriculumDialog";
import { EditCurriculumDialog } from "./EditCurriculumDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const mockCurricula = [
  {
    id: "kct-001",
    name: "Business English B1-B2",
    program: "Business English",
    language: "English",
    level: "B1-B2",
    ageGroup: "Adults",
    totalHours: 150,
    courseCount: 15,
    status: "draft" as const,
    owner: "Lê Thị Hoa",
    version: "v1.0",
    lastUpdated: "2024-10-28",
    learningObjectives: ["Business Communication", "Presentation Skills", "Email Writing"],
    summary: "Focuses on business communication and presentation skills for professionals.",
    tags: ["Business", "Communication", "Professional"],
  },
  {
    id: "kct-002",
    name: "English Foundation A1-A2",
    program: "English for Kids",
    language: "English",
    level: "A1-A2",
    ageGroup: "Kids",
    totalHours: 120,
    courseCount: 12,
    status: "approved" as const,
    owner: "Nguyễn Thị Lan",
    version: "v2.1",
    lastUpdated: "2024-10-25",
    learningObjectives: ["Basic Speaking", "Listening Skills", "Simple Reading"],
    summary: "Builds foundational speaking and listening skills for young learners.",
    tags: ["Foundation", "Kids", "Basic"],
  },
  {
    id: "kct-003",
    name: "IELTS Preparation B2-C1",
    program: "Exam Prep",
    language: "English",
    level: "B2-C1",
    ageGroup: "Teens/Adults",
    totalHours: 200,
    courseCount: 20,
    status: "published" as const,
    owner: "Trần Văn An",
    version: "v1.5",
    lastUpdated: "2024-10-20",
    learningObjectives: ["IELTS 6.5+", "Academic Writing", "Test Strategies"],
    summary: "Prepares students for the IELTS exam, targeting band 6.5+.",
    tags: ["IELTS", "Exam", "Academic"],
  },
  {
    id: "kct-004",
    name: "Japanese Communication N5",
    program: "Japanese",
    language: "Japanese",
    level: "N5",
    ageGroup: "Adults",
    totalHours: 100,
    courseCount: 10,
    status: "archived" as const,
    owner: "Sato Yumi",
    version: "v1.0",
    lastUpdated: "2023-05-15",
    learningObjectives: ["Hiragana/Katakana", "Basic Phrases", "Self-Introduction"],
    summary: "Basic Japanese communication for beginners.",
    tags: ["Japanese", "Beginner", "Communication"],
  },
];

type StatusType = "draft" | "approved" | "published" | "archived";

interface FilterState {
  search: string;
  program: string;
  language: string;
  level: string;
  ageGroup: string;
  learningObjectives: string;
  status: StatusType[];
  owner: string;
  dateRange: { from?: Date; to?: Date };
}

interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  visibleColumns: string[];
  isPrivate: boolean;
}

const getStatusBadge = (status: StatusType) => {
  const config = {
    draft: {
      label: "Bản nháp",
      icon: Pencil,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    approved: {
      label: "Đã phê duyệt",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-800 border-blue-200",
    },
    published: {
      label: "Đã xuất bản",
      icon: PlayCircle,
      className: "bg-green-100 text-green-800 border-green-200",
    },
    archived: {
      label: "Lưu trữ",
      icon: Archive,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    },
  };
  const current = config[status];
  const Icon = current.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 ${current.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {current.label}
    </Badge>
  );
};

const defaultColumns = [
  { key: "name", label: "Tên KCT", visible: true },
  { key: "program", label: "Ngành/Ngôn ngữ", visible: true },
  { key: "level", label: "Trình độ", visible: false },
  { key: "ageGroup", label: "Nhóm tuổi", visible: false },
  { key: "totalHours", label: "Tổng giờ", visible: false },
  { key: "courseCount", label: "Số khoá", visible: true },
  { key: "status", label: "Trạng thái", visible: true },
  { key: "owner", label: "Người phụ trách", visible: true },
  { key: "version", label: "Phiên bản", visible: true },
  { key: "lastUpdated", label: "Cập nhật cuối", visible: true },
];

const CurriculumList = () => {
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

  const queryClient = useQueryClient();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => curriculumService.deleteCurriculum(id),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa khung chương trình thành công",
      });
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xóa khung chương trình",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra khi xóa khung chương trình",
        variant: "destructive",
      });
    },
  });

  // Fetch curriculum data from API
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['curricula'],
    queryFn: () => curriculumService.getCurriculums(),
    retry: 1,
  });

  // Use API data if available, otherwise fall back to mock data
  const [data, setData] = useState(mockCurricula);

  // Update data when API response arrives
  React.useEffect(() => {
    if (apiData?.data) {
      // Transform API data to match component's expected format
      const transformedData = apiData.data.map(item => ({
        id: item.id.toString(),
        name: item.name,
        program: item.displayLanguage || item.language, // Use display language
        language: item.displayLanguage || item.language, // Also use display language here
        level: item.target_level || '',
        ageGroup: item.age_group || 'all',
        totalHours: item.total_hours,
        courseCount: 0, // Will be calculated from courses
        status: item.status as StatusType,
        owner: item.owner_name || 'Unknown',
        version: item.latest_version_no || 'v1.0',
        lastUpdated: new Date(item.updated_at).toISOString().split('T')[0],
        learningObjectives: item.learning_objectives || [],
        summary: item.description || '',
        tags: [], // Will be populated from tags relationship
        // New fields from database
        totalSessions: item.total_sessions,
        sessionDurationHours: item.session_duration_hours,
        learningMethod: item.learning_method,
        learningFormat: item.learning_format,
      }));
      setData(transformedData);
    }
  }, [apiData]);

  // Show error toast if API fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error loading curricula",
        description: "Failed to load curriculum data. Using sample data instead.",
        variant: "destructive",
      });
    }
  }, [error]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: "default",
      name: "Tất cả KCT",
      filters: {
        search: "",
        program: "all",
        language: "all",
        level: "all",
        ageGroup: "all",
        learningObjectives: "all",
        status: [],
        owner: "all",
        dateRange: {},
      },
      visibleColumns: defaultColumns.map(col => col.key),
      isPrivate: false,
    },
  ]);
  const [currentView, setCurrentView] = useState("default");

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    program: "all",
    language: "all",
    level: "all",
    ageGroup: "all",
    learningObjectives: "all",
    status: [],
    owner: "all",
    dateRange: {},
  });

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      // Search filter
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !item.summary.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Program filter
      if (filters.program !== "all" && item.program !== filters.program) {
        return false;
      }

      // Language filter
      if (filters.language !== "all" && item.language !== filters.language) {
        return false;
      }

      // Level filter
      if (filters.level !== "all" && item.level !== filters.level) {
        return false;
      }

      // Age group filter
      if (filters.ageGroup !== "all" && item.ageGroup !== filters.ageGroup) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false;
      }

      // Owner filter
      if (filters.owner !== "all" && item.owner !== filters.owner) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const itemDate = new Date(item.lastUpdated);
        if (filters.dateRange.from && itemDate < filters.dateRange.from) return false;
        if (filters.dateRange.to && itemDate > filters.dateRange.to) return false;
      }

      return true;
    });

    // Sort
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleBulkStatusChange = (newStatus: StatusType) => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setData(prev => prev.map(item =>
      selectedIds.includes(item.id) ? { ...item, status: newStatus } : item
    ));
    setRowSelection({});
  };

  const handleBulkReassign = (newOwner: string) => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    setData(prev => prev.map(item =>
      selectedIds.includes(item.id) ? { ...item, owner: newOwner } : item
    ));
    setRowSelection({});
  };

  const handleEdit = (curriculumId: string) => {
    setEditingCurriculumId(curriculumId);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (curriculum: any) => {
    setSelectedCurriculum(curriculum);
    setDetailDialogOpen(true);
  };

  const handleDelete = (curriculumId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khung chương trình này?")) {
      deleteMutation.mutate(parseInt(curriculumId));
    }
  };

  const handleBulkExport = () => {
    // Real export functionality using API
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedIds.length === 0) {
      toast({
        title: "Không có dữ liệu để export",
        description: "Vui lòng chọn ít nhất một khung chương trình để export",
        variant: "destructive",
      });
      return;
    }

    const selectedData = data.filter(item => selectedIds.includes(item.id));

    // Create CSV content
    const csvContent = [
      ["Mã KCT", "Tên KCT", "Ngôn ngữ", "Trình độ", "Nhóm tuổi", "Tổng giờ", "Trạng thái", "Người phụ trách"],
      ...selectedData.map(item => [
        item.id,
        item.name,
        item.language,
        item.level,
        item.ageGroup,
        item.totalHours.toString(),
        item.status,
        item.owner
      ])
    ].map(row => row.join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curricula_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setRowSelection({});
    toast({
      title: "Export thành công",
      description: `Đã export ${selectedData.length} khung chương trình`,
    });
  };

  const saveCurrentView = (name: string, isPrivate: boolean = false) => {
    const newView: SavedView = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      visibleColumns: columns.filter(col => col.visible).map(col => col.key),
      isPrivate,
    };
    setSavedViews(prev => [...prev, newView]);
    setCurrentView(newView.id);
  };

  const loadView = (view: SavedView) => {
    setFilters(view.filters);
    setColumns(columns.map(col => ({
      ...col,
      visible: view.visibleColumns.includes(col.key)
    })));
    setCurrentView(view.id);
  };

  const visibleColumns = columns.filter(col => col.visible);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách KCT...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${apiData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-muted-foreground">
          {apiData ? 'Đã kết nối với API backend' : 'Đang sử dụng dữ liệu mẫu'}
        </span>
        {apiData && (
          <span className="text-xs text-muted-foreground">
            ({apiData.total} KCT từ API)
          </span>
        )}
      </div>



      {/* Header with Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative w-full max-w-lg">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm KCT..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
                {(filters.program !== "all" ||
                  filters.language !== "all" ||
                  filters.level !== "all" ||
                  filters.ageGroup !== "all" ||
                  filters.dateRange.from ||
                  filters.search) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {[
                      filters.program !== "all",
                      filters.language !== "all",
                      filters.level !== "all",
                      filters.ageGroup !== "all",
                      filters.dateRange.from,
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Bộ lọc nâng cao</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({
                      search: "",
                      program: "all",
                      language: "all",
                      level: "all",
                      ageGroup: "all",
                      learningObjectives: "all",
                      status: [],
                      owner: "all",
                      dateRange: {},
                    })}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa tất cả
                  </Button>
                </div>

                {/* Program Filter */}
                <div>
                  <Label className="text-sm font-medium">Ngành/Chuyên ngành</Label>
                  <Select
                    value={filters.program}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, program: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Business English">Business English</SelectItem>
                      <SelectItem value="English for Kids">English for Kids</SelectItem>
                      <SelectItem value="Exam Prep">Exam Prep</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Filter */}
                <div>
                  <Label className="text-sm font-medium">Ngôn ngữ</Label>
                  <Select
                    value={filters.language}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Filter */}
                <div>
                  <Label className="text-sm font-medium">Trình độ</Label>
                  <Select
                    value={filters.level}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="A1-A2">A1-A2</SelectItem>
                      <SelectItem value="B1-B2">B1-B2</SelectItem>
                      <SelectItem value="B2-C1">B2-C1</SelectItem>
                      <SelectItem value="N5">N5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Group Filter */}
                <div>
                  <Label className="text-sm font-medium">Nhóm tuổi</Label>
                  <Select
                    value={filters.ageGroup}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Teens">Teens</SelectItem>
                      <SelectItem value="Adults">Adults</SelectItem>
                      <SelectItem value="Teens/Adults">Teens/Adults</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <Label className="text-sm font-medium">Khoảng thời gian</Label>
                  <div className="mt-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? (
                            filters.dateRange.to ? (
                              <>
                                {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                                {format(filters.dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(filters.dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Chọn khoảng thời gian</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={filters.dateRange?.from}
                          onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || {} }))}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>



          <Button variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button className="bg-gradient-to-r from-green-600 to-green-700 text-white" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm mới
          </Button>

          {/* Edit Button - Always visible but disabled when not exactly one item selected */}
          <Button
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
            disabled={Object.keys(rowSelection).length !== 1}
            onClick={() => {
              const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
              if (selectedIds.length === 1) {
                handleEdit(selectedIds[0]);
              } else {
                toast({
                  title: "Không thể chỉnh sửa nhiều items",
                  description: "Chỉ có thể chỉnh sửa một khung chương trình tại một thời điểm.",
                  variant: "destructive",
                });
              }
            }}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Chỉnh sửa
          </Button>

          {/* Delete Button - Only enabled when selections exist */}
          <Button
            variant="destructive"
            disabled={Object.keys(rowSelection).length === 0}
            onClick={() => {
              const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
              const confirmed = confirm(
                `Bạn có chắc chắn muốn xóa ${selectedIds.length} khung chương trình đã chọn?`
              );
              if (confirmed) {
                // Delete all selected items
                selectedIds.forEach(id => deleteMutation.mutate(parseInt(id)));
                setRowSelection({});
              }
            }}
          >
            <Archive className="h-4 w-4 mr-1" />
            Xóa ({Object.keys(rowSelection).length})
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredData.length} trên {data.length} KCT
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    filteredData.length > 0 &&
                    filteredData.every((row) => rowSelection[row.id])
                  }
                  onCheckedChange={(checked) => {
                    const newSelection: Record<string, boolean> = {};
                    if (checked) {
                      filteredData.forEach((row) => {
                        newSelection[row.id] = true;
                      });
                    }
                    setRowSelection(newSelection);
                  }}
                />
              </TableHead>
              {visibleColumns.map(column => (
                <TableHead key={column.key}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={rowSelection[row.id] || false}
                    onCheckedChange={(checked) => {
                      const newSelection = { ...rowSelection };
                      if (checked) {
                        newSelection[row.id] = true;
                      } else {
                        delete newSelection[row.id];
                      }
                      setRowSelection(newSelection);
                    }}
                  />
                </TableCell>
                {visibleColumns.map(column => {
                  switch (column.key) {
                    case "name":
                      return (
                        <TableCell key={column.key}>
                          <div
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => handleViewDetails(row)}
                          >
                            {row.name}
                          </div>
                        </TableCell>
                      );
                    case "program":
                      return (
                        <TableCell key={column.key}>
                          <div>
                            <div className="font-medium">{row.program}</div>
                            <div className="text-sm text-muted-foreground">{row.language}</div>
                          </div>
                        </TableCell>
                      );
                    case "status":
                      return (
                        <TableCell key={column.key}>
                          {getStatusBadge(row.status)}
                        </TableCell>
                      );
                    case "totalHours":
                      return (
                        <TableCell key={column.key}>
                          {row.totalHours}h
                        </TableCell>
                      );
                    case "courseCount":
                      return (
                        <TableCell key={column.key}>
                          {row.courseCount} khoá
                        </TableCell>
                      );
                    default:
                      return (
                        <TableCell key={column.key}>
                          {row[column.key as keyof typeof row]}
                        </TableCell>
                      );
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Đã chọn {Object.keys(rowSelection).length} trên {filteredData.length} KCT.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Trước
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sau
          </Button>
        </div>
      </div>



      {/* Create Dialog */}
      <CreateCurriculumDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Dialog */}
      <EditCurriculumDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        curriculumId={editingCurriculumId}
      />

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Chi tiết Khung Chương Trình
            </DialogTitle>
          </DialogHeader>

          {selectedCurriculum && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Thông tin cơ bản</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mã KCT</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phiên bản</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.version}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Tên KCT</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ngôn ngữ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.language}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ngành/Chuyên ngành</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.program}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trình độ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nhóm tuổi</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.ageGroup}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tổng giờ</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.totalHours}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Số khoá</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.courseCount} khoá</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                    <div className="flex items-center mt-1">
                      {getStatusBadge(selectedCurriculum.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Người phụ trách</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.owner}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Cập nhật cuối</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.lastUpdated}</p>
                  </div>
                </div>
              </div>

              {/* Learning Structure - New Fields */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cấu trúc học tập</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tổng số buổi học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.totalSessions || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Thời gian học/buổi</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.sessionDurationHours ? `${selectedCurriculum.sessionDurationHours}h` : 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Cách thức học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.learningMethod || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Hình thức học</Label>
                    <p className="text-sm font-medium">{selectedCurriculum.learningFormat || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Mô tả</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedCurriculum.summary || "Không có mô tả"}
                </p>
              </div>

              <Separator />

              {/* Learning Objectives */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Mục tiêu học tập</h3>
                {selectedCurriculum.learningObjectives && selectedCurriculum.learningObjectives.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedCurriculum.learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {objective}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có mục tiêu học tập</p>
                )}
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                {selectedCurriculum.tags && selectedCurriculum.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCurriculum.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Không có tags</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurriculumList;
