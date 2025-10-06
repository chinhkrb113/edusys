"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  PlusIcon,
  TrashIcon,
  GripVerticalIcon,
  FileTextIcon,
  ListIcon,
  MessageSquareIcon,
  BookOpenIcon,
} from "lucide-react";

interface AssignmentQuestion {
  id?: number;
  question?: string;
  questionText?: string;
  options?: Record<string, string> | any[];
  answer?: string;
  correctAnswer?: string | Record<string, string>;
  explanation?: string;
  // Essay specific
  minWords?: number;
  maxWords?: number;
  gradingCriteria?: string;
  // Speaking specific
  preparationTime?: number;
  maxDuration?: number;
  evaluationCriteria?: string;
  // Audio specific
  audioUrl?: string;
  maxPlays?: number;
  allowRewind?: boolean;
  // Project/Worksheet/Presentation specific
  requirements?: string;
  deadlineDays?: number;
  maxPoints?: number;
  // Quiz/Diagnostic specific
  questionType?: string;
  sampleAnswer?: string;
}

interface AssignmentContent {
  instructions?: string;
  materials?: string[];
  questions?: AssignmentQuestion[];
  examples?: string[];
  readingPassage?: string;
}

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  contentType?: string;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ value, onChange, contentType }) => {
  const [content, setContent] = useState<AssignmentContent>({});

  // Parse content when value changes
  useEffect(() => {
    if (!value) {
      setContent({});
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        setContent(parsed);
      } else {
        setContent({});
      }
    } catch {
      setContent({});
    }
  }, [value]);

  // Update parent when content changes
  const updateContent = (newContent: AssignmentContent) => {
    setContent(newContent);
    onChange(JSON.stringify(newContent, null, 2));
  };

  const updateInstructions = (instructions: string) => {
    updateContent({ ...content, instructions });
  };

  const updateReadingPassage = (readingPassage: string) => {
    updateContent({ ...content, readingPassage });
  };

  const addMaterial = () => {
    const materials = content.materials || [];
    updateContent({ ...content, materials: [...materials, ""] });
  };

  const updateMaterial = (index: number, value: string) => {
    const materials = content.materials || [];
    const newMaterials = [...materials];
    newMaterials[index] = value;
    updateContent({ ...content, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    const materials = content.materials || [];
    const newMaterials = materials.filter((_, i) => i !== index);
    updateContent({ ...content, materials: newMaterials });
  };

  const addQuestion = () => {
    const questions = content.questions || [];
    const newQuestion: AssignmentQuestion = {
      questionText: "",
      options: {},
      correctAnswer: "",
      explanation: ""
    };
    updateContent({ ...content, questions: [...questions, newQuestion] });
  };

  const updateQuestion = (index: number, field: keyof AssignmentQuestion, value: any) => {
    const questions = content.questions || [];
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    updateContent({ ...content, questions: newQuestions });
  };

  const removeQuestion = (index: number) => {
    const questions = content.questions || [];
    const newQuestions = questions.filter((_, i) => i !== index);
    updateContent({ ...content, questions: newQuestions });
  };

  const addQuestionOption = (questionIndex: number) => {
    const questions = content.questions || [];
    const question = questions[questionIndex];
    const options = question?.options || {};

    // Find next available letter
    const letters = Object.keys(options);
    let nextLetter = 'A';
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!letters.includes(letter)) {
        nextLetter = letter;
        break;
      }
    }

    updateQuestion(questionIndex, 'options', { ...options, [nextLetter]: "" });
  };

  const updateQuestionOption = (questionIndex: number, optionKey: string, value: string) => {
    const questions = content.questions || [];
    const question = questions[questionIndex];
    const options = question?.options || {};
    updateQuestion(questionIndex, 'options', { ...options, [optionKey]: value });
  };

  const removeQuestionOption = (questionIndex: number, optionKey: string) => {
    const questions = content.questions || [];
    const question = questions[questionIndex];
    const options = question?.options || {};
    const newOptions = { ...options };
    delete newOptions[optionKey];
    updateQuestion(questionIndex, 'options', newOptions);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5" />
            Hướng dẫn làm bài
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content.instructions || ""}
            onChange={(e) => updateInstructions(e.target.value)}
            placeholder="Nhập hướng dẫn chi tiết cho học sinh..."
            rows={4}
          />
        </CardContent>
      </Card>


      {/* Materials */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListIcon className="h-5 w-5" />
              Vật liệu cần thiết
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(content.materials || []).map((material, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVerticalIcon className="h-4 w-4 text-gray-400" />
              <Input
                value={material}
                onChange={(e) => updateMaterial(index, e.target.value)}
                placeholder="Ví dụ: Bút và giấy, Máy tính..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeMaterial(index)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(content.materials || []).length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có vật liệu nào</p>
          )}
        </CardContent>
      </Card>

        {/* Reading Passage (for reading comprehension) */}
      {(contentType === 'reading' || contentType === 'mcq') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5" />
              Đoạn văn đọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content.readingPassage || ""}
              onChange={(e) => updateReadingPassage(e.target.value)}
              placeholder="Nhập đoạn văn để học sinh đọc hiểu..."
              rows={8}
            />
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              Câu hỏi
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Thêm câu hỏi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(content.questions || []).map((question, questionIndex) => (
            <div key={questionIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Câu hỏi {questionIndex + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(questionIndex)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label>Nội dung câu hỏi</Label>
                <Textarea
                  value={question.questionText || question.question || ""}
                  onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={2}
                />
              </div>

              {/* Options based on content type */}
              {contentType === 'mcq' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Đáp án</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestionOption(questionIndex)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Thêm đáp án
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(question.options || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-medium">
                          {key}
                        </span>
                        <Input
                          value={value as string}
                          onChange={(e) => updateQuestionOption(questionIndex, key, e.target.value)}
                          placeholder={`Đáp án ${key}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestionOption(questionIndex, key)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div className="space-y-2">
                    <Label>Đáp án đúng</Label>
                    <RadioGroup
                      value={(typeof question.correctAnswer === 'string' ? question.correctAnswer : question.answer) || ""}
                      onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value)}
                    >
                      <div className="flex gap-4">
                        {Object.keys(question.options || {}).map((key) => (
                          <div key={key} className="flex items-center space-x-2">
                            <RadioGroupItem value={key} id={`q${questionIndex}-correct-${key}`} />
                            <Label htmlFor={`q${questionIndex}-correct-${key}`}>{key}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* True/False Questions */}
              {contentType === 'true_false' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Đáp án đúng</Label>
                    <RadioGroup
                      value={(typeof question.correctAnswer === 'string' ? question.correctAnswer : question.answer) || ""}
                      onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value)}
                    >
                      <div className="flex gap-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id={`q${questionIndex}-true`} />
                          <Label htmlFor={`q${questionIndex}-true`}>Đúng</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id={`q${questionIndex}-false`} />
                          <Label htmlFor={`q${questionIndex}-false`}>Sai</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* Matching Questions */}
              {contentType === 'matching' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cột A (để ghép)</Label>
                      <div className="space-y-2">
                        {Object.entries(question.options || {}).filter(([key]) => key.startsWith('A')).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full border-2 border-blue-300 flex items-center justify-center text-sm font-medium text-blue-700">
                              {key}
                            </span>
                            <Input
                              value={value as string}
                              onChange={(e) => updateQuestionOption(questionIndex, key, e.target.value)}
                              placeholder={`Cột A - ${key}`}
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentAOptions = Object.keys(question.options || {}).filter(key => key.startsWith('A')).length;
                            const nextKey = `A${currentAOptions + 1}`;
                            updateQuestionOption(questionIndex, nextKey, "");
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Thêm A
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cột B (đáp án)</Label>
                      <div className="space-y-2">
                        {Object.entries(question.options || {}).filter(([key]) => key.startsWith('B')).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full border-2 border-green-300 flex items-center justify-center text-sm font-medium text-green-700">
                              {key}
                            </span>
                            <Input
                              value={value as string}
                              onChange={(e) => updateQuestionOption(questionIndex, key, e.target.value)}
                              placeholder={`Cột B - ${key}`}
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentBOptions = Object.keys(question.options || {}).filter(key => key.startsWith('B')).length;
                            const nextKey = `B${currentBOptions + 1}`;
                            updateQuestionOption(questionIndex, nextKey, "");
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Thêm B
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Đáp án đúng (mapping A→B)</Label>
                    <div className="space-y-2">
                      {Object.keys(question.options || {}).filter(key => key.startsWith('A')).map((aKey) => (
                        <div key={aKey} className="flex items-center gap-2">
                          <span className="text-sm font-medium">{aKey} →</span>
                          <Select
                            value={(question.correctAnswer as Record<string, string>)?.[aKey] || ""}
                            onValueChange={(value) => {
                              const currentAnswers = (question.correctAnswer as Record<string, string>) || {};
                              updateQuestion(questionIndex, 'correctAnswer', { ...currentAnswers, [aKey]: value });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Chọn B" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(question.options || {}).filter(key => key.startsWith('B')).map((bKey) => (
                                <SelectItem key={bKey} value={bKey}>{bKey}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Essay Questions */}
              {contentType === 'essay' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Số từ tối thiểu</Label>
                      <Input
                        type="number"
                        min={50}
                        value={question.minWords || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'minWords', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 150"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số từ tối đa</Label>
                      <Input
                        type="number"
                        min={100}
                        value={question.maxWords || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'maxWords', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hướng dẫn chấm điểm</Label>
                    <Textarea
                      value={question.gradingCriteria || ""}
                      onChange={(e) => updateQuestion(questionIndex, 'gradingCriteria', e.target.value)}
                      placeholder="Tiêu chí đánh giá bài luận..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Speaking Questions */}
              {contentType === 'speaking' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Thời gian chuẩn bị (giây)</Label>
                      <Input
                        type="number"
                        min={30}
                        value={question.preparationTime || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'preparationTime', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Thời gian trả lời tối đa (giây)</Label>
                      <Input
                        type="number"
                        min={60}
                        value={question.maxDuration || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'maxDuration', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 120"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hướng dẫn đánh giá</Label>
                    <Textarea
                      value={question.evaluationCriteria || ""}
                      onChange={(e) => updateQuestion(questionIndex, 'evaluationCriteria', e.target.value)}
                      placeholder="Tiêu chí đánh giá bài nói..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Audio Questions */}
              {contentType === 'audio' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Link file audio</Label>
                    <Input
                      value={question.audioUrl || ""}
                      onChange={(e) => updateQuestion(questionIndex, 'audioUrl', e.target.value)}
                      placeholder="https://example.com/audio.mp3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Số lần nghe tối đa</Label>
                      <Input
                        type="number"
                        min={1}
                        value={question.maxPlays || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'maxPlays', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cho phép tua lại</Label>
                      <Select
                        value={question.allowRewind ? "true" : "false"}
                        onValueChange={(value) => updateQuestion(questionIndex, 'allowRewind', value === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Có</SelectItem>
                          <SelectItem value="false">Không</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Project/Assignment Questions */}
              {(contentType === 'project' || contentType === 'worksheet' || contentType === 'presentation') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Yêu cầu chi tiết</Label>
                    <Textarea
                      value={question.requirements || ""}
                      onChange={(e) => updateQuestion(questionIndex, 'requirements', e.target.value)}
                      placeholder="Mô tả chi tiết yêu cầu của bài tập..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Thời hạn (ngày)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={question.deadlineDays || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'deadlineDays', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 7"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Điểm số tối đa</Label>
                      <Input
                        type="number"
                        min={1}
                        value={question.maxPoints || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'maxPoints', parseInt(e.target.value) || undefined)}
                        placeholder="Ví dụ: 100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz/Diagnostic Questions - Generic fallback */}
              {(contentType === 'quiz' || contentType === 'diagnostic') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Loại câu hỏi</Label>
                    <Select
                      value={question.questionType || "mcq"}
                      onValueChange={(value) => updateQuestion(questionIndex, 'questionType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Trắc nghiệm</SelectItem>
                        <SelectItem value="true_false">Đúng/Sai</SelectItem>
                        <SelectItem value="short_answer">Trả lời ngắn</SelectItem>
                        <SelectItem value="essay">Tự luận</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Show appropriate form based on question type */}
                  {question.questionType === 'mcq' && (
                    <div className="space-y-2">
                      <Label>Đáp án (A, B, C, D)</Label>
                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-medium">
                              {key}
                            </span>
                            <Input
                              value={(question.options as any)?.[key] || ""}
                              onChange={(e) => {
                                const options = question.options || {};
                                updateQuestion(questionIndex, 'options', { ...options, [key]: e.target.value });
                              }}
                              placeholder={`Đáp án ${key}`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label>Đáp án đúng</Label>
                        <RadioGroup
                          value={(typeof question.correctAnswer === 'string' ? question.correctAnswer : "") || ""}
                          onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value)}
                        >
                          <div className="flex gap-4">
                            {['A', 'B', 'C', 'D'].map((key) => (
                              <div key={key} className="flex items-center space-x-2">
                                <RadioGroupItem value={key} id={`q${questionIndex}-correct-${key}`} />
                                <Label htmlFor={`q${questionIndex}-correct-${key}`}>{key}</Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}

                  {question.questionType === 'true_false' && (
                    <div className="space-y-2">
                      <Label>Đáp án đúng</Label>
                      <RadioGroup
                        value={(typeof question.correctAnswer === 'string' ? question.correctAnswer : "") || ""}
                        onValueChange={(value) => updateQuestion(questionIndex, 'correctAnswer', value)}
                      >
                        <div className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`q${questionIndex}-true`} />
                            <Label htmlFor={`q${questionIndex}-true`}>Đúng</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`q${questionIndex}-false`} />
                            <Label htmlFor={`q${questionIndex}-false`}>Sai</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {(question.questionType === 'short_answer' || question.questionType === 'essay') && (
                    <div className="space-y-2">
                      <Label>Đáp án mẫu</Label>
                      <Textarea
                        value={question.sampleAnswer || ""}
                        onChange={(e) => updateQuestion(questionIndex, 'sampleAnswer', e.target.value)}
                        placeholder="Đáp án tham khảo..."
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <Label>Giải thích (tùy chọn)</Label>
                <Textarea
                  value={question.explanation || ""}
                  onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                  placeholder="Giải thích đáp án đúng..."
                  rows={2}
                />
              </div>
            </div>
          ))}

          {(content.questions || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có câu hỏi nào</p>
              <Button type="button" variant="outline" className="mt-4" onClick={addQuestion}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Thêm câu hỏi đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentEditor;