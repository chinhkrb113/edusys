"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  VideoIcon,
  MonitorIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
} from "lucide-react";

const activeSessions = [
  { id: 1, student: "Nguyễn Văn A", exam: "Placement Test", progress: 75, flags: 2 },
  { id: 2, student: "Trần Thị B", exam: "Mid-term Grammar", progress: 50, flags: 0 },
];

const Proctoring = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <VideoIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Phiên thi đang diễn ra</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cảnh báo</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Thi hoàn thành</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Giám sát trực tiếp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.map(session => (
            <div key={session.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{session.student}</h3>
                <Badge variant={session.flags > 0 ? "destructive" : "default"}>
                  {session.flags} cảnh báo
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{session.exam}</p>
              <Progress value={session.progress} className="mb-2" />
              <Button size="sm" variant="outline">
                <EyeIcon className="mr-1 h-3 w-3" />
                Xem live
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Proctoring;