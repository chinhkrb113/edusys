"use client";

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  MicIcon,
  ListChecksIcon,
  FileTextIcon,
  UsersIcon,
  ClockIcon,
  LucideIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { assignmentsService, type Assignment } from "@/services/assignmentsService";
import { useMutation } from "@tanstack/react-query";
import { showSuccess, showError } from "@/utils/toast";

interface AssignmentContent {
  instructions?: string;
  materials?: string[];
  questions?: AssignmentQuestion[];
  examples?: string[];
  readingPassage?: string;
}

interface AssignmentQuestion {
  question?: string;
  questionText?: string;
  options?: Record<string, string> | any[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  id?: number;
}

interface RubricData {
  criteria?: RubricCriterion[];
  totalPoints?: number;
}

interface RubricCriterion {
  name: string;
  levels?: Record<string, string>;
}

const skillIconMap: Record<string, LucideIcon> = {
  reading: BookOpenIcon,
  writing: FileTextIcon,
  speaking: MicIcon,
  listening: UsersIcon,
  vocabulary: ListChecksIcon,
  grammar: ListChecksIcon,
  collaboration: UsersIcon,
};

const defaultIcon = BookOpenIcon;

const getAssignmentIcon = (assignment: Assignment): LucideIcon => {
  if (assignment.skill) {
    const normalized = assignment.skill.toLowerCase();
    if (skillIconMap[normalized]) {
      return skillIconMap[normalized];
    }
  }

  if (assignment.type) {
    const normalized = assignment.type.toLowerCase();
    if (skillIconMap[normalized]) {
      return skillIconMap[normalized];
    }
  }

  return defaultIcon;
};

const renderAssignmentContent = (content: unknown, assignment?: Assignment): React.ReactNode => {
  if (!content) return null;

  // console.log('🔍 [PREVIEW MODE] Rendering content:', content, typeof content);

  // If content is a string and looks like HTML, render it
  if (typeof content === 'string') {
    // Check if it starts with HTML tags
    if (content.trim().startsWith('<')) {
      console.log('Rendering as HTML');
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      console.log('Parsed JSON content:', parsed);
      return renderAssignmentContent(parsed);
    } catch (e) {
      console.log('Failed to parse as JSON, rendering as plain text:', e);
      // If not JSON, display as plain text
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
  }

  // If content is an object, render structured content
  if (typeof content === 'object' && content !== null) {
    const contentObj = content as AssignmentContent;
    console.log('Rendering object content:', contentObj);

    return (
      <div className="space-y-6">


        {/* Instructions */}
        {contentObj.instructions && (
          <div>
            <h4 className="font-semibold mb-2">Hướng dẫn:</h4>
            <p className="text-gray-700">{contentObj.instructions}</p>
          </div>
        )}

        {/* Materials */}
        {contentObj.materials && Array.isArray(contentObj.materials) && (
          <div>
            <h4 className="font-semibold mb-2">Vật liệu cần thiết:</h4>
            <ul className="list-disc list-inside text-gray-700">
              {contentObj.materials.map((material: string, index: number) => (
                <li key={index}>{material}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Reading Passage (for reading comprehension) */}
        {contentObj.readingPassage && (
          <div>
            <h4 className="font-semibold mb-2">Đoạn văn đọc:</h4>
            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{contentObj.readingPassage}</p>
            </div>
          </div>
        )}

        {/* Questions */}
        {contentObj.questions && Array.isArray(contentObj.questions) && (
          <div>
            <h4 className="font-semibold mb-4">Câu hỏi:</h4>
            <div className="space-y-4">
              {contentObj.questions.map((question: AssignmentQuestion | string, index: number) => {

                // Handle both string and object formats
                if (typeof question === 'string') {
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="font-medium mb-2">{index + 1}. {question}</p>
                    </div>
                  );
                }

                // Handle object format (AI-generated structure)
                const questionText = question.questionText || question.question || 'Câu hỏi không có nội dung';
                const correctAnswer = question.correctAnswer || question.answer;
                const options = question.options;

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <p className="font-medium mb-2">{index + 1}. {questionText}</p>

                    {/* Options for MCQ */}
                    {options && Array.isArray(options) && options.length > 0 && (
                      <div className="space-y-1 ml-4">
                        {options.map((option: any, optionIndex: number) => {
                          const optionKey = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                          return (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                optionKey === correctAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'
                              }`}>
                                {optionKey}
                              </span>
                              <span>{option.text || option}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Options as Record (legacy format) - MCQ */}
                    {options && !Array.isArray(options) && typeof options === 'object' && assignment?.contentType !== 'matching' && (
                      <div className="space-y-1 ml-4">
                        {Object.entries(options as Record<string, string>).map(([key, value]: [string, string]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                              key === correctAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'
                            }`}>
                              {key.toUpperCase()}
                            </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Display */}
                    {options && !Array.isArray(options) && typeof options === 'object' && assignment?.contentType === 'matching' && (
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Column A */}
                          <div>
                            <h6 className="font-semibold mb-3 text-center text-sm">Cột A (Để ghép)</h6>
                            <div className="space-y-2">
                              {Object.entries(options as Record<string, string>)
                                .filter(([key]) => key.startsWith('A'))
                                .map(([key, value]: [string, string]) => (
                                  <div key={key} className="p-2 bg-blue-50 rounded border text-sm">
                                    <span className="font-medium text-blue-700">{key}:</span> {value}
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Column B */}
                          <div>
                            <h6 className="font-semibold mb-3 text-center text-sm">Cột B (Đáp án)</h6>
                            <div className="space-y-2">
                              {Object.entries(options as Record<string, string>)
                                .filter(([key]) => key.startsWith('B'))
                                .map(([key, value]: [string, string]) => (
                                  <div key={key} className="p-2 bg-green-50 rounded border text-sm">
                                    <span className="font-medium text-green-700">{key}:</span> {value}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Show correct mapping if available */}
                        {correctAnswer && typeof correctAnswer === 'object' && (
                          <div className="mt-4 p-3 bg-green-50 rounded-lg border">
                            <h6 className="font-semibold text-green-800 mb-2">Đáp án đúng:</h6>
                            <div className="space-y-1 text-sm">
                              {Object.entries(correctAnswer as Record<string, string>).map(([from, to]: [string, string]) => (
                                <div key={from} className="flex items-center gap-2">
                                  <span className="font-medium">{from}</span>
                                  <span className="text-gray-500">→</span>
                                  <span className="font-medium text-green-700">{to}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answer */}
                    {correctAnswer && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Đáp án đúng: {
                          typeof correctAnswer === 'string'
                            ? correctAnswer.toUpperCase()
                            : typeof correctAnswer === 'object'
                              ? 'Xem mapping bên dưới'
                              : String(correctAnswer).toUpperCase()
                        }
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Giải thích:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Examples */}
        {contentObj.examples && Array.isArray(contentObj.examples) && contentObj.examples.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Ví dụ:</h4>
            <div className="space-y-4">
              {contentObj.examples.map((example: any, index: number) => {
                // Handle string examples
                if (typeof example === 'string') {
                  return (
                    <li key={index} className="list-disc list-inside text-gray-700">{example}</li>
                  );
                }

                // Handle object examples (AI-generated format)
                const exampleQuestion = example.question || example.questionText || 'Ví dụ không có nội dung';
                const exampleOptions = example.options;
                const exampleAnswer = example.answer || example.correctAnswer;
                const exampleExplanation = example.explanation;

                return (
                  <div key={index} className="border rounded-lg p-4 bg-blue-50">
                    <p className="font-medium mb-2">{index + 1}. {exampleQuestion}</p>

                    {/* Options */}
                    {exampleOptions && Array.isArray(exampleOptions) && exampleOptions.length > 0 && (
                      <div className="space-y-1 ml-4">
                        {exampleOptions.map((option: any, optionIndex: number) => {
                          const optionKey = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                          return (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                                optionKey === exampleAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'
                              }`}>
                                {optionKey}
                              </span>
                              <span>{option.text || option}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Options as Record */}
                    {exampleOptions && !Array.isArray(exampleOptions) && typeof exampleOptions === 'object' && (
                      <div className="space-y-1 ml-4">
                        {Object.entries(exampleOptions as Record<string, string>).map(([key, value]: [string, string]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                              key === exampleAnswer ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300'
                            }`}>
                              {key.toUpperCase()}
                            </span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer */}
                    {exampleAnswer && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Đáp án đúng: {
                          typeof exampleAnswer === 'string'
                            ? exampleAnswer.toUpperCase()
                            : typeof exampleAnswer === 'object'
                              ? 'Xem mapping bên dưới'
                              : String(exampleAnswer).toUpperCase()
                        }
                      </div>
                    )}

                    {/* Explanation */}
                    {exampleExplanation && (
                      <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Giải thích:</strong> {exampleExplanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* If object but no recognized structure, show as formatted JSON */}
        {(!contentObj.instructions && !contentObj.materials && !contentObj.questions && !contentObj.examples) && (
          <div>
            <h4 className="font-semibold mb-2">Nội dung:</h4>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(contentObj, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Fallback: show raw content
  console.log('Fallback rendering:', content);
  return (
    <div>
      <h4 className="font-semibold mb-2">Nội dung thô:</h4>
      <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
        {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
      </pre>
    </div>
  );
};

const renderRubric = (rubric: unknown): React.ReactNode => {
  if (!rubric) return null;

  let rubricData: RubricData = {};

  // If rubric is a string, try to parse it
  if (typeof rubric === 'string') {
    try {
      rubricData = JSON.parse(rubric);
    } catch {
      return <div className="text-gray-500">Không thể phân tích rubric</div>;
    }
  } else if (typeof rubric === 'object') {
    rubricData = rubric as RubricData;
  }

  if (!rubricData || typeof rubricData !== 'object') {
    return <div className="text-gray-500">Rubric không hợp lệ</div>;
  }

  const criteria = rubricData.criteria || [];

  return (
    <div className="space-y-4">
      {criteria.map((criterion: RubricCriterion, index: number) => (
        <div key={index} className="border rounded-lg p-4">
          <h5 className="font-semibold text-lg mb-3">{criterion.name}</h5>

          {criterion.levels && (
            <div className="space-y-2">
              {Object.entries(criterion.levels).map(([level, description]: [string, string]) => (
                <div key={level} className="flex items-start space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                    level === 'excellent' ? 'bg-green-100 text-green-800' :
                    level === 'good' ? 'bg-blue-100 text-blue-800' :
                    level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {level === 'excellent' ? 'Xuất sắc' :
                     level === 'good' ? 'Tốt' :
                     level === 'fair' ? 'Khá' :
                     'Yếu'}
                  </div>
                  <div className="flex-1 text-sm text-gray-700">{description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {rubricData.totalPoints && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Tổng điểm: </span>
          <span className="text-lg font-bold text-blue-600">{rubricData.totalPoints}</span>
        </div>
      )}
    </div>
  );
};

const AssignmentPracticePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const assignmentQuery = useQuery<Assignment>({
    queryKey: ["assignment", id],
    queryFn: () => assignmentsService.get(parseInt(id!)),
    enabled: !!id,
  });

  const startPracticeMutation = useMutation({
    mutationFn: (assignmentId: number) => assignmentsService.startPractice(assignmentId),
    onSuccess: (session) => {
      showSuccess('Đã bắt đầu phiên làm bài!');
      setIsPracticeMode(true);
      console.log('Practice session started:', session);
    },
    onError: (error) => {
      showError('Không thể bắt đầu làm bài. Vui lòng thử lại.');
      console.error('Start practice error:', error);
    },
  });

  const handleAnswerChange = (questionKey: string | number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey.toString()]: answer
    }));
  };

  const handleSubmitPractice = () => {
    // TODO: Implement submit practice logic
    console.log('Submitting answers:', answers);
    showSuccess('Đã nộp bài thành công!');
    setIsPracticeMode(false);
  };

  const renderPracticeInterface = () => {
    if (!assignment?.content || typeof assignment.content !== 'object') {
      return <div className="text-center text-gray-500">Không có nội dung bài tập để làm</div>;
    }

    const content = assignment.content as AssignmentContent;

    return (
      <div className="space-y-6">
        {/* Instructions */}
        {content.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hướng dẫn làm bài</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{content.instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Reading Passage */}
        {content.readingPassage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Đoạn văn đọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{content.readingPassage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {content.questions && Array.isArray(content.questions) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {content.questions.map((question: AssignmentQuestion | string, index: number) => {
                  // Handle string format (simple text questions)
                  if (typeof question === 'string') {
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">{index + 1}. {question}</h4>
                        <Textarea
                          placeholder="Nhập câu trả lời của bạn..."
                          value={answers[index.toString()] || ''}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    );
                  }

                  // Handle object format (AI-generated structure)
                  const questionText = question.questionText || question.question || 'Câu hỏi không có nội dung';
                  const correctAnswer = question.correctAnswer || question.answer;
                  const options = question.options;

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{index + 1}. {questionText}</h4>

                      {/* Multiple Choice Options */}
                      {options && Array.isArray(options) && options.length > 0 && (
                        <RadioGroup
                          value={answers[index.toString()] || ''}
                          onValueChange={(value) => handleAnswerChange(index, value)}
                          className="space-y-2"
                        >
                          {options.map((option: any, optionIndex: number) => {
                            const optionKey = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                            return (
                              <div key={optionIndex} className="flex items-center space-x-3">
                                <RadioGroupItem value={optionKey} id={`q${index}-${optionKey}`} />
                                <Label htmlFor={`q${index}-${optionKey}`} className="flex-1 cursor-pointer">
                                  <span className="font-medium mr-2">{optionKey}.</span>
                                  {option.text || option}
                                </Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}

                      {/* Options as Record (legacy format) - MCQ */}
                      {options && !Array.isArray(options) && typeof options === 'object' && assignment.contentType !== 'matching' && (
                        <RadioGroup
                          value={answers[index.toString()] || ''}
                          onValueChange={(value) => handleAnswerChange(index, value)}
                          className="space-y-2"
                        >
                          {Object.entries(options as Record<string, string>).map(([key, value]: [string, string]) => (
                            <div key={key} className="flex items-center space-x-3">
                              <RadioGroupItem value={key} id={`q${index}-${key}`} />
                              <Label htmlFor={`q${index}-${key}`} className="flex-1 cursor-pointer">
                                <span className="font-medium mr-2">{key.toUpperCase()}.</span>
                                {value}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {/* Matching Exercise */}
                      {options && !Array.isArray(options) && typeof options === 'object' && assignment.contentType === 'matching' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Column A */}
                            <div>
                              <h5 className="font-semibold mb-3 text-center">Cột A (Để ghép)</h5>
                              <div className="space-y-2">
                                {Object.entries(options as Record<string, string>)
                                  .filter(([key]) => key.startsWith('A'))
                                  .map(([key, value]: [string, string]) => (
                                    <div key={key} className="p-3 bg-blue-50 rounded-lg border">
                                      <span className="font-medium text-blue-700">{key}:</span> {value}
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Column B */}
                            <div>
                              <h5 className="font-semibold mb-3 text-center">Cột B (Đáp án)</h5>
                              <div className="space-y-2">
                                {Object.entries(options as Record<string, string>)
                                  .filter(([key]) => key.startsWith('B'))
                                  .map(([key, value]: [string, string]) => (
                                    <div key={key} className="p-3 bg-green-50 rounded-lg border">
                                      <span className="font-medium text-green-700">{key}:</span> {value}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>

                          {/* Mapping Interface */}
                          <div className="space-y-3">
                            <h5 className="font-semibold">Ghép các mục:</h5>
                            {Object.entries(options as Record<string, string>)
                              .filter(([key]) => key.startsWith('A'))
                              .map(([keyA, valueA]: [string, string]) => (
                                <div key={keyA} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                  <span className="font-medium min-w-[60px]">{keyA}: {valueA}</span>
                                  <span className="text-gray-500">→</span>
                                  <Select
                                    value={answers[`${index}-${keyA}`] || ''}
                                    onValueChange={(value) => handleAnswerChange(`${index}-${keyA}`, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Chọn B..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(options as Record<string, string>)
                                        .filter(([key]) => key.startsWith('B'))
                                        .map(([keyB, valueB]: [string, string]) => (
                                          <SelectItem key={keyB} value={keyB}>
                                            {keyB}: {valueB}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Essay/Text Answer (fallback) */}
                      {!options && (
                        <Textarea
                          placeholder="Nhập câu trả lời của bạn..."
                          value={answers[index.toString()] || ''}
                          onChange={(e) => handleAnswerChange(index, e.target.value)}
                          className="min-h-[100px]"
                        />
                      )}

                      {/* Show correct answer if available and answered */}
                      {answers[index.toString()] && correctAnswer && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {answers[index.toString()].toLowerCase() === correctAnswer.toLowerCase() ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-medium">
                              Đáp án đúng: {
                                typeof correctAnswer === 'string'
                                  ? correctAnswer.toUpperCase()
                                  : typeof correctAnswer === 'object'
                                    ? 'Xem mapping bên dưới'
                                    : String(correctAnswer).toUpperCase()
                              }
                            </span>
                          </div>
                          {question.explanation && (
                            <p className="text-sm text-gray-600 mt-2">{question.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={handleSubmitPractice} className="px-8">
            Nộp bài
          </Button>
          <Button variant="outline" size="lg" onClick={() => setIsPracticeMode(false)}>
            Quay lại xem bài
          </Button>
        </div>
      </div>
    );
  };

  const { data: assignment, isLoading, error } = assignmentQuery;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy bài tập
          </h1>
          <p className="text-muted-foreground mb-6">
            Bài tập bạn tìm kiếm có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Button onClick={() => navigate("/assignments-games")}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Quay lại Ngân hàng Bài tập
          </Button>
        </div>
      </div>
    );
  }

  const Icon = getAssignmentIcon(assignment);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/assignments-games")}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Icon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {assignment.durationMinutes} phút
                </span>
                {assignment.level && (
                  <Badge variant="outline">Trình độ: {assignment.level}</Badge>
                )}
                {assignment.skill && (
                  <Badge variant="outline">Kỹ năng: {assignment.skill}</Badge>
                )}
                {assignment.type && (
                  <Badge variant="outline">Loại: {assignment.type}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Content */}
        <div className="space-y-6">
          {isPracticeMode ? (
            // Practice Mode
            renderPracticeInterface()
          ) : (
            // Preview Mode
            <>
              {/* Description */}
              {assignment.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mô tả bài tập</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {assignment.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Objectives */}
              {assignment.objectives && Array.isArray(assignment.objectives) && assignment.objectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mục tiêu học tập</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {assignment.objectives.map((objective, index) => (
                        <li key={index}>{String(objective)}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Content */}
              {assignment.content && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nội dung chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderAssignmentContent(assignment.content, assignment)}
                  </CardContent>
                </Card>
              )}

              {/* Rubric */}
              {assignment.rubric && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tiêu chí đánh giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderRubric(assignment.rubric)}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {assignment.tags && assignment.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thẻ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {assignment.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Practice Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Sẵn sàng làm bài?</h3>
                    <p className="text-muted-foreground mb-4">
                      Hãy bắt đầu làm bài tập này để kiểm tra kiến thức của bạn.
                    </p>
                    <Button
                      size="lg"
                      className="mr-4"
                      onClick={() => id && startPracticeMutation.mutate(parseInt(id))}
                      disabled={startPracticeMutation.isPending}
                    >
                      {startPracticeMutation.isPending ? 'Đang bắt đầu...' : 'Bắt đầu làm bài'}
                    </Button>
                    <Button variant="outline" size="lg">
                      Lưu để làm sau
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPracticePage;