"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LinkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  TargetIcon,
  ZapIcon,
  PlayCircleIcon,
  CalendarIcon,
  ShieldIcon,
  RotateCcwIcon,
  TrendingUpIcon,
  XCircleIcon,
  InfoIcon,
  SettingsIcon,
  EyeIcon,
  DownloadIcon,
} from "lucide-react";

interface KCT {
  id: string;
  name: string;
  level: string;
  totalHours: number;
  courses: number;
  status: 'published' | 'draft';
  version: string;
}

interface Class {
  id: string;
  name: string;
  program: string;
  level: string;
  modality: 'online' | 'offline' | 'hybrid';
  maxStudents: number;
  currentStudents: number;
  startDate: string;
  appliedKCT?: {
    id: string;
    version: string;
    appliedAt: string;
    appliedBy: string;
  };
  mappingStatus: 'none' | 'passed' | 'warnings' | 'blocked';
  mappingConflicts: Array<{
    type: 'hours' | 'level' | 'age' | 'modality' | 'resources';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestedFix?: string;
  }>;
}

interface Conflict {
  type: 'hours' | 'level' | 'age' | 'modality' | 'resources';
  severity: 'low' | 'medium' | 'high';
  message: string;
  currentValue: string | number;
  requiredValue: string | number;
  suggestedFix?: string;
}

interface MismatchReport {
  classId: string;
  kctId: string;
  conflicts: Conflict[];
  canProceed: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RolloutPlan {
  id: string;
  kctId: string;
  kctVersion: string;
  scope: 'campus' | 'program' | 'global';
  targetIds: string[];
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  prerequisites: string[];
  appliedClasses: number;
  totalClasses: number;
}

const mockKCTs: KCT[] = [
  {
    id: "kct-001",
    name: "Business English B1-B2",
    level: "B1-B2",
    totalHours: 120,
    courses: 4,
    status: "published",
    version: "v1.2"
  },
  {
    id: "kct-002",
    name: "IELTS Preparation B2-C1",
    level: "B2-C1",
    totalHours: 150,
    courses: 5,
    status: "published",
    version: "v1.0"
  }
];

const mockClasses: Class[] = [
  {
    id: "class-001",
    name: "Business English Intermediate",
    program: "Business English",
    level: "B1",
    modality: "hybrid",
    maxStudents: 20,
    currentStudents: 18,
    startDate: "2024-11-01",
    mappingStatus: "none",
    mappingConflicts: []
  },
  {
    id: "class-002",
    name: "IELTS Fighter Advanced",
    program: "IELTS",
    level: "B2",
    modality: "online",
    maxStudents: 15,
    currentStudents: 12,
    startDate: "2024-11-15",
    appliedKCT: {
      id: "kct-002",
      version: "v1.0",
      appliedAt: "2024-10-20",
      appliedBy: "Admin"
    },
    mappingStatus: "passed",
    mappingConflicts: []
  },
  {
    id: "class-003",
    name: "General English Elementary",
    program: "General English",
    level: "A2",
    modality: "offline",
    maxStudents: 25,
    currentStudents: 22,
    startDate: "2024-11-01",
    mappingStatus: "warnings",
    mappingConflicts: [
      {
        type: "hours",
        severity: "medium",
        message: "KCT requires 120 hours but class schedule only has 96 hours",
        suggestedFix: "Add 4 more sessions or reduce unit content"
      },
      {
        type: "modality",
        severity: "low",
        message: "KCT designed for hybrid but class is offline-only",
        suggestedFix: "Consider adding online components or override with justification"
      }
    ]
  }
];

const CurriculumMapping = () => {
  const [selectedKCT, setSelectedKCT] = useState<KCT | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [mismatchReport, setMismatchReport] = useState<MismatchReport | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [rolloutPlans, setRolloutPlans] = useState<RolloutPlan[]>([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const filteredClasses = useMemo(() => {
    if (!selectedKCT) return mockClasses;

    return mockClasses.filter(cls => {
      // Basic compatibility check
      const levelMatch = selectedKCT.level.includes(cls.level) || cls.level.includes(selectedKCT.level.split('-')[0]);
      const programMatch = selectedKCT.name.toLowerCase().includes(cls.program.toLowerCase()) ||
                          cls.program.toLowerCase().includes(selectedKCT.name.toLowerCase().split(' ')[0]);

      return levelMatch || programMatch;
    });
  }, [selectedKCT]);

  const validateMapping = async (kctId: string, classIds: string[]): Promise<MismatchReport> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const kct = mockKCTs.find(k => k.id === kctId)!;
    const conflicts: MismatchReport['conflicts'] = [];

    classIds.forEach(classId => {
      const cls = mockClasses.find(c => c.id === classId)!;

      // Hours mismatch
      if (kct.totalHours > 100) { // Mock condition
        conflicts.push({
          type: "hours",
          severity: "medium",
          message: `KCT requires ${kct.totalHours} hours but class schedule only accommodates 96 hours`,
          currentValue: 96,
          requiredValue: kct.totalHours,
          suggestedFix: "Add 4 more sessions or adjust unit pacing"
        });
      }

      // Level mismatch
      if (!kct.level.includes(cls.level)) {
        conflicts.push({
          type: "level",
          severity: "high",
          message: `KCT level ${kct.level} doesn't match class level ${cls.level}`,
          currentValue: cls.level,
          requiredValue: kct.level,
          suggestedFix: "Consider bridging content or level-appropriate KCT"
        });
      }

      // Modality mismatch
      if (kct.name.includes("Business") && cls.modality === "offline") {
        conflicts.push({
          type: "modality",
          severity: "low",
          message: "KCT designed for hybrid delivery but class is offline-only",
          currentValue: cls.modality,
          requiredValue: "hybrid",
          suggestedFix: "Add online components or provide justification for offline delivery"
        });
      }
    });

    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high').length;
    const riskLevel = highSeverityConflicts > 0 ? 'high' : conflicts.length > 2 ? 'medium' : 'low';

    return {
      classId: classIds[0],
      kctId,
      conflicts,
      canProceed: highSeverityConflicts === 0,
      riskLevel
    };
  };

  const handleValidate = async () => {
    if (!selectedKCT || selectedClasses.length === 0) return;

    setShowValidation(true);
    const report = await validateMapping(selectedKCT.id, selectedClasses);
    setMismatchReport(report);
  };

  const handleApply = async () => {
    if (!selectedKCT || !mismatchReport?.canProceed) return;

    // Mock apply logic
    selectedClasses.forEach(classId => {
      const cls = mockClasses.find(c => c.id === classId);
      if (cls) {
        cls.appliedKCT = {
          id: selectedKCT.id,
          version: selectedKCT.version,
          appliedAt: new Date().toISOString().split('T')[0],
          appliedBy: "Current User"
        };
        cls.mappingStatus = mismatchReport.conflicts.length > 0 ? 'warnings' : 'passed';
        cls.mappingConflicts = mismatchReport.conflicts;
      }
    });

    setShowApplyDialog(false);
    setSelectedClasses([]);
    setMismatchReport(null);
    setShowValidation(false);
  };

  const createRolloutPlan = () => {
    if (!selectedKCT) return;

    const plan: RolloutPlan = {
      id: `rollout-${Date.now()}`,
      kctId: selectedKCT.id,
      kctVersion: selectedKCT.version,
      scope: 'campus',
      targetIds: selectedClasses,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      progress: 0,
      prerequisites: ['Complete QA testing', 'Train instructors', 'Update resources'],
      appliedClasses: 0,
      totalClasses: selectedClasses.length
    };

    setRolloutPlans(prev => [...prev, plan]);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'low': return <InfoIcon className="h-4 w-4 text-blue-500" />;
      default: return <InfoIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Curriculum Mapping</h2>
          <p className="text-sm text-muted-foreground">
            Apply KCT blueprints to course templates and classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ShieldIcon className="h-3 w-3 mr-1" />
            Safety First
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KCT Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5" />
              Select KCT Blueprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockKCTs.filter(kct => kct.status === 'published').map((kct) => (
                <div
                  key={kct.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedKCT?.id === kct.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedKCT(kct)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{kct.name}</h4>
                    <Badge variant="outline">{kct.version}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>Level: {kct.level}</div>
                    <div>Hours: {kct.totalHours}h</div>
                    <div>Courses: {kct.courses}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Select Target Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedClasses.includes(cls.id) ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      setSelectedClasses(prev =>
                        prev.includes(cls.id)
                          ? prev.filter(id => id !== cls.id)
                          : [...prev, cls.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{cls.name}</h4>
                      <div className="flex items-center gap-2">
                        {cls.appliedKCT && (
                          <Badge variant="secondary" className="text-xs">
                            Applied
                          </Badge>
                        )}
                        <Badge variant={
                          cls.mappingStatus === 'passed' ? 'default' :
                          cls.mappingStatus === 'warnings' ? 'secondary' : 'destructive'
                        } className="text-xs">
                          {cls.mappingStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Level: {cls.level}</div>
                      <div>Modality: {cls.modality}</div>
                      <div>Students: {cls.currentStudents}/{cls.maxStudents}</div>
                      <div>Start: {cls.startDate}</div>
                    </div>
                    {cls.mappingConflicts.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          {cls.mappingConflicts.length} conflicts
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedClasses.length} classes selected
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={!selectedKCT || selectedClasses.length === 0}
          >
            <ShieldIcon className="h-4 w-4 mr-1" />
            Validate Mapping
          </Button>

          <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setShowApplyDialog(true)}
                disabled={!selectedKCT || selectedClasses.length === 0 || !mismatchReport?.canProceed}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Apply KCT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Apply {selectedKCT?.name} to Selected Classes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Application Scope</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Apply Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule Rollout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Justification (if overriding warnings)</Label>
                  <Textarea
                    placeholder="Explain why you're proceeding despite warnings..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleApply} className="flex-1">
                    Confirm Application
                  </Button>
                  <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={createRolloutPlan}>
            <CalendarIcon className="h-4 w-4 mr-1" />
            Schedule Rollout
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {showValidation && mismatchReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5" />
              Mapping Validation Report
              <Badge className={`ml-auto ${getRiskColor(mismatchReport.riskLevel)}`}>
                {mismatchReport.riskLevel.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mismatchReport.conflicts.map((conflict, idx) => (
                <Alert key={idx} className={
                  conflict.severity === 'high' ? 'border-red-200 bg-red-50' :
                  conflict.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(conflict.severity)}
                    <div className="flex-1">
                      <AlertDescription className="font-medium">
                        {conflict.message}
                      </AlertDescription>
                      {conflict.suggestedFix && (
                        <p className="text-sm mt-1 text-muted-foreground">
                          💡 {conflict.suggestedFix}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Current:</span>
                        <Badge variant="outline" className="text-xs">{conflict.currentValue}</Badge>
                        <span className="text-xs text-muted-foreground">Required:</span>
                        <Badge variant="outline" className="text-xs">{conflict.requiredValue}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Fix Now
                    </Button>
                  </div>
                </Alert>
              ))}

              {mismatchReport.conflicts.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No conflicts detected. This KCT can be safely applied to the selected classes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rollout Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Rollout Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rolloutPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{mockKCTs.find(k => k.id === plan.kctId)?.name} v{plan.kctVersion}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      plan.status === 'completed' ? 'default' :
                      plan.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {plan.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Scope:</span>
                    <span className="ml-1 capitalize">{plan.scope}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="ml-1">{plan.scheduledDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="ml-1">{plan.appliedClasses}/{plan.totalClasses}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <Badge variant="outline" className="text-xs ml-1">Low</Badge>
                  </div>
                </div>

                {plan.prerequisites.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Prerequisites:</span>
                    <div className="flex gap-1 mt-1">
                      {plan.prerequisites.map((prereq, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {plan.status === 'in_progress' && (
                  <Progress value={(plan.appliedClasses / plan.totalClasses) * 100} className="mt-2" />
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Monitor
                  </Button>
                  <Button size="sm" variant="outline">
                    <RotateCcwIcon className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurriculumMapping;