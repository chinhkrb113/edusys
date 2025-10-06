"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PlusIcon,
  TrashIcon,
  TargetIcon,
  AwardIcon,
} from "lucide-react";

interface RubricLevel {
  level: string;
  description: string;
}

interface RubricCriterion {
  name: string;
  levels: Record<string, string>;
}

interface RubricData {
  criteria?: RubricCriterion[];
  totalPoints?: number;
}

interface RubricEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const LEVEL_OPTIONS = [
  { value: "excellent", label: "Xuất sắc" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Khá" },
  { value: "poor", label: "Yếu" },
];

const RubricEditor: React.FC<RubricEditorProps> = ({ value, onChange }) => {
  const [rubric, setRubric] = useState<RubricData>({ criteria: [] });

  // Parse rubric when value changes
  useEffect(() => {
    if (!value) {
      setRubric({ criteria: [] });
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        setRubric(parsed);
      } else {
        setRubric({ criteria: [] });
      }
    } catch {
      setRubric({ criteria: [] });
    }
  }, [value]);

  // Update parent when rubric changes
  const updateRubric = (newRubric: RubricData) => {
    setRubric(newRubric);
    onChange(JSON.stringify(newRubric, null, 2));
  };

  const updateTotalPoints = (totalPoints: number) => {
    updateRubric({ ...rubric, totalPoints });
  };

  const addCriterion = () => {
    const criteria = rubric.criteria || [];
    const newCriterion: RubricCriterion = {
      name: "",
      levels: {}
    };
    updateRubric({ ...rubric, criteria: [...criteria, newCriterion] });
  };

  const updateCriterion = (index: number, field: keyof RubricCriterion, value: any) => {
    const criteria = rubric.criteria || [];
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    updateRubric({ ...rubric, criteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    const criteria = rubric.criteria || [];
    const newCriteria = criteria.filter((_, i) => i !== index);
    updateRubric({ ...rubric, criteria: newCriteria });
  };

  const addCriterionLevel = (criterionIndex: number, level: string) => {
    const criteria = rubric.criteria || [];
    const criterion = criteria[criterionIndex];
    const levels = criterion?.levels || {};
    updateCriterion(criterionIndex, 'levels', { ...levels, [level]: "" });
  };

  const updateCriterionLevel = (criterionIndex: number, level: string, description: string) => {
    const criteria = rubric.criteria || [];
    const criterion = criteria[criterionIndex];
    const levels = criterion?.levels || {};
    updateCriterion(criterionIndex, 'levels', { ...levels, [level]: description });
  };

  const removeCriterionLevel = (criterionIndex: number, level: string) => {
    const criteria = rubric.criteria || [];
    const criterion = criteria[criterionIndex];
    const levels = criterion?.levels || {};
    const newLevels = { ...levels };
    delete newLevels[level];
    updateCriterion(criterionIndex, 'levels', newLevels);
  };

  return (
    <div className="space-y-6">
      {/* Total Points */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AwardIcon className="h-5 w-5" />
            Tổng điểm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={0}
              value={rubric.totalPoints || 0}
              onChange={(e) => updateTotalPoints(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">điểm</span>
          </div>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TargetIcon className="h-5 w-5" />
              Tiêu chí đánh giá
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm tiêu chí
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(rubric.criteria || []).map((criterion, criterionIndex) => (
            <div key={criterionIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Tiêu chí {criterionIndex + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCriterion(criterionIndex)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Criterion Name */}
              <div className="space-y-2">
                <Label>Tên tiêu chí</Label>
                <Input
                  value={criterion.name}
                  onChange={(e) => updateCriterion(criterionIndex, 'name', e.target.value)}
                  placeholder="Ví dụ: Độ chính xác của nội dung"
                />
              </div>

              {/* Levels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mức độ đánh giá</Label>
                  <Select
                    onValueChange={(level) => addCriterionLevel(criterionIndex, level)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Thêm mức độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={Object.keys(criterion.levels || {}).includes(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {Object.entries(criterion.levels || {}).map(([level, description]) => {
                    const levelOption = LEVEL_OPTIONS.find(opt => opt.value === level);
                    return (
                      <div key={level} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              level === 'excellent' ? 'bg-green-100 text-green-800' :
                              level === 'good' ? 'bg-blue-100 text-blue-800' :
                              level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {levelOption?.label || level}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCriterionLevel(criterionIndex, level)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>

                        <Textarea
                          value={description}
                          onChange={(e) => updateCriterionLevel(criterionIndex, level, e.target.value)}
                          placeholder={`Mô tả cho mức ${levelOption?.label || level}...`}
                          rows={2}
                        />
                      </div>
                    );
                  })}
                </div>

                {Object.keys(criterion.levels || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có mức độ đánh giá nào
                  </p>
                )}
              </div>
            </div>
          ))}

          {(rubric.criteria || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TargetIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có tiêu chí đánh giá nào</p>
              <Button type="button" variant="outline" className="mt-4" onClick={addCriterion}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Thêm tiêu chí đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {(rubric.criteria || []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Xem trước Rubric</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rubric.criteria?.map((criterion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h5 className="font-semibold text-lg mb-3">{criterion.name}</h5>

                  {criterion.levels && (
                    <div className="space-y-2">
                      {Object.entries(criterion.levels).map(([level, description]) => {
                        const levelOption = LEVEL_OPTIONS.find(opt => opt.value === level);
                        return (
                          <div key={level} className="flex items-start space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium uppercase flex-shrink-0 ${
                              level === 'excellent' ? 'bg-green-100 text-green-800' :
                              level === 'good' ? 'bg-blue-100 text-blue-800' :
                              level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {levelOption?.label || level}
                            </div>
                            <div className="flex-1 text-sm text-gray-700">{description}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {rubric.totalPoints && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Tổng điểm: </span>
                  <span className="text-lg font-bold text-blue-600">{rubric.totalPoints}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RubricEditor;