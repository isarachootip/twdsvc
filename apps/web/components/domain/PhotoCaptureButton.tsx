import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/api';

export interface PhotoItem {
  id?: string;
  url: string;
}

export interface PhotoCaptureButtonProps {
  value?: string[];
  attachmentIds?: string[];
  onChange?: (photos: string[]) => void;
  onAttachmentIdsChange?: (ids: string[]) => void;
  maxPhotos?: number;
  label?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  kind?: string;
  className?: string;
}

async function resizeImage(file: File, maxDimension = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const PhotoCaptureButton: React.FC<PhotoCaptureButtonProps> = ({
  value = [],
  attachmentIds = [],
  onChange,
  onAttachmentIdsChange,
  maxPhotos = 4,
  label = 'รูปถ่ายสินค้า',
  required = false,
  hint = 'ถ่ายหรืออัปโหลดภาพสภาพสินค้า (สูงสุด 4 รูป)',
  disabled = false,
  kind = 'INTAKE_PRODUCT',
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const availableSlots = maxPhotos - value.length;
    const filesToProcess = files.slice(0, availableSlots);

    setIsUploading(true);

    const newPhotos: string[] = [];
    const newIds: string[] = [];

    try {
      for (const file of filesToProcess) {
        // 1. Client-side resize <= 1600px
        const resizedBlob = await resizeImage(file, 1600);

        // 2. Prepare FormData for upload
        const formData = new FormData();
        formData.append('file', resizedBlob, file.name || 'photo.jpg');
        formData.append('kind', kind);

        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
          const token =
            typeof window !== 'undefined'
              ? localStorage.getItem('svcm_access_token')
              : null;

          const res = await fetch(`${apiUrl}/attachments/upload`, {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });

          if (res.ok) {
            const data = await res.json();
            newPhotos.push(data.url || URL.createObjectURL(resizedBlob));
            newIds.push(data.id);
          } else {
            // Fallback to local preview URL
            newPhotos.push(URL.createObjectURL(resizedBlob));
          }
        } catch {
          // Fallback to local preview URL
          newPhotos.push(URL.createObjectURL(resizedBlob));
        }
      }

      onChange?.([...value, ...newPhotos]);
      onAttachmentIdsChange?.([...attachmentIds, ...newIds]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    if (disabled || isUploading) return;
    const updatedPhotos = value.filter((_, i) => i !== index);
    const updatedIds = attachmentIds.filter((_, i) => i !== index);
    onChange?.(updatedPhotos);
    onAttachmentIdsChange?.(updatedIds);
  };

  const canAddMore = value.length < maxPhotos && !disabled && !isUploading;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-2 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-red font-bold">*</span>}
          <span className="text-text-mute font-normal">
            ({value.length}/{maxPhotos})
          </span>
        </label>
        {hint && <span className="text-[11px] text-text-mute">{hint}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div className="grid grid-cols-4 gap-2.5">
        {value.map((photo, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-surface-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`รูปภาพที่ ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-red transition-all"
                title="ลบรูปภาพ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white">
              #{idx + 1}
            </div>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-1.5 border-dashed border-border-strong hover:border-red hover:bg-red-tint/20 transition-colors flex flex-col items-center justify-center gap-1 text-text-mute hover:text-red p-2 text-center"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-red" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
            <span className="text-[11px] font-medium leading-tight">
              {isUploading ? 'กำลังอัปโหลด' : 'เพิ่มรูป'}
            </span>
          </button>
        )}

        {Array.from({
          length: Math.max(0, maxPhotos - value.length - (canAddMore ? 1 : 0)),
        }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="aspect-square rounded-lg border border-dashed border-border/60 bg-surface-2/40 flex items-center justify-center text-text-mute/40"
          >
            <ImageIcon className="w-4 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
};
