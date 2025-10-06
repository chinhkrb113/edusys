"use client";

import React, { useState, useMemo, useCallback } from "react";
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
  FileTextIcon,
  VideoIcon,
  AudioLinesIcon,
  ImageIcon,
  LinkIcon,
  UploadIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  BotIcon,
  TagIcon,
  TargetIcon,
  BookOpenIcon,
  ClockIcon,
  UsersIcon,
  ZapIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react";

interface Unit {
  id: string;
  title: string;
  duration: number;
  objectives: string[];
  skills: string[];
  activities: Array<{
    type: string;
    name: string;
    duration: number;
  }>;
  resources: Resource[];
  assessment: {
    type: string;
    rubric: Array<{
      criterion: string;
      weight: number;
      levels: string[];
    }>;
    passingScore: number;
  } | null;
  homework: string;
  completeness: number;
  lastUpdated: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'slide' | 'worksheet' | 'link' | 'image';
  url: string;
  fileSize?: number;
  duration?: number;
  skills: string[];
  cefrLevel: string;
  topic: string[];
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  license: string;
  isRestricted: boolean;
  ocrProcessed: boolean;
  autoTags: {
    skill: string[];
    cefrLevel: string;
    topic: string[];
    confidence: number;
  };
  healthStatus: 'healthy' | 'broken' | 'expired' | 'restricted';
  lastChecked: string;
  version: string;
  accessibility: {
    hasCaptions: boolean;
    hasTranscript: boolean;
    altText?: string;
    readingLevel?: string;
  };
}

interface CompletenessScore {
  objectives: number; // 20%
  skills: number; // 15%
  activities: number; // 20%
  rubric: number; // 25%
  resources: number; // 20%
  total: number;
  missingItems: string[];
}

const mockUnits: Unit[] = [
  {
    id: "unit-1",
    title: "Email Writing",
    duration: 90,
    objectives: [
      "Write professional emails",
      "Use appropriate business language",
      "Structure emails correctly"
    ],
    skills: ["Writing", "Grammar"],
    activities: [
      { type: "Individual", name: "Email drafting exercise", duration: 30 },
      { type: "Group", name: "Peer review session", duration: 30 },
      { type: "Class", name: "Email etiquette discussion", duration: 30 }
    ],
    resources: [],
    assessment: {
      type: "Written",
      rubric: [
        { criterion: "Content", weight: 40, levels: ["Poor", "Fair", "Good", "Excellent"] },
        { criterion: "Language", weight: 35, levels: ["Poor", "Fair", "Good", "Excellent"] },
        { criterion: "Format", weight: 25, levels: ["Poor", "Fair", "Good", "Excellent"] }
      ],
      passingScore: 70
    },
    homework: "Write a business email to a client",
    completeness: 85,
    lastUpdated: "2024-10-28"
  }
];

const mockResources: Resource[] = [
  {
    id: "res-1",
    title: "Business Email Templates",
    type: "pdf",
    url: "#",
    fileSize: 2048000,
    skills: ["Writing"],
    cefrLevel: "B1",
    topic: ["Business Communication"],
    tags: ["Templates", "Professional"],
    uploadedBy: "Alice Johnson",
    uploadedAt: "2024-10-25",
    license: "Internal Use Only",
    isRestricted: true,
    ocrProcessed: true,
    autoTags: {
      skill: ["Writing", "Grammar"],
      cefrLevel: "B1",
      topic: ["Business", "Communication"],
      confidence: 0.92
    },
    healthStatus: "healthy",
    lastChecked: "2024-10-28",
    version: "1.0",
    accessibility: {
      hasCaptions: false,
      hasTranscript: false,
      altText: "Business email template document",
      readingLevel: "Intermediate"
    }
  },
  {
    id: "res-2",
    title: "Presentation Skills Video",
    type: "video",
    url: "#",
    duration: 1800,
    skills: ["Speaking"],
    cefrLevel: "B1",
    topic: ["Presentation"],
    tags: ["Skills", "TED Talk"],
    uploadedBy: "Bob Smith",
    uploadedAt: "2024-10-20",
    license: "Creative Commons",
    isRestricted: false,
    ocrProcessed: false,
    autoTags: {
      skill: ["Speaking", "Presentation"],
      cefrLevel: "B1",
      topic: ["Presentation", "Public Speaking"],
      confidence: 0.88
    },
    healthStatus: "healthy",
    lastChecked: "2024-10-28",
    version: "1.0",
    accessibility: {
      hasCaptions: true,
      hasTranscript: true,
      altText: "Presentation skills training video",
      readingLevel: "Intermediate"
    }
  },
  {
    id: "res-3",
    title: "Broken Link Resource",
    type: "link",
    url: "https://broken-link.com",
    skills: ["Reading"],
    cefrLevel: "A2",
    topic: ["Grammar"],
    tags: ["Exercise"],
    uploadedBy: "Charlie Brown",
    uploadedAt: "2024-09-15",
    license: "Public Domain",
    isRestricted: false,
    ocrProcessed: false,
    autoTags: {
      skill: ["Reading"],
      cefrLevel: "A2",
      topic: ["Grammar"],
      confidence: 0.75
    },
    healthStatus: "broken",
    lastChecked: "2024-10-28",
    version: "1.0",
    accessibility: {
      hasCaptions: false,
      hasTranscript: false
    }
  }
];

const ContentManagement = () => {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedCEFR, setSelectedCEFR] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const calculateCompleteness = useCallback((unit: Unit): CompletenessScore => {
    const objectives = unit.objectives.length > 0 ? 20 : 0;
    const skills = unit.skills.length > 0 ? 15 : 0;
    const activities = unit.activities.length > 0 ? 20 : 0;
    const rubric = unit.assessment ? 25 : 0;
    const resources = unit.resources.length > 0 ? 20 : 0;

    const total = objectives + skills + activities + rubric + resources;

    const missingItems: string[] = [];
    if (objectives === 0) missingItems.push("Learning Objectives");
    if (skills === 0) missingItems.push("Skills");
    if (activities === 0) missingItems.push("Activities");
    if (rubric === 0) missingItems.push("Assessment Rubric");
    if (resources === 0) missingItems.push("Resources");

    return {
      objectives,
      skills,
      activities,
      rubric,
      resources,
      total,
      missingItems
    };
  }, []);

  const filteredResources = useMemo(() => {
    return mockResources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSkill = selectedSkill === "all" || resource.skills.includes(selectedSkill);
      const matchesCEFR = selectedCEFR === "all" || resource.cefrLevel === selectedCEFR;
      const matchesType = selectedType === "all" || resource.type === selectedType;

      return matchesSearch && matchesSkill && matchesCEFR && matchesType;
    });
  }, [searchTerm, selectedSkill, selectedCEFR, selectedType]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileTextIcon className="h-4 w-4" />;
      case 'video': return <VideoIcon className="h-4 w-4" />;
      case 'audio': return <AudioLinesIcon className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'slide': return <FileIcon className="h-4 w-4" />;
      case 'link': return <ExternalLinkIcon className="h-4 w-4" />;
      default: return <FileIcon className="h-4 w-4" />;
    }
  };

  const getHealthStatusBadge = (status: string) => {
    const config = {
      healthy: { label: "Healthy", className: "bg-green-100 text-green-800" },
      broken: { label: "Broken Link", className: "bg-red-100 text-red-800" },
      expired: { label: "Expired", className: "bg-yellow-100 text-yellow-800" },
      restricted: { label: "Restricted", className: "bg-orange-100 text-orange-800" }
    };
    const current = config[status as keyof typeof config];
    return (
      <Badge variant="outline" className={current.className}>
        {current.label}
      </Badge>
    );
  };

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      'Listening': 'bg-blue-100 text-blue-800',
      'Speaking': 'bg-green-100 text-green-800',
      'Reading': 'bg-purple-100 text-purple-800',
      'Writing': 'bg-orange-100 text-orange-800',
      'Grammar': 'bg-red-100 text-red-800',
      'Vocabulary': 'bg-indigo-100 text-indigo-800'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  const handleFileUpload = async (files: FileList) => {
    // Mock upload and OCR processing
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing ${file.name}...`);

      // Simulate OCR and auto-tagging
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResource: Resource = {
        id: `res-${Date.now()}-${i}`,
        title: file.name,
        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('video') ? 'video' : 'worksheet',
        url: URL.createObjectURL(file),
        fileSize: file.size,
        skills: ['Reading'], // Mock auto-tagged
        cefrLevel: 'B1',
        topic: ['General'],
        tags: [],
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString().split('T')[0],
        license: 'Internal Use',
        isRestricted: false,
        ocrProcessed: true,
        autoTags: {
          skill: ['Reading', 'Vocabulary'],
          cefrLevel: 'B1',
          topic: ['Academic'],
          confidence: 0.85
        },
        healthStatus: 'healthy',
        lastChecked: new Date().toISOString().split('T')[0],
        version: '1.0',
        accessibility: {
          hasCaptions: false,
          hasTranscript: false
        }
      };

      mockResources.push(mockResource);
    }

    setShowUploadDialog(false);
  };

  const healthStats = useMemo(() => {
    const total = mockResources.length;
    const healthy = mockResources.filter(r => r.healthStatus === 'healthy').length;
    const broken = mockResources.filter(r => r.healthStatus === 'broken').length;
    const expired = mockResources.filter(r => r.healthStatus === 'expired').length;
    const restricted = mockResources.filter(r => r.healthStatus === 'restricted').length;

    return { total, healthy, broken, expired, restricted };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Content Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage units, resources, and ensure content quality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ZapIcon className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="units" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Units List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  Units Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUnits.map((unit) => {
                    const completeness = calculateCompleteness(unit);
                    return (
                      <div
                        key={unit.id}
                        className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedUnit?.id === unit.id ? "border-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedUnit(unit)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{unit.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {unit.duration}min
                            </Badge>
                            <Badge variant={
                              completeness.total >= 80 ? 'default' :
                              completeness.total >= 60 ? 'secondary' : 'destructive'
                            } className="text-xs">
                              {completeness.total}%
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-1 mb-2">
                          {unit.skills.map(skill => (
                            <Badge key={skill} className={`text-xs ${getSkillColor(skill)}`}>
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {completeness.missingItems.length > 0 && (
                          <Alert className="mt-2">
                            <AlertTriangleIcon className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Missing: {completeness.missingItems.join(", ")}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUnit ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Completeness Score</Label>
                      <div className="mt-2">
                        <Progress value={calculateCompleteness(selectedUnit).total} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{calculateCompleteness(selectedUnit).total}% complete</span>
                          <span>Last updated: {selectedUnit.lastUpdated}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium">Objectives ({selectedUnit.objectives.length})</Label>
                      <ul className="mt-1 space-y-1">
                        {selectedUnit.objectives.map((obj, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircleIcon className="h-3 w-3 text-green-500 mt-0.5" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Resources ({selectedUnit.resources.length})</Label>
                      <div className="mt-1 space-y-1">
                        {selectedUnit.resources.map((resource, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {getResourceIcon(resource.type)}
                            <span>{resource.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {resource.cefrLevel}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedUnit.assessment && (
                      <div>
                        <Label className="text-sm font-medium">Assessment Rubric</Label>
                        <div className="mt-1 text-sm">
                          <p>Type: {selectedUnit.assessment.type}</p>
                          <p>Passing Score: {selectedUnit.assessment.passingScore}%</p>
                          <p>Criteria: {selectedUnit.assessment.rubric.length}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a unit to view details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    <SelectItem value="Listening">Listening</SelectItem>
                    <SelectItem value="Speaking">Speaking</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Writing">Writing</SelectItem>
                    <SelectItem value="Grammar">Grammar</SelectItem>
                    <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCEFR} onValueChange={setSelectedCEFR}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="CEFR" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UploadIcon className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Resources</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Drop files here</h3>
                        <p className="text-muted-foreground mb-4">
                          Supports PDF, DOCX, PPTX, MP4, MP3, images
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.pptx,.mp4,.mp3,.jpg,.png"
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button variant="outline" className="cursor-pointer">
                            Choose Files
                          </Button>
                        </label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Files will be automatically processed with OCR and AI tagging
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Resources Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resources ({filteredResources.length})</span>
                <Badge variant="outline" className="text-xs">
                  AI Tagged
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>CEFR</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceIcon(resource.type)}
                          <div>
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {resource.uploadedBy} • {resource.uploadedAt}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {resource.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {resource.skills.slice(0, 2).map(skill => (
                            <Badge key={skill} className={`text-xs ${getSkillColor(skill)}`}>
                              {skill}
                            </Badge>
                          ))}
                          {resource.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.cefrLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        {getHealthStatusBadge(resource.healthStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <BotIcon className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>AI Tags: {resource.autoTags.confidence * 100}%</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* Health Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{healthStats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy</p>
                    <p className="text-2xl font-bold text-green-600">{healthStats.healthy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Broken</p>
                    <p className="text-2xl font-bold text-red-600">{healthStats.broken}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-yellow-600">{healthStats.expired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Restricted</p>
                    <p className="text-2xl font-bold text-orange-600">{healthStats.restricted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                Health Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockResources
                  .filter(r => r.healthStatus !== 'healthy')
                  .map((resource) => (
                    <Alert key={resource.id} className={
                      resource.healthStatus === 'broken' ? 'border-red-200 bg-red-50' :
                      resource.healthStatus === 'expired' ? 'border-yellow-200 bg-yellow-50' :
                      'border-orange-200 bg-orange-50'
                    }>
                      <div className="flex items-start gap-3">
                        {resource.healthStatus === 'broken' && <XCircleIcon className="h-4 w-4 text-red-600" />}
                        {resource.healthStatus === 'expired' && <AlertTriangleIcon className="h-4 w-4 text-yellow-600" />}
                        {resource.healthStatus === 'restricted' && <ShieldIcon className="h-4 w-4 text-orange-600" />}
                        <div className="flex-1">
                          <AlertDescription className="font-medium">
                            {resource.title}
                          </AlertDescription>
                          <p className="text-sm mt-1">
                            Status: {resource.healthStatus} • Last checked: {resource.lastChecked}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline">
                              Fix Issue
                            </Button>
                            <Button size="sm" variant="outline">
                              Mirror Resource
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}

                {mockResources.filter(r => r.healthStatus !== 'healthy').length === 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      All resources are healthy! No issues detected.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentManagement;