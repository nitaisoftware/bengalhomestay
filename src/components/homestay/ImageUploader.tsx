'use client';

import { useRef, useState } from 'react';

export interface UploadedImage {
  url:      string;
  publicId: string;
  isCover:  boolean;
}

interface Props {
  images:    UploadedImage[];
  onChange:  (images: UploadedImage[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 10 }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Max ${maxImages} photos allowed`);
      return;
    }
    const toUpload = list.slice(0, remaining);

    setUploading(true);
    setError('');

    const token = sessionStorage.getItem('access_token') ?? '';
    const results: UploadedImage[] = [];

    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append('file', file);

        const res  = await fetch('/api/upload', {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body:    fd,
        });
        const data = await res.json();

        if (!res.ok) { setError(data.error ?? 'Upload failed'); break; }

        results.push({ url: data.url, publicId: data.publicId, isCover: false });
      } catch {
        setError('Upload failed. Check your connection.');
        break;
      }
    }

    if (results.length > 0) {
      const updated = [...images, ...results];
      // First image is always cover
      if (!updated.some((i) => i.isCover)) updated[0].isCover = true;
      onChange(updated);
    }

    setUploading(false);
  }

  function setCover(index: number) {
    onChange(images.map((img, i) => ({ ...img, isCover: i === index })));
  }

  function remove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((i) => i.isCover)) {
      updated[0].isCover = true;
    }
    onChange(updated);
  }

  // Drag-and-drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    uploadFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          uploading ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-green-700">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-medium text-gray-600">Click or drag photos here</p>
            <p className="text-xs">JPEG, PNG, WebP · Max 10 MB each · Up to {maxImages} photos</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={img.publicId} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />

              {/* Cover badge */}
              {img.isCover && (
                <span className="absolute top-1 left-1 text-xs bg-green-700 text-white px-1.5 py-0.5 rounded-md font-medium">
                  Cover
                </span>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    title="Set as cover"
                    className="bg-white text-green-700 text-xs font-medium px-2 py-1 rounded-lg hover:bg-green-50"
                  >
                    Set cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="bg-white text-red-500 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors text-2xl"
            >
              +
            </button>
          )}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400">
          {images.length} photo{images.length !== 1 ? 's' : ''} · Hover to set cover or remove
        </p>
      )}
    </div>
  );
}
