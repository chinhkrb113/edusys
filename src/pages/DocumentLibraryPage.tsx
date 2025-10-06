"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentLibrary from "@/components/document-library/DocumentLibrary";

const DocumentLibraryPage = () => {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 rounded-lg bg-gray-50/50">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Thư viện tài liệu
        </h1>
        <p className="text-md text-muted-foreground">
          Quản lý tài liệu học tập với OCR và auto-tagging AI.
        </p>
      </div>

      <DocumentLibrary />
    </div>
  );
};

export default DocumentLibraryPage;