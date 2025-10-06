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
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SettingsIcon,
  EyeIcon,
  EditIcon,
  ClockIcon,
  TargetIcon,
  BookOpenIcon,
  UsersIcon,
  ZapIcon,
  FileTextIcon,
  CalendarIcon,
  BarChartIcon,
} from "lucide-react";

interface ValidationRule {
  id: string;
  category: 'content' | 'publish' | 'mapping' | 'export';
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  config: Record<string, unknown>;
  lastTriggered?: string;
  triggerCount: number;
}

interface ReadinessCheck {
  kctId: string;
  kctName: string;
  checks: {
    hoursValidation: boolean;
    cefrCompleteness: boolean;
    rubricRequirements: boolean;
    resourceMinimums: boolean;
    brokenLinks: boolean;
    accessibility: boolean;
  };
  overallReady: boolean;
  lastChecked: string;
  blockingIssues: string[];
}

interface MappingValidation {
  classId: string;
  className: string;
  kctId: string;
  kctName: string;
  issues: Array<{
    type: 'hours' | 'level' | 'age' | 'modality' | 'resources';
    severity: 'high' | 'medium' | 'low';
    message: string;
    canAutoFix: boolean;
  }>;
  canProceed: boolean;
  riskLevel: 'high' | 'medium' | 'low';
}

interface PolicyConfig {
  hoursTolerance: number; // ± percentage
  requireRubricForAssessedUnits: boolean;
  requireResourcesForAllUnits: boolean;
  strictLevelMatching: boolean;
  requireAccessibilityCompliance: boolean;
  maxDraftAge: number; // days
  requireQrForPublishedExports: boolean;
  allowOverrideWithJustification: boolean;
}

const mockValidationRules: ValidationRule[] = [
  {
    id: "hours-consistency",
    category: "content",
    name: "Hours Consistency",
    description: "Σ(Unit.hours) must equal KCT.total_hours within tolerance",
    severity: "error",
    enabled: true,
    config: { tolerance: 5 },
    triggerCount: 12,
    lastTriggered: "2024-10-28"
  },
  {
    id: "cefr-minimums",
    category: "content",
    name: "CEFR Skill Minimums",
    description: "Each CEFR level must have minimum coverage for core skills",
    severity: "warning",
    enabled: true,
    config: { minCoverage: 80 },
    triggerCount: 8,
    lastTriggered: "2024-10-25"
  },
  {
    id: "rubric-requirements",
    category: "publish",
    name: "Assessment Rubric Required",
    description: "Units with assessments must have associated rubrics",
    severity: "error",
    enabled: true,
    config: {},
    triggerCount: 5,
    lastTriggered: "2024-10-20"
  },
  {
    id: "resource-minimums",
    category: "content",
    name: "Resource Minimums",
    description: "Each unit must have at least one resource per skill",
    severity: "warning",
    enabled: true,
    config: { minResourcesPerSkill: 1 },
    triggerCount: 15,
    lastTriggered: "2024-10-28"
  },
  {
    id: "broken-link-detection",
    category: "content",
    name: "Broken Link Detection",
    description: "Automatically detect and flag broken resource links",
    severity: "error",
    enabled: true,
    config: { checkInterval: 24 },
    triggerCount: 3,
    lastTriggered: "2024-10-27"
  }
];

const mockReadinessChecks: ReadinessCheck[] = [
  {
    kctId: "kct-001",
    kctName: "Business English B1-B2",
    checks: {
      hoursValidation: true,
      cefrCompleteness: false,
      rubricRequirements: true,
      resourceMinimums: true,
      brokenLinks: true,
      accessibility: false
    },
    overallReady: false,
    lastChecked: "2024-10-28T10:00:00Z",
    blockingIssues: ["CEFR completeness below threshold", "Accessibility compliance missing"]
  },
  {
    kctId: "kct-002",
    kctName: "IELTS Preparation B2-C1",
    checks: {
      hoursValidation: true,
      cefrCompleteness: true,
      rubricRequirements: true,
      resourceMinimums: true,
      brokenLinks: true,
      accessibility: true
    },
    overallReady: true,
    lastChecked: "2024-10-28T09:30:00Z",
    blockingIssues: []
  }
];

const mockMappingValidations: MappingValidation[] = [
  {
    classId: "class-001",
    className: "IELTS Fighter 1",
    kctId: "kct-002",
    kctName: "IELTS Preparation B2-C1",
    issues: [
      {
        type: "hours",
        severity: "medium",
        message: "Class schedule (120h) exceeds KCT hours (100h) by 20%",
        canAutoFix: true
      },
      {
        type: "level",
        severity: "low",
        message: "Minor CEFR level mismatch: Class B1 vs KCT B2-C1",
        canAutoFix: false
      }
    ],
    canProceed: true,
    riskLevel: "medium"
  }
];

const defaultPolicyConfig: PolicyConfig = {
  hoursTolerance: 5,
  requireRubricForAssessedUnits: true,
  requireResourcesForAllUnits: true,
  strictLevelMatching: false,
  requireAccessibilityCompliance: true,
  maxDraftAge: 30,
  requireQrForPublishedExports: true,
  allowOverrideWithJustification: true
};

const GuardrailsValidation = () => {
  const [selectedKCT, setSelectedKCT] = useState<string>("kct-001");
  const [policyConfig, setPolicyConfig] = useState<PolicyConfig>(defaultPolicyConfig);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const readinessStats = useMemo(() => {
    const total = mockReadinessChecks.length;
    const ready = mockReadinessChecks.filter(r => r.overallReady).length;
    const blocked = total - ready;
    return { total, ready, blocked, readyPercentage: Math.round((ready / total) * 100) };
  }, []);

  const validationStats = useMemo(() => {
    const totalRules = mockValidationRules.length;
    const enabledRules = mockValidationRules.filter(r => r.enabled).length;
    const errorRules = mockValidationRules.filter(r => r.severity === 'error').length;
    const recentTriggers = mockValidationRules.reduce((sum, r) => sum + r.triggerCount, 0);
    return { totalRules, enabledRules, errorRules, recentTriggers };
  }, []);

  const handlePolicyUpdate = (newConfig: Partial<PolicyConfig>) => {
    setPolicyConfig(prev => ({ ...prev, ...newConfig }));
    // Mock API call
    console.log('Policy updated:', newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Guardrails & Validation</h2>
          <p className="text-sm text-muted-foreground">
            Content validation rules, publish gates, and mapping constraints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <ShieldIcon className="h-3 w-3 mr-1" />
            Quality Assurance
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Publish</p>
                <p className="text-2xl font-bold text-green-600">
                  {readinessStats.ready}/{readinessStats.total}
                </p>
                <p className="text-xs text-muted-foreground">
                  {readinessStats.readyPercentage}% pass rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ShieldIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{validationStats.enabledRules}</p>
                <p className="text-xs text-muted-foreground">
                  of {validationStats.totalRules} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blocking Issues</p>
                <p className="text-2xl font-bold text-red-600">{readinessStats.blocked}</p>
                <p className="text-xs text-muted-foreground">
                  KCTs need fixes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <BarChartIcon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Triggers</p>
                <p className="text-2xl font-bold">{validationStats.recentTriggers}</p>
                <p className="text-xs text-muted-foreground">
                  validation events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="readiness" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="readiness">Readiness Check</TabsTrigger>
          <TabsTrigger value="validation-rules">Validation Rules</TabsTrigger>
          <TabsTrigger value="mapping-validation">Mapping Validation</TabsTrigger>
          <TabsTrigger value="policy-config">Policy Config</TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TargetIcon className="h-5 w-5" />
                Curriculum Readiness Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curriculum</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>CEFR</TableHead>
                    <TableHead>Rubric</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Accessibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockReadinessChecks.map((check) => (
                    <TableRow key={check.kctId}>
                      <TableCell className="font-medium">{check.kctName}</TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.hoursValidation ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.cefrCompleteness ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.rubricRequirements ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.resourceMinimums ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.brokenLinks ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <CheckCircleIcon className={`h-4 w-4 ${check.checks.accessibility ? 'text-green-500' : 'text-red-500'}`} />
                      </TableCell>
                      <TableCell>
                        <Badge className={check.overallReady ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {check.overallReady ? "Ready" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-xs">
                                  <p className="font-medium">Blocking Issues:</p>
                                  <ul className="text-sm mt-1">
                                    {check.blockingIssues.map((issue, idx) => (
                                      <li key={idx}>• {issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="sm">
                            <EditIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!mockReadinessChecks.every(r => r.overallReady) && (
                <Alert className="mt-4">
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{readinessStats.blocked} curricula blocked from publishing.</strong>
                    Address validation failures before proceeding. Use the detailed view to see specific issues.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="h-5 w-5" />
                Validation Rules Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockValidationRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {rule.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Triggered {rule.triggerCount} times
                        </span>
                        <Button variant="ghost" size="sm">
                          <SettingsIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Enabled: {rule.enabled ? 'Yes' : 'No'}</span>
                      {rule.lastTriggered && (
                        <span>Last triggered: {rule.lastTriggered}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping-validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Class Mapping Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMappingValidations.map((validation) => (
                  <div key={validation.classId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{validation.className}</h4>
                        <p className="text-sm text-muted-foreground">→ {validation.kctName}</p>
                      </div>
                      <Badge className={getRiskColor(validation.riskLevel)}>
                        {validation.riskLevel} risk
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {validation.issues.map((issue, idx) => (
                        <Alert key={idx} className={
                          issue.severity === 'high' ? 'border-red-200 bg-red-50' :
                          issue.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                          'border-blue-200 bg-blue-50'
                        }>
                          <AlertTriangleIcon className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>{issue.type}:</strong> {issue.message}
                            {issue.canAutoFix && (
                              <Button variant="outline" size="sm" className="ml-2">
                                Auto-fix
                              </Button>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-muted-foreground">
                        Can proceed: {validation.canProceed ? 'Yes' : 'No'}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Override
                        </Button>
                        <Button size="sm" disabled={!validation.canProceed}>
                          Apply Mapping
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Policy Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure validation rules and quality thresholds
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Hours Tolerance (%)</Label>
                    <Input
                      type="number"
                      value={policyConfig.hoursTolerance}
                      onChange={(e) => handlePolicyUpdate({ hoursTolerance: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Max Draft Age (days)</Label>
                    <Input
                      type="number"
                      value={policyConfig.maxDraftAge}
                      onChange={(e) => handlePolicyUpdate({ maxDraftAge: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="require-rubric"
                      checked={policyConfig.requireRubricForAssessedUnits}
                      onChange={(e) => handlePolicyUpdate({
                        requireRubricForAssessedUnits: e.target.checked
                      })}
                    />
                    <Label htmlFor="require-rubric">Require rubric for assessed units</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="require-resources"
                      checked={policyConfig.requireResourcesForAllUnits}
                      onChange={(e) => handlePolicyUpdate({
                        requireResourcesForAllUnits: e.target.checked
                      })}
                    />
                    <Label htmlFor="require-resources">Require resources for all units</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="strict-level"
                      checked={policyConfig.strictLevelMatching}
                      onChange={(e) => handlePolicyUpdate({
                        strictLevelMatching: e.target.checked
                      })}
                    />
                    <Label htmlFor="strict-level">Strict CEFR level matching</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="require-accessibility"
                      checked={policyConfig.requireAccessibilityCompliance}
                      onChange={(e) => handlePolicyUpdate({
                        requireAccessibilityCompliance: e.target.checked
                      })}
                    />
                    <Label htmlFor="require-accessibility">Require accessibility compliance</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="require-qr"
                      checked={policyConfig.requireQrForPublishedExports}
                      onChange={(e) => handlePolicyUpdate({
                        requireQrForPublishedExports: e.target.checked
                      })}
                    />
                    <Label htmlFor="require-qr">Require QR codes for published exports</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allow-override"
                      checked={policyConfig.allowOverrideWithJustification}
                      onChange={(e) => handlePolicyUpdate({
                        allowOverrideWithJustification: e.target.checked
                      })}
                    />
                    <Label htmlFor="allow-override">Allow overrides with justification</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPolicyConfig(defaultPolicyConfig)}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => console.log('Policies saved:', policyConfig)}>
                  Save Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuardrailsValidation;