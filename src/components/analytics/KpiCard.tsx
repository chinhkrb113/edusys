"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  description: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  description,
}) => {
  const isPositive = change && change.startsWith("+");
  const isNegative = change && change.startsWith("-");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isPositive && "text-green-600",
              isNegative && "text-red-600",
            )}
          >
            {change} so với tháng trước
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

export default KpiCard;