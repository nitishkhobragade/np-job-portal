"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Upload, X, FileText, Image as ImageIcon, FileType } from 'lucide-react';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

interface ToolUploadBoxProps {
  label: string;
  subLabel?: string;
  accept: string;
  selectedFile: File | null;
  filePreviewUrl?: string | null;
  dimensions?: { width: number; height: number };
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  fileType?: 'image' | 'pdf' | 'word' | 'doc';
  className?: string;
}

export const ToolUploadBox: React.FC<ToolUploadBoxProps> = ({
  label,
  subLabel = 'JPG, JPEG, PNG, WEBP सपोर्टेड',
  accept,
  selectedFile,
  filePreviewUrl,
  dimensions,
  onFileSelect,
  onFileRemove,
  fileType = 'image',
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [asyncResolvedSize, setAsyncResolvedSize] = useState<string>('');

  const internalPreview = useMemo(() => {
    if (filePreviewUrl) return filePreviewUrl;
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      return URL.createObjectURL(selectedFile);
    }
    return null;
  }, [selectedFile, filePreviewUrl]);

  useEffect(() => {
    return () => {
      if (internalPreview && !filePreviewUrl) {
        URL.revokeObjectURL(internalPreview);
      }
    };
  }, [internalPreview, filePreviewUrl]);

  useEffect(() => {
    let isMounted = true;
    if (selectedFile) {
      getRealFileBytes(selectedFile).then((bytes) => {
        if (isMounted) {
          setAsyncResolvedSize(formatFileSize(bytes));
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove();
  };

  const displaySize = asyncResolvedSize || (selectedFile ? formatFileSize(selectedFile.size) : '');

  return (
    <div className={`bg-white p-3 sm:p-4 rounded-xl border border-neutral-200 shadow-xs ${className}`}>
      <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
        {label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-5 sm:p-6 border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl bg-red-50/40 hover:bg-red-50 cursor-pointer transition-colors text-center group"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-neutral-900">
            फ़ाइल चुनें या यहाँ खींचकर छोड़ें
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5">{subLabel}</span>
        </div>
      ) : (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3">
          {/* Left Thumbnail & Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Small Preview Thumbnail */}
            <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 border border-neutral-300 flex items-center justify-center shadow-2xs">
              {fileType === 'image' && internalPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={internalPreview}
                  alt={selectedFile.name}
                  className="w-full h-full object-cover"
                />
              ) : fileType === 'pdf' ? (
                <div className="w-full h-full bg-red-50 text-red-700 flex flex-col items-center justify-center">
                  <FileText className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase mt-0.5">PDF</span>
                </div>
              ) : fileType === 'word' || fileType === 'doc' ? (
                <div className="w-full h-full bg-blue-50 text-blue-700 flex flex-col items-center justify-center">
                  <FileType className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase mt-0.5">DOCX</span>
                </div>
              ) : (
                <ImageIcon className="w-5 h-5 text-neutral-500" />
              )}
            </div>

            {/* File metadata */}
            <div className="min-w-0">
              <div className="text-xs font-black text-neutral-900 truncate max-w-[180px] sm:max-w-xs">
                {selectedFile.name}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-semibold mt-0.5 flex-wrap">
                <span>
                  साइज़: <strong className="text-red-700">{displaySize || 'जांच हो रही है...'}</strong>
                </span>
                {dimensions && dimensions.width > 0 && (
                  <span className="text-neutral-500 font-normal">
                    • ({dimensions.width}×{dimensions.height}px)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons: Change & Cross/Remove */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 rounded-md bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-[11px] font-bold transition-colors cursor-pointer"
              title="दूसरी फ़ाइल चुनें"
            >
              बदलें
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer flex items-center justify-center"
              title="फ़ाइल हटाएं (Deselect / Remove)"
              aria-label="फ़ाइल हटाएं"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
