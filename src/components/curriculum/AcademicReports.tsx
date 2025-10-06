"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUpIcon,
  TargetIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  PieChartIcon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  EyeIcon,
  ZapIcon,
  UsersIcon,
  BookOpenIcon,
  AwardIcon,
} from "lucide-react";

interface CEFRMatrixData {
  cefr: string;
  listening: number;
  speaking: number;
  reading: number;
  writing: number;
  grammar: number;
  vocabulary: number;
  pronunciation: number;
}

interface CoverageData {
  campus: string;
  program: string;
  level: string;
  totalClasses: number;
  latestVersionClasses: number;
  coveragePercentage: number;
  outdatedClasses: number;
}

interface ApprovalTimeline {
  month: string;
  draftToPending: number; // days
  pendingToApproved: number; // days
  totalTime: number;
  count: number;
}

interface ImpactData {
  kctVersion: string;
  rolloutDate: string;
  beforePassRate: number;
  afterPassRate: number;
  beforeCompletionRate: number;
  afterCompletionRate: number;
  beforeAvgScore: number;
  afterAvgScore: number;
  sampleSize: number;
  confidence: number;
}

const mockCEFRMatrix: CEFRMatrixData[] = [
  { cefr: "A1", listening: 95, speaking: 90, reading: 85, writing: 80, grammar: 88, vocabulary: 92, pronunciation: 75 },
  { cefr: "A2", listening: 88, speaking: 85, reading: 90, writing: 82, grammar: 85, vocabulary: 88, pronunciation: 80 },
  { cefr: "B1", listening: 82, speaking: 78, reading: 85, writing: 75, grammar: 80, vocabulary: 85, pronunciation: 70 },
  { cefr: "B2", listening: 75, speaking: 72, reading: 78, writing: 68, grammar: 75, vocabulary: 80, pronunciation: 65 },
  { cefr: "C1", listening: 68, speaking: 65, reading: 72, writing: 60, grammar: 70, vocabulary: 75, pronunciation: 60 },
];

const mockCoverageData: CoverageData[] = [
  { campus: "Campus A", program: "Business English", level: "B1-B2", totalClasses: 25, latestVersionClasses: 22, coveragePercentage: 88, outdatedClasses: 3 },
  { campus: "Campus A", program: "IELTS", level: "B2-C1", totalClasses: 18, latestVersionClasses: 16, coveragePercentage: 89, outdatedClasses: 2 },
  { campus: "Campus B", program: "General English", level: "A1-A2", totalClasses: 32, latestVersionClasses: 28, coveragePercentage: 88, outdatedClasses: 4 },
  { campus: "Campus B", program: "Business English", level: "B1-B2", totalClasses: 20, latestVersionClasses: 18, coveragePercentage: 90, outdatedClasses: 2 },
];

const mockApprovalTimeline: ApprovalTimeline[] = [
  { month: "Aug 2024", draftToPending: 3.2, pendingToApproved: 5.8, totalTime: 9.0, count: 12 },
  { month: "Sep 2024", draftToPending: 2.8, pendingToApproved: 4.9, totalTime: 7.7, count: 15 },
  { month: "Oct 2024", draftToPending: 2.5, pendingToApproved: 4.2, totalTime: 6.7, count: 18 },
];

const mockImpactData: ImpactData[] = [
  {
    kctVersion: "Business English B1-B2 v1.2",
    rolloutDate: "2024-09-15",
    beforePassRate: 72.5,
    afterPassRate: 78.3,
    beforeCompletionRate: 85.2,
    afterCompletionRate: 89.1,
    beforeAvgScore: 7.2,
    afterAvgScore: 7.8,
    sampleSize: 145,
    confidence: 0.92
  },
  {
    kctVersion: "IELTS B2-C1 v1.0",
    rolloutDate: "2024-08-20",
    beforePassRate: 68.9,
    afterPassRate: 74.2,
    beforeCompletionRate: 82.1,
    afterCompletionRate: 86.5,
    beforeAvgScore: 6.8,
    afterAvgScore: 7.3,
    sampleSize: 98,
    confidence: 0.88
  }
];

const AcademicReports = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ from: "2024-08-01", to: "2024-10-31" });

  const filteredCoverageData = useMemo(() => {
    return mockCoverageData.filter(item => {
      if (selectedCampus !== "all" && item.campus !== selectedCampus) return false;
      if (selectedProgram !== "all" && item.program !== selectedProgram) return false;
      if (selectedLevel !== "all" && item.level !== selectedLevel) return false;
      return true;
    });
  }, [selectedCampus, selectedProgram, selectedLevel]);

  const overallCoverage = useMemo(() => {
    const total = filteredCoverageData.reduce((sum, item) => sum + item.totalClasses, 0);
    const covered = filteredCoverageData.reduce((sum, item) => sum + item.latestVersionClasses, 0);
    return total > 0 ? Math.round((covered / total) * 100) : 0;
  }, [filteredCoverageData]);

  const avgApprovalTime = useMemo(() => {
    const total = mockApprovalTimeline.reduce((sum, item) => sum + item.totalTime, 0);
    return (total / mockApprovalTimeline.length).toFixed(1);
  }, []);

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getMatrixCellColor = (value: number) => {
    if (value >= 90) return "bg-green-100 text-green-800";
    if (value >= 80) return "bg-blue-100 text-blue-800";
    if (value >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const impactChartData = mockImpactData.map(item => ({
    version: item.kctVersion.split(' ')[0],
    before: item.beforePassRate,
    after: item.afterPassRate,
    improvement: item.afterPassRate - item.beforePassRate
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Academic Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground">
            CEFR coverage matrix, approval timelines, and curriculum impact analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <BarChart3Icon className="h-3 w-3 mr-1" />
            Data-Driven
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Campus</Label>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  <SelectItem value="Campus A">Campus A</SelectItem>
                  <SelectItem value="Campus B">Campus B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="Business English">Business English</SelectItem>
                  <SelectItem value="IELTS">IELTS</SelectItem>
                  <SelectItem value="General English">General English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="A1-A2">A1-A2</SelectItem>
                  <SelectItem value="B1-B2">B1-B2</SelectItem>
                  <SelectItem value="B2-C1">B2-C1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-[130px]"
                />
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-[130px]"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline">
                <DownloadIcon className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TargetIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                <p className={`text-2xl font-bold ${getCoverageColor(overallCoverage)}`}>
                  {overallCoverage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ClockIcon className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Approval Time</p>
                <p className="text-2xl font-bold">{avgApprovalTime} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">CEFR Gaps</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUpIcon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Impact Score</p>
                <p className="text-2xl font-bold">+8.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cefr-matrix" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cefr-matrix">CEFR Matrix</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="approval">Approval Timeline</TabsTrigger>
          <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="cefr-matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                CEFR Skills Coverage Matrix
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentage of units with objectives/activities/rubric for each CEFR level and skill
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-3 text-left font-medium">CEFR Level</th>
                      <th className="border p-3 text-center font-medium">Listening</th>
                      <th className="border p-3 text-center font-medium">Speaking</th>
                      <th className="border p-3 text-center font-medium">Reading</th>
                      <th className="border p-3 text-center font-medium">Writing</th>
                      <th className="border p-3 text-center font-medium">Grammar</th>
                      <th className="border p-3 text-center font-medium">Vocabulary</th>
                      <th className="border p-3 text-center font-medium">Pronunciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCEFRMatrix.map((row) => (
                      <tr key={row.cefr}>
                        <td className="border p-3 font-medium">{row.cefr}</td>
                        <td className="border p-3 text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={`cursor-pointer ${getMatrixCellColor(row.listening)}`}
                                  onClick={() => {/* Drill down */}}
                                >
                                  {row.listening}%
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to see detailed units</p>
                                <p className="text-xs">Missing: 2 units need listening activities</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.speaking)}>
                            {row.speaking}%
                          </Badge>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.reading)}>
                            {row.reading}%
                          </Badge>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.writing)}>
                            {row.writing}%
                          </Badge>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.grammar)}>
                            {row.grammar}%
                          </Badge>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.vocabulary)}>
                            {row.vocabulary}%
                          </Badge>
                        </td>
                        <td className="border p-3 text-center">
                          <Badge className={getMatrixCellColor(row.pronunciation)}>
                            {row.pronunciation}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>3 CEFR gaps detected:</strong> B2 Writing (68%), C1 Pronunciation (60%), C1 Writing (60%).
                  Click on any percentage to see which units need improvement.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Version Coverage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campus</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Total Classes</TableHead>
                    <TableHead>Latest Version</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Outdated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoverageData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.campus}</TableCell>
                      <TableCell>{item.program}</TableCell>
                      <TableCell>{item.level}</TableCell>
                      <TableCell>{item.totalClasses}</TableCell>
                      <TableCell>{item.latestVersionClasses}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.coveragePercentage} className="w-16 h-2" />
                          <span className={`text-sm font-medium ${getCoverageColor(item.coveragePercentage)}`}>
                            {item.coveragePercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.outdatedClasses > 0 ? (
                          <Badge variant="destructive">
                            {item.outdatedClasses}
                          </Badge>
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Coverage Insights</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Overall coverage: {overallCoverage}% (Target: ≥90%)</li>
                  <li>• 9 classes using outdated curriculum versions</li>
                  <li>• Campus A has 2 programs below 90% coverage</li>
                  <li>• Recommendation: Schedule migration for outdated classes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Approval Timeline Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockApprovalTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="totalTime"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Total Time (days)"
                    />
                    <Line
                      type="monotone"
                      dataKey="draftToPending"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Draft→Pending"
                    />
                    <Line
                      type="monotone"
                      dataKey="pendingToApproved"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Pending→Approved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Draft→Pending</TableHead>
                    <TableHead>Pending→Approved</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Curricula Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApprovalTimeline.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{item.draftToPending}d</TableCell>
                      <TableCell>{item.pendingToApproved}d</TableCell>
                      <TableCell className="font-medium">{item.totalTime}d</TableCell>
                      <TableCell>{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert className="mt-4">
                <TrendingUpIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Improvement trend:</strong> Average approval time reduced by 25% over 3 months.
                  Bottleneck identified: Pending→Approved phase (5.0 days avg).
                  <strong>Recommendation:</strong> Increase reviewer capacity or implement auto-approval for low-risk changes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AwardIcon className="h-5 w-5" />
                Curriculum Impact Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Measuring learning outcomes before/after curriculum version rollouts
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={impactChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="version" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="before" fill="#ef4444" name="Before Rollout" />
                    <Bar dataKey="after" fill="#10b981" name="After Rollout" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curriculum Version</TableHead>
                    <TableHead>Rollout Date</TableHead>
                    <TableHead>Pass Rate Change</TableHead>
                    <TableHead>Completion Change</TableHead>
                    <TableHead>Avg Score Change</TableHead>
                    <TableHead>Sample Size</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockImpactData.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.kctVersion}</TableCell>
                      <TableCell>{item.rolloutDate}</TableCell>
                      <TableCell>
                        <Badge className={item.afterPassRate > item.beforePassRate ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {item.afterPassRate > item.beforePassRate ? "+" : ""}
                          {(item.afterPassRate - item.beforePassRate).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.afterCompletionRate > item.beforeCompletionRate ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          +{(item.afterCompletionRate - item.beforeCompletionRate).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.afterAvgScore > item.beforeAvgScore ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          +{(item.afterAvgScore - item.beforeAvgScore).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.sampleSize}</TableCell>
                      <TableCell>{(item.confidence * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Business English v1.2:</strong> +5.8% pass rate, +3.9% completion rate.
                    <strong>Confidence:</strong> 92% (n=145). Strong positive impact confirmed.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <TrendingUpIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IELTS v1.0:</strong> +5.3% pass rate, +4.4% completion rate.
                    <strong>Confidence:</strong> 88% (n=98). Significant improvement in exam preparation effectiveness.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicReports;