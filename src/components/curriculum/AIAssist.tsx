"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  BotIcon,
  SparklesIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshCwIcon,
  PinIcon,
  DownloadIcon,
  EyeIcon,
  LightbulbIcon,
  TargetIcon,
  BookOpenIcon,
  FileTextIcon,
  VideoIcon,
  AudioLinesIcon,
  LinkIcon,
  ZapIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RubricTemplate {
  criteria: Array<{
    name: string;
    weight: number;
    levels: string[];
  }>;
  passingScore: number;
}

interface AISuggestionSkeleton {
  type: 'skeleton';
  content: CurriculumSkeleton;
}

interface AISuggestionCEFR {
  type: 'cefr';
  content: CEFRMapping;
}

interface AISuggestionResources {
  type: 'resources';
  content: ResourceSuggestion[];
}

interface AISuggestionRubric {
  type: 'rubric';
  content: RubricTemplate;
}

type AISuggestion = {
  id: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  source: string;
  accepted?: boolean;
} & (AISuggestionSkeleton | AISuggestionCEFR | AISuggestionResources | AISuggestionRubric);

interface CurriculumSkeleton {
  name: string;
  level: string;
  ageGroup: string;
  totalHours: number;
  courses: Array<{
    title: string;
    hours: number;
    units: Array<{
      title: string;
      duration: number;
      objectives: string[];
      skills: string[];
      activities: string[];
      assessment: string;
    }>;
  }>;
}

interface CEFRMapping {
  level: string;
  canDoStatements: string[];
  objectives: string[];
  skills: string[];
}

interface ResourceSuggestion {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'slide' | 'worksheet' | 'link';
  skill: string;
  cefrLevel: string;
  topic: string;
  relevanceScore: number;
  url?: string;
  description: string;
}

interface AutoTagResult {
  skill: string[];
  cefrLevel: string;
  topic: string[];
  format: string;
  confidence: number;
}

const AIAssist = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state for curriculum generation
  const [generationForm, setGenerationForm] = useState({
    ageGroup: '',
    targetLevel: '',
    totalHours: 0,
    unitCount: 0,
    topicFocus: '',
    language: 'English',
  });

  // Mock AI generation functions
  const generateCurriculumSkeleton = useCallback(async (form: typeof generationForm): Promise<CurriculumSkeleton> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const skeleton: CurriculumSkeleton = {
      name: `${form.language} ${form.targetLevel} - ${form.ageGroup}`,
      level: form.targetLevel,
      ageGroup: form.ageGroup,
      totalHours: form.totalHours,
      courses: [
        {
          title: "Foundation Skills",
          hours: Math.floor(form.totalHours * 0.4),
          units: [
            {
              title: "Greetings and Introductions",
              duration: 90,
              objectives: [
                "Introduce yourself and others",
                "Use basic greetings appropriately",
                "Spell and pronounce names correctly"
              ],
              skills: ["Speaking", "Listening", "Writing"],
              activities: ["Role-play introductions", "Name pronunciation practice", "Greeting dialogues"],
              assessment: "Oral presentation of self-introduction"
            },
            {
              title: "Family and Relationships",
              duration: 120,
              objectives: [
                "Talk about family members",
                "Describe relationships",
                "Use possessive adjectives"
              ],
              skills: ["Speaking", "Reading", "Vocabulary"],
              activities: ["Family tree creation", "Relationship vocabulary games", "Reading family descriptions"],
              assessment: "Written family description + oral presentation"
            }
          ]
        },
        {
          title: "Daily Communication",
          hours: Math.floor(form.totalHours * 0.6),
          units: [
            {
              title: "Daily Routines",
              duration: 100,
              objectives: [
                "Talk about daily activities",
                "Use time expressions",
                "Describe habits and routines"
              ],
              skills: ["Speaking", "Listening", "Grammar"],
              activities: ["Daily routine presentations", "Time expression drills", "Listening to routine descriptions"],
              assessment: "Daily routine presentation with visual aids"
            }
          ]
        }
      ]
    };

    return skeleton;
  }, []);

  const generateCEFRMapping = useCallback(async (level: string): Promise<CEFRMapping> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const cefrMappings: Record<string, CEFRMapping> = {
      'A1': {
        level: 'A1',
        canDoStatements: [
          "Can understand and use familiar everyday expressions",
          "Can introduce him/herself and others",
          "Can ask and answer questions about personal details"
        ],
        objectives: [
          "Master basic greetings and introductions",
          "Use present simple for habits and facts",
          "Understand and respond to simple questions"
        ],
        skills: ["Listening", "Speaking", "Reading", "Writing"]
      },
      'B1': {
        level: 'B1',
        canDoStatements: [
          "Can understand the main points of clear standard input",
          "Can deal with most situations while travelling",
          "Can produce simple connected text on familiar topics"
        ],
        objectives: [
          "Express opinions on familiar topics",
          "Understand main ideas in authentic texts",
          "Participate in discussions about current events"
        ],
        skills: ["Listening", "Speaking", "Reading", "Writing", "Grammar"]
      }
    };

    return cefrMappings[level] || cefrMappings['A1'];
  }, []);

  const suggestResources = useCallback(async (unit: Record<string, any>): Promise<ResourceSuggestion[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
      {
        id: '1',
        title: 'Business Email Templates',
        type: 'pdf',
        skill: 'Writing',
        cefrLevel: 'B1',
        topic: 'Business Communication',
        relevanceScore: 0.95,
        description: 'Professional email templates for various business scenarios',
        url: '#'
      },
      {
        id: '2',
        title: 'Presentation Skills Video',
        type: 'video',
        skill: 'Speaking',
        cefrLevel: 'B1',
        topic: 'Presentation',
        relevanceScore: 0.88,
        description: 'TED Talk on effective presentation techniques',
        url: '#'
      },
      {
        id: '3',
        title: 'Vocabulary Building Worksheet',
        type: 'worksheet',
        skill: 'Vocabulary',
        cefrLevel: 'B1',
        topic: 'Business',
        relevanceScore: 0.82,
        description: 'Interactive exercises for business vocabulary',
        url: '#'
      }
    ];
  }, []);

  const generateRubricTemplate = useCallback((skill: string) => {
    const rubricTemplates: Record<string, any> = {
      'Speaking': {
        criteria: [
          { name: 'Fluency', weight: 30, levels: ['Hesitant', 'Some hesitation', 'Mostly fluent', 'Very fluent'] },
          { name: 'Pronunciation', weight: 25, levels: ['Difficult to understand', 'Some difficulties', 'Clear', 'Very clear'] },
          { name: 'Grammar', weight: 25, levels: ['Many errors', 'Several errors', 'Few errors', 'Very few errors'] },
          { name: 'Vocabulary', weight: 20, levels: ['Limited range', 'Adequate range', 'Good range', 'Wide range'] }
        ],
        passingScore: 70
      },
      'Writing': {
        criteria: [
          { name: 'Content', weight: 30, levels: ['Irrelevant', 'Some relevance', 'Relevant', 'Highly relevant'] },
          { name: 'Organization', weight: 25, levels: ['Disorganized', 'Some organization', 'Well organized', 'Very well organized'] },
          { name: 'Language', weight: 25, levels: ['Poor control', 'Some control', 'Good control', 'Excellent control'] },
          { name: 'Mechanics', weight: 20, levels: ['Many errors', 'Several errors', 'Few errors', 'Very few errors'] }
        ],
        passingScore: 75
      }
    };

    return rubricTemplates[skill] || rubricTemplates['Speaking'];
  }, []);

  const autoTagContent = useCallback(async (file: File): Promise<AutoTagResult> => {
    // Mock OCR and tagging
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      skill: ['Reading', 'Vocabulary'],
      cefrLevel: 'B1',
      topic: ['Business', 'Communication'],
      format: file.type.includes('pdf') ? 'PDF' : 'Document',
      confidence: 0.85
    };
  }, []);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const newSuggestions: AISuggestion[] = [];

      // Generate curriculum skeleton
      if (generationForm.ageGroup && generationForm.targetLevel) {
        const skeleton = await generateCurriculumSkeleton(generationForm);
        newSuggestions.push({
          id: 'skeleton-1',
          type: 'skeleton',
          title: 'Curriculum Skeleton',
          content: skeleton,
          confidence: 'high',
          explanation: `Generated ${skeleton.totalHours}-hour curriculum for ${skeleton.ageGroup} learners targeting ${skeleton.level} level`,
          source: 'AI Curriculum Generator v2.1'
        });
      }

      // Generate CEFR mapping
      if (generationForm.targetLevel) {
        const cefrMapping = await generateCEFRMapping(generationForm.targetLevel);
        newSuggestions.push({
          id: 'cefr-1',
          type: 'cefr',
          title: 'CEFR Mapping',
          content: cefrMapping,
          confidence: 'high',
          explanation: `CEFR can-do statements and learning objectives for ${generationForm.targetLevel} level`,
          source: 'CEFR Framework Database'
        });
      }

      // Generate resource suggestions
      const resources = await suggestResources({});
      newSuggestions.push({
        id: 'resources-1',
        type: 'resources',
        title: 'Resource Suggestions',
        content: resources,
        confidence: 'medium',
        explanation: `Curated learning resources matching ${generationForm.targetLevel} level and ${generationForm.topicFocus || 'general'} topics`,
        source: 'Resource Library AI'
      });

      // Generate rubric templates
      const rubric = generateRubricTemplate('Speaking');
      newSuggestions.push({
        id: 'rubric-1',
        type: 'rubric',
        title: 'Assessment Rubric',
        content: rubric,
        confidence: 'high',
        explanation: 'CEFR-aligned assessment rubric for speaking skills evaluation',
        source: 'Assessment Framework AI'
      });

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptSuggestion = (suggestionId: string) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId ? { ...s, accepted: true } : s
      )
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileTextIcon className="h-4 w-4" />;
      case 'video': return <VideoIcon className="h-4 w-4" />;
      case 'audio': return <AudioLinesIcon className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BotIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Curriculum Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Generate curriculum skeletons, CEFR mappings, and resource suggestions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ZapIcon className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="auto-tag">Auto Tag</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                Generate Curriculum Skeleton
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Select
                    value={generationForm.ageGroup}
                    onValueChange={(value) => setGenerationForm(prev => ({ ...prev, ageGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kids">Kids (6-12)</SelectItem>
                      <SelectItem value="Teens">Teens (13-17)</SelectItem>
                      <SelectItem value="Adults">Adults (18+)</SelectItem>
                      <SelectItem value="Professionals">Professionals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetLevel">Target Level</Label>
                  <Select
                    value={generationForm.targetLevel}
                    onValueChange={(value) => setGenerationForm(prev => ({ ...prev, targetLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CEFR level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Beginner</SelectItem>
                      <SelectItem value="A2">A2 - Elementary</SelectItem>
                      <SelectItem value="B1">B1 - Intermediate</SelectItem>
                      <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="C1">C1 - Advanced</SelectItem>
                      <SelectItem value="C2">C2 - Proficiency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="totalHours">Total Hours</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    value={generationForm.totalHours}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, totalHours: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 120"
                  />
                </div>

                <div>
                  <Label htmlFor="unitCount">Number of Units</Label>
                  <Input
                    id="unitCount"
                    type="number"
                    value={generationForm.unitCount}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, unitCount: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g., 8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="topicFocus">Topic Focus (Optional)</Label>
                <Input
                  id="topicFocus"
                  value={generationForm.topicFocus}
                  onChange={(e) => setGenerationForm(prev => ({ ...prev, topicFocus: e.target.value }))}
                  placeholder="e.g., Business English, Travel, Academic"
                />
              </div>

              <Button
                onClick={handleGenerateSuggestions}
                disabled={isGenerating || !generationForm.ageGroup || !generationForm.targetLevel}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Generating AI Suggestions...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate AI Suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No AI Suggestions Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate curriculum content using the form above to see AI-powered suggestions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className={`transition-all ${suggestion.accepted ? 'ring-2 ring-green-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <LightbulbIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                              {suggestion.confidence.toUpperCase()} CONFIDENCE
                            </Badge>
                            <span className="text-xs text-muted-foreground">• {suggestion.source}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <InfoIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{suggestion.explanation}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button variant="ghost" size="sm">
                          <PinIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{suggestion.explanation}</p>
                    </div>

                    {/* Preview content based on type */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {suggestion.type === 'skeleton' && (
                        <div>
                          <h4 className="font-medium mb-2">{suggestion.content.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {suggestion.content.totalHours} hours • {suggestion.content.ageGroup} • {suggestion.content.level}
                          </p>
                          <div className="space-y-1">
                            {suggestion.content.courses.map((course: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <strong>{course.title}</strong> ({course.hours}h) - {course.units.length} units
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestion.type === 'cefr' && (
                        <div>
                          <h4 className="font-medium mb-2">CEFR {suggestion.content.level} Can-do Statements</h4>
                          <ul className="text-sm space-y-1">
                            {suggestion.content.canDoStatements.map((statement: string, idx: number) => (
                              <li key={idx}>• {statement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {suggestion.type === 'resources' && (
                        <div>
                          <h4 className="font-medium mb-2">Recommended Resources</h4>
                          <div className="space-y-2">
                            {suggestion.content.slice(0, 3).map((resource: ResourceSuggestion) => (
                              <div key={resource.id} className="flex items-center gap-2 text-sm">
                                {getResourceIcon(resource.type)}
                                <span>{resource.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {resource.skill} • {resource.cefrLevel}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestion.type === 'rubric' && (
                        <div>
                          <h4 className="font-medium mb-2">Assessment Rubric Template</h4>
                          <p className="text-sm mb-2">Passing Score: {suggestion.content.passingScore}%</p>
                          <div className="space-y-1">
                            {suggestion.content.criteria.map((criterion: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <strong>{criterion.name}</strong> ({criterion.weight}%) - {criterion.levels.length} levels
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{suggestion.title} - Full Preview</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Full preview content */}
                            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                              {JSON.stringify(suggestion.content, null, 2)}
                            </pre>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        onClick={() => acceptSuggestion(suggestion.id)}
                        disabled={suggestion.accepted}
                      >
                        {suggestion.accepted ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="auto-tag" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                Auto Tag Content
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload documents to automatically extract skills, CEFR levels, and topics using AI
              </p>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, DOCX, PPTX, MP4, MP3, and image files
                </p>
                <Button variant="outline">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>

              {/* Mock tagging results */}
              <div className="mt-6 space-y-4">
                <h4 className="font-medium">Recent Auto-Tagged Content</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Business Email Templates.pdf</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">Writing</Badge>
                        <Badge variant="secondary">B1</Badge>
                        <Badge variant="secondary">Business</Badge>
                        <Badge variant="outline">95% confidence</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Apply Tags</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Presentation Skills.mp4</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">Speaking</Badge>
                        <Badge variant="secondary">B1-B2</Badge>
                        <Badge variant="secondary">Presentation</Badge>
                        <Badge variant="outline">88% confidence</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Apply Tags</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssist;