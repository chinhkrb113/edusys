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
  DownloadIcon,
  FileTextIcon,
  FileIcon,
  PackageIcon,
  QrCodeIcon,
  GlobeIcon,
  LockIcon,
  CalendarIcon,
  SettingsIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  EyeIcon,
  SaveIcon,
  ShareIcon,
  CopyIcon,
} from "lucide-react";

interface ExportJob {
  id: string;
  kctVersionId: string;
  kctName: string;
  version: string;
  format: 'pdf' | 'docx' | 'scorm';
  languageMode: 'vi' | 'en' | 'dual';
  campus: string;
  watermark: 'auto' | 'force' | 'none';
  visibility: 'public' | 'org-only';
  expiresAt?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileUrl?: string;
  checksum?: string;
  qrCode?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface CampusBrand {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  address: string;
  contact: string;
}

interface ExportPreset {
  id: string;
  name: string;
  format: ExportJob['format'];
  languageMode: ExportJob['languageMode'];
  campus: string;
  watermark: ExportJob['watermark'];
  visibility: ExportJob['visibility'];
  expiresInDays?: number;
}

const mockExportJobs: ExportJob[] = [
  {
    id: "export-001",
    kctVersionId: "kct-001-v1.2",
    kctName: "Business English B1-B2",
    version: "v1.2",
    format: "pdf",
    languageMode: "dual",
    campus: "Campus A",
    watermark: "auto",
    visibility: "org-only",
    status: "completed",
    progress: 100,
    fileUrl: "#",
    checksum: "a1b2c3d4e5f6...",
    qrCode: "data:image/png;base64,...",
    createdBy: "Alice Johnson",
    createdAt: "2024-10-28T10:00:00Z",
    completedAt: "2024-10-28T10:15:00Z"
  },
  {
    id: "export-002",
    kctVersionId: "kct-002-v1.0",
    kctName: "IELTS Preparation B2-C1",
    version: "v1.0",
    format: "scorm",
    languageMode: "en",
    campus: "Campus B",
    watermark: "none",
    visibility: "public",
    status: "processing",
    progress: 75,
    createdBy: "Bob Smith",
    createdAt: "2024-10-28T11:00:00Z"
  }
];

const mockCampuses: CampusBrand[] = [
  {
    id: "campus-a",
    name: "Campus A",
    logo: "/logos/campus-a.png",
    primaryColor: "#1f2937",
    secondaryColor: "#3b82f6",
    fontFamily: "Inter",
    address: "123 Main St, City A",
    contact: "contact@campusa.edu"
  },
  {
    id: "campus-b",
    name: "Campus B",
    logo: "/logos/campus-b.png",
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    fontFamily: "Roboto",
    address: "456 Oak Ave, City B",
    contact: "info@campusb.edu"
  }
];

const mockPresets: ExportPreset[] = [
  {
    id: "preset-1",
    name: "Campus A - PDF Dual",
    format: "pdf",
    languageMode: "dual",
    campus: "Campus A",
    watermark: "auto",
    visibility: "org-only"
  },
  {
    id: "preset-2",
    name: "Public SCORM English",
    format: "scorm",
    languageMode: "en",
    campus: "Campus B",
    watermark: "none",
    visibility: "public",
    expiresInDays: 365
  }
];

const ExportPublishing = () => {
  const [selectedKCT, setSelectedKCT] = useState<string>("kct-001-v1.2");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState<Partial<ExportJob>>({
    format: "pdf",
    languageMode: "dual",
    campus: "Campus A",
    watermark: "auto",
    visibility: "org-only"
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(mockExportJobs);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const handleExport = async () => {
    if (!selectedKCT) return;

    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      kctVersionId: selectedKCT,
      kctName: "Business English B1-B2", // Mock
      version: "v1.2",
      format: exportConfig.format!,
      languageMode: exportConfig.languageMode!,
      campus: exportConfig.campus!,
      watermark: exportConfig.watermark!,
      visibility: exportConfig.visibility!,
      status: "queued",
      progress: 0,
      createdBy: "Current User",
      createdAt: new Date().toISOString(),
      ...exportConfig
    };

    setExportJobs(prev => [newJob, ...prev]);
    setShowExportDialog(false);

    // Simulate processing
    setTimeout(() => {
      setExportJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? { ...job, status: "processing" as const, progress: 25 }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setExportJobs(prev => prev.map(job =>
        job.id === newJob.id
          ? {
              ...job,
              status: "completed" as const,
              progress: 100,
              fileUrl: "#",
              checksum: "mock-checksum-" + Date.now(),
              qrCode: "data:image/png;base64,mock-qr",
              completedAt: new Date().toISOString()
            }
          : job
      ));
    }, 5000);
  };

  const loadPreset = (presetId: string) => {
    const preset = mockPresets.find(p => p.id === presetId);
    if (preset) {
      setExportConfig({
        format: preset.format,
        languageMode: preset.languageMode,
        campus: preset.campus,
        watermark: preset.watermark,
        visibility: preset.visibility,
        expiresAt: preset.expiresInDays
          ? new Date(Date.now() + preset.expiresInDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined
      });
    }
  };

  const getStatusBadge = (status: ExportJob['status']) => {
    const config = {
      queued: { label: "Queued", className: "bg-gray-100 text-gray-800" },
      processing: { label: "Processing", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      failed: { label: "Failed", className: "bg-red-100 text-red-800" }
    };
    const current = config[status];
    return (
      <Badge variant="outline" className={current.className}>
        {current.label}
      </Badge>
    );
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileTextIcon className="h-4 w-4" />;
      case 'docx': return <FileIcon className="h-4 w-4" />;
      case 'scorm': return <PackageIcon className="h-4 w-4" />;
      default: return <FileIcon className="h-4 w-4" />;
    }
  };

  const recentJobs = exportJobs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Export & Publishing</h2>
          <p className="text-sm text-muted-foreground">
            Export curriculum in multiple formats with branding and verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <QrCodeIcon className="h-3 w-3 mr-1" />
            Verifiable
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DownloadIcon className="h-5 w-5" />
              Export Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KCT Selection */}
            <div>
              <Label>Select Curriculum Version</Label>
              <Select value={selectedKCT} onValueChange={setSelectedKCT}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kct-001-v1.2">Business English B1-B2 v1.2</SelectItem>
                  <SelectItem value="kct-002-v1.0">IELTS Preparation B2-C1 v1.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Presets */}
            <div>
              <Label>Quick Presets</Label>
              <Select value={selectedPreset} onValueChange={(value) => {
                setSelectedPreset(value);
                loadPreset(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset" />
                </SelectTrigger>
                <SelectContent>
                  {mockPresets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Export Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Format</Label>
                <Select
                  value={exportConfig.format}
                  onValueChange={(value: ExportJob['format']) =>
                    setExportConfig(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF (Print-ready)</SelectItem>
                    <SelectItem value="docx">DOCX (Editable)</SelectItem>
                    <SelectItem value="scorm">SCORM (LMS-ready)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={exportConfig.languageMode}
                  onValueChange={(value: ExportJob['languageMode']) =>
                    setExportConfig(prev => ({ ...prev, languageMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="dual">Dual Language</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Campus Branding</Label>
                <Select
                  value={exportConfig.campus}
                  onValueChange={(value) =>
                    setExportConfig(prev => ({ ...prev, campus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCampuses.map(campus => (
                      <SelectItem key={campus.id} value={campus.name}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Visibility</Label>
                <Select
                  value={exportConfig.visibility}
                  onValueChange={(value: ExportJob['visibility']) =>
                    setExportConfig(prev => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org-only">
                      <div className="flex items-center gap-2">
                        <LockIcon className="h-4 w-4" />
                        Organization Only
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <GlobeIcon className="h-4 w-4" />
                        Public Access
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div>
                <Label>Watermark</Label>
                <Select
                  value={exportConfig.watermark}
                  onValueChange={(value: ExportJob['watermark']) =>
                    setExportConfig(prev => ({ ...prev, watermark: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Based on status)</SelectItem>
                    <SelectItem value="force">Force Watermark</SelectItem>
                    <SelectItem value="none">No Watermark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Link Expiry (Optional)</Label>
                <Input
                  type="date"
                  value={exportConfig.expiresAt || ""}
                  onChange={(e) =>
                    setExportConfig(prev => ({ ...prev, expiresAt: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Export Button */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Generate Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Export</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Format:</span>
                      <span className="ml-2">{exportConfig.format?.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Language:</span>
                      <span className="ml-2">{exportConfig.languageMode?.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Campus:</span>
                      <span className="ml-2">{exportConfig.campus}</span>
                    </div>
                    <div>
                      <span className="font-medium">Visibility:</span>
                      <span className="ml-2">{exportConfig.visibility}</span>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Export may take 15-60 seconds depending on format and content size.
                      You'll receive a notification when ready.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button onClick={handleExport} className="flex-1">
                      Start Export
                    </Button>
                    <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Recent Exports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(job.format)}
                      <span className="font-medium text-sm">{job.kctName}</span>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>v{job.version} • {job.campus}</div>
                    <div>{job.languageMode.toUpperCase()} • {job.createdBy}</div>
                  </div>

                  {job.status === 'processing' && (
                    <Progress value={job.progress} className="mt-2 h-1" />
                  )}

                  {job.status === 'completed' && job.fileUrl && (
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <DownloadIcon className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline">
                              <QrCodeIcon className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <img src={job.qrCode} alt="QR Code" className="w-20 h-20 mx-auto mb-2" />
                              <p className="text-xs">Scan to verify</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curriculum</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.kctName}</div>
                      <div className="text-sm text-muted-foreground">v{job.version}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFormatIcon(job.format)}
                      <span className="capitalize">{job.format}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {job.status === 'completed' && (
                        <>
                          <Button size="sm" variant="ghost">
                            <DownloadIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ShareIcon className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <QrCodeIcon className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <EyeIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPublishing;