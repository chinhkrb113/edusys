"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Plus, ClipboardListIcon, Gamepad2Icon } from "lucide-react";
import AssignmentsBank, { type AssignmentsBankHandle } from "@/components/assignments-games/AssignmentsBank";
import GamesBank, { type GamesBankHandle } from "@/components/assignments-games/GamesBank";

const AssignmentsGamesPage = () => {
  const [activeTab, setActiveTab] = useState<"assignments" | "games">("assignments");
  const assignmentsRef = useRef<AssignmentsBankHandle>(null);
  const gamesRef = useRef<GamesBankHandle>(null);

  const handleCreate = () => {
    if (activeTab === "assignments") {
      assignmentsRef.current?.openCreateDialog();
    } else {
      gamesRef.current?.openCreateDialog();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50 min-h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ngân hàng Bài tập & Trò chơi</h1>
          <p className="text-md text-muted-foreground">
            Quản lý, tìm kiếm và triển khai tài nguyên học tập phong phú cho giáo viên và học viên.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" disabled>
            <Filter className="mr-2 h-4 w-4" /> Bộ lọc nâng cao
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Tạo mới
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "assignments" | "games") } className="w-full">
        <TabsList className="bg-gray-200/70 p-1 rounded-lg inline-flex">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4" /> Ngân hàng Bài tập
          </TabsTrigger>
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2Icon className="h-4 w-4" /> Ngân hàng Trò chơi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          <AssignmentsBank ref={assignmentsRef} />
        </TabsContent>
        <TabsContent value="games">
          <GamesBank ref={gamesRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssignmentsGamesPage;
