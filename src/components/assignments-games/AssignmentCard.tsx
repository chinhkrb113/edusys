"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpenIcon,
  MicIcon,
  ListChecksIcon,
  FileTextIcon,
  UsersIcon,
  MoreHorizontalIcon,
  PlayIcon,
  LucideIcon,
} from "lucide-react";
import type { Assignment } from "@/services/assignmentsService";

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

const skillIconMap: Record<string, LucideIcon> = {
  reading: BookOpenIcon,
  writing: FileTextIcon,
  speaking: MicIcon,
  listening: UsersIcon,
  vocabulary: ListChecksIcon,
  grammar: ListChecksIcon,
  collaboration: UsersIcon,
};

const defaultIcon = BookOpenIcon;

const getAssignmentIcon = (assignment: Assignment): LucideIcon => {
  if (assignment.skill) {
    const normalized = assignment.skill.toLowerCase();
    if (skillIconMap[normalized]) {
      return skillIconMap[normalized];
    }
  }

  if (assignment.type) {
    const normalized = assignment.type.toLowerCase();
    if (skillIconMap[normalized]) {
      return skillIconMap[normalized];
    }
  }

  return defaultIcon;
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const Icon = getAssignmentIcon(assignment);

  const handlePractice = () => {
    navigate(`/assignments/${assignment.id}/practice`);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Icon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {assignment.level ? `Trình độ: ${assignment.level}` : "Trình độ: Chưa cập nhật"}
                {" • "}
                {assignment.skill ? `Kỹ năng: ${assignment.skill}` : "Kỹ năng: Tổng hợp"}
                {" • "}
                {assignment.durationMinutes} phút
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontalIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuItem onClick={(e) => {
                 e.stopPropagation();
                 handlePractice();
               }}>
                 <PlayIcon className="mr-2 h-4 w-4" />
                 Làm bài
               </DropdownMenuItem>
               <DropdownMenuItem onClick={(e) => {
                 e.stopPropagation();
                 onEdit(assignment);
               }}>Chỉnh sửa</DropdownMenuItem>
               <DropdownMenuItem
                 className="text-red-600 focus:text-red-600"
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(assignment);
                 }}
               >
                 Xóa
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>

        {assignment.description && (
          <p className="text-sm text-muted-foreground">
            {assignment.description}
          </p>
        )}

        {assignment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assignment.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={handlePractice}
            className="flex items-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            Làm bài
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
