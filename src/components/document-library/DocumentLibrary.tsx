"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  UploadIcon,
  SearchIcon,
  FilterIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  DownloadIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  TagIcon,
  FolderIcon,
  CameraIcon,
  BotIcon,
  GridIcon,
  ListIcon,
} from "lucide-react";

// Sample documents
const sampleDocuments = [
  {
    id: 1,
    name: "Grammar Rules A1.pdf",
    type: "pdf",
    size: "2.3 MB",
    uploadedAt: "2024-10-10",
    uploadedBy: "Nguyễn Văn A",
    level: "A1",
    skill: "Grammar",
    topic: "Basic tenses",
    tags: ["grammar", "tenses", "beginner"],
    ocrProcessed: true,
    downloads: 45,
    views: 120,
  },
  {
    id: 2,
    name: "Business Vocabulary.mp3",
    type: "audio",
    size: "15.7 MB",
    uploadedAt: "2024-10-12",
    uploadedBy: "Trần Thị B",
    level: "B2",
    skill: "Vocabulary",
    topic: "Business English",
    tags: ["vocabulary", "business", "audio"],
    ocrProcessed: false,
    downloads: 23,
    views: 67,
  },
  {
    id: 3,
    name: "Family Discussion Video.mp4",
    type: "video",
    size: "45.2 MB",
    uploadedAt: "2024-10-14",
    uploadedBy: "Lê Văn C",
    level: "A2",
    skill: "Speaking",
    topic: "Family",
    tags: ["speaking", "family", "video", "discussion"],
    ocrProcessed: false,
    downloads: 12,
    views: 89,
  },
];

const DocumentLibrary = () => {
  const [documents, setDocuments] = useState(sampleDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = selectedLevel === "all" || doc.level === selectedLevel;
    const matchesSkill = selectedSkill === "all" || doc.skill === selectedSkill;
    const matchesType = selectedType === "all" || doc.type === selectedType;

    return matchesSearch && matchesLevel && matchesSkill && matchesType;
  });

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf": return <FileTextIcon className="h-8 w-8 text-red-500" />;
      case "audio": return <MusicIcon className="h-8 w-8 text-blue-500" />;
      case "video": return <VideoIcon className="h-8 w-8 text-purple-500" />;
      case "image": return <ImageIcon className="h-8 w-8 text-green-500" />;
      default: return <FileTextIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getSkillColor = (skill) => {
    const colors = {
      "Listening": "bg-blue-100 text-blue-800",
      "Speaking": "bg-green-100 text-green-800",
      "Reading": "bg-purple-100 text-purple-800",
      "Writing": "bg-orange-100 text-orange-800",
      "Vocabulary": "bg-pink-100 text-pink-800",
      "Grammar": "bg-indigo-100 text-indigo-800",
    };
    return colors[skill] || "bg-gray-100 text-gray-800";
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploadDialogOpen(false);
            // Add new document to list
            const newDoc = {
              id: documents.length + 1,
              name: files[0].name,
              type: files[0].name.split('.').pop(),
              size: `${(files[0].size / 1024 / 1024).toFixed(1)} MB`,
              uploadedAt: new Date().toISOString().split('T')[0],
              uploadedBy: "Current User",
              level: "A1",
              skill: "General",
              topic: "Uploaded",
              tags: [],
              ocrProcessed: false,
              downloads: 0,
              views: 0,
            };
            setDocuments([...documents, newDoc]);
            return 0;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng tài liệu</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng tải xuống</p>
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.downloads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng xem</p>
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, doc) => sum + doc.views, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BotIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">OCR đã xử lý</p>
                <p className="text-2xl font-bold">
                  {documents.filter(doc => doc.ocrProcessed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm và lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả Level</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Kỹ năng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kỹ năng</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Speaking">Speaking</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="Vocabulary">Vocabulary</SelectItem>
                <SelectItem value="Grammar">Grammar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Loại file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload tài liệu</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                      <TabsTrigger value="link">Import Link</TabsTrigger>
                      <TabsTrigger value="camera">Chụp ảnh</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4">
                      <div>
                        <Label>Chọn file</Label>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.mp3,.mp4,.jpg,.png"
                          onChange={handleFileUpload}
                          className="mt-1"
                        />
                      </div>

                      {uploadProgress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <BotIcon className="mr-2 h-4 w-4" />
                          OCR & Auto-tag
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4">
                      <div>
                        <Label>Link tài liệu</Label>
                        <Input
                          placeholder="https://drive.google.com/file/..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Tên tài liệu</Label>
                        <Input
                          placeholder="Tên file"
                          className="mt-1"
                        />
                      </div>
                      <Button className="w-full">
                        Import từ Link
                      </Button>
                    </TabsContent>

                    <TabsContent value="camera" className="space-y-4">
                      <div className="text-center">
                        <div className="bg-gray-100 p-8 rounded-lg mb-4">
                          <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Camera access required</p>
                        </div>
                        <Button className="w-full">
                          <CameraIcon className="mr-2 h-4 w-4" />
                          Mở Camera
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              <div className="flex border rounded">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <GridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex gap-1">
                    <Badge variant="outline">{doc.level}</Badge>
                    <Badge className={getSkillColor(doc.skill)}>{doc.skill}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.topic}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{doc.uploadedAt}</span>
                  <div className="flex items-center gap-3">
                    <span>👁 {doc.views}</span>
                    <span>⬇ {doc.downloads}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDocument(doc);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <EyeIcon className="mr-1 h-3 w-3" />
                    Xem
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <DownloadIcon className="mr-1 h-3 w-3" />
                    Tải
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tài liệu</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Kỹ năng</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Thống kê</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {doc.size} • {doc.uploadedAt} • {doc.uploadedBy}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.level}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSkillColor(doc.skill)}>{doc.skill}</Badge>
                    </TableCell>
                    <TableCell>{doc.topic}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>👁 {doc.views} views</div>
                        <div>⬇ {doc.downloads} downloads</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <DownloadIcon className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <EditIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getFileIcon(selectedDocument.type)}
              {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Thông tin cơ bản</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Kích thước:</strong> {selectedDocument.size}</p>
                    <p><strong>Upload:</strong> {selectedDocument.uploadedAt}</p>
                    <p><strong>Người upload:</strong> {selectedDocument.uploadedBy}</p>
                    <p><strong>OCR:</strong> {selectedDocument.ocrProcessed ? "✅ Đã xử lý" : "⏳ Chưa xử lý"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Metadata</Label>
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline">{selectedDocument.level}</Badge>
                    <Badge className={getSkillColor(selectedDocument.skill)}>
                      {selectedDocument.skill}
                    </Badge>
                    <p className="text-sm mt-2"><strong>Topic:</strong> {selectedDocument.topic}</p>
                    <div className="flex gap-1 mt-2">
                      {selectedDocument.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              {selectedDocument.ocrProcessed && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BotIcon className="h-4 w-4" />
                    AI Summary
                  </Label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {selectedDocument.type === "pdf"
                        ? "This document contains grammar rules for A1 level, focusing on basic tenses including present simple, past simple, and future with 'will'. Key topics include verb forms, question formation, and negative sentences."
                        : selectedDocument.type === "audio"
                        ? "Audio content covers business vocabulary with pronunciation guides for common terms used in professional settings, meetings, and negotiations."
                        : "Video content demonstrates family discussion scenarios with role-play examples for A2 level learners, including vocabulary for describing relationships and daily activities."
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <Label className="text-sm font-medium">Preview</Label>
                <div className="mt-2 border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
                  {selectedDocument.type === "pdf" && (
                    <div className="text-center">
                      <FileTextIcon className="h-16 w-16 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">PDF Preview</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to open in PDF viewer
                      </p>
                    </div>
                  )}

                  {selectedDocument.type === "audio" && (
                    <div className="text-center">
                      <MusicIcon className="h-16 w-16 text-blue-500 mx-auto mb-2" />
                      <audio controls className="w-full max-w-md">
                        <source src="#" type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {selectedDocument.type === "video" && (
                    <div className="text-center">
                      <VideoIcon className="h-16 w-16 text-purple-500 mx-auto mb-2" />
                      <video controls className="w-full max-w-md">
                        <source src="#" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {selectedDocument.type === "image" && (
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-green-500 mx-auto mb-2" />
                      <img
                        src="#"
                        alt="Preview"
                        className="max-w-full max-h-64 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline">
                  <TagIcon className="mr-2 h-4 w-4" />
                  Edit Tags
                </Button>
                <Button variant="outline">
                  <BotIcon className="mr-2 h-4 w-4" />
                  Re-process OCR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Không tìm thấy tài liệu nào</p>
        </div>
      )}
    </div>
  );
};

export default DocumentLibrary;