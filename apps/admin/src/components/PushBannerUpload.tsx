'use client';

import { DragEvent, useRef, useState } from 'react';
import { uploadPushBanner } from '@/lib/api';

interface PushBannerUploadProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  onError: (message: string) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp';

export function PushBannerUpload({ imageUrl, onImageUrlChange, onError }: PushBannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const clearPreview = () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    clearPreview();
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);

    try {
      const publicUrl = await uploadPushBanner(file);
      onImageUrlChange(publicUrl);
      clearPreview();
    } catch (err) {
      clearPreview();
      onImageUrlChange('');
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    handleFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    clearPreview();
    onImageUrlChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const previewSrc = imageUrl || localPreview;

  return (
    <div className="form-group">
      <label className="form-label">Banner Image (optional)</label>

      {!previewSrc ? (
        <div
          className={`image-upload${dragging ? ' image-upload--dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <label className="image-upload__label" htmlFor="push-banner-file">
            <div className="image-upload__icon">🖼</div>
            <div className="image-upload__title">
              {uploading ? 'Uploading to Cloudflare R2…' : 'Click or drag an image here'}
            </div>
            <div className="image-upload__hint">JPEG, PNG, or WebP · max 2MB</div>
          </label>
          <input
            ref={inputRef}
            id="push-banner-file"
            type="file"
            accept={ACCEPT}
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="image-upload-preview">
          <img src={previewSrc} alt="Push banner preview" />
          <div className="image-upload-preview__footer">
            <span className="image-upload-preview__url">
              {uploading ? 'Uploading…' : imageUrl || 'Preview'}
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={removeImage}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <p className="form-hint">
        Image is uploaded to R2 and attached as a rich push banner. Requires <code>R2_PUBLIC_URL</code> on the backend.
      </p>
    </div>
  );
}
