"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GamificationGrading from "@/components/gamification-grading/GamificationGrading";

const GamificationGradingPage = () => {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Gamification & Chấm điểm
        </h1>
        <p className="text-md text-muted-foreground">
          Quản lý điểm thưởng, huy hiệu và hệ thống chấm điểm theo CEFR.
        </p>
      </div>

      <GamificationGrading />
    </div>
  );
};

export default GamificationGradingPage;