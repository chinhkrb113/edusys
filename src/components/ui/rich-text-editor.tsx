import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Label } from './label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  height?: number;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  label,
  error,
  disabled = false,
  height = 400,
  className = ''
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'image'
  ];

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="rich-text-editor" className="text-sm font-medium">
          {label}
        </Label>
      )}

      <div className={`border rounded-md ${error ? 'border-red-500' : 'border-input'} ${disabled ? 'opacity-50' : ''}`}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={disabled}
          style={{ height: `${height}px` }}
          modules={modules}
          formats={formats}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;