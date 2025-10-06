"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontalIcon, BookOpenIcon, UserIcon, MapPinIcon, UsersIcon, CalendarDaysIcon, PlayIcon, CheckCircleIcon, ArchiveIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClassCardProps {
  id: string;
  name: string;
  program: string;
  level: string;
  course: string;
  teacher: string;
  campus: string;
  modality: string;
  location: string;
  studentsEnrolled: number;
  studentsMax: number;
  startDate: string;
  status: "running" | "finished" | "archived";
}

const getStatusBadge = (status: ClassCardProps["status"]) => {
  switch (status) {
    case "running":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><PlayIcon className="h-3 w-3 mr-1" /> Running</Badge>;
    case "finished":
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white"><CheckCircleIcon className="h-3 w-3 mr-1" /> Finished</Badge>;
    case "archived":
      return <Badge variant="outline" className="text-muted-foreground"><ArchiveIcon className="h-3 w-3 mr-1" /> Archived</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  program,
  level,
  course,
  teacher,
  campus,
  modality,
  location,
  studentsEnrolled,
  studentsMax,
  startDate,
  status,
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          {getStatusBadge(status)}
        </div>

        <div className="flex gap-1 mb-2">
          <Badge variant="outline">{program}</Badge>
          <Badge variant="outline">{level}</Badge>
          <Badge variant={
            modality === "online" ? "default" :
            modality === "offline" ? "secondary" : "outline"
          }>
            {modality}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{id}</p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-4 w-4 text-primary" />
            <span>{course}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <span>GV: {teacher}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-primary" />
            <span>{campus} • {location}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span>{studentsEnrolled}/{studentsMax}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>{startDate}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
              <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Xóa</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;