"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  currentUsers: number;
  maxUsers: number;
  permissions: string[];
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon: Icon,
  title,
  description,
  currentUsers,
  maxUsers,
  permissions,
}) => {
  const usagePercentage = (currentUsers / maxUsers) * 100;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <Badge variant="secondary">
          {currentUsers}/{maxUsers}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="mb-4">
          <div className="text-sm font-medium mb-1">Sử dụng</div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {usagePercentage.toFixed(0)}%
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Quyền hạn chính:</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {permissions.map((p, index) => (
              <li key={index}>{p}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;