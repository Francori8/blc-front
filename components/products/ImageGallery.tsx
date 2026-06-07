"use client";

import { useRef } from "react";
import { useUploadImage } from "@/hooks/useUpload";

interface ImageGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageGallery({ images, onChange, maxImages = 6 }: ImageGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useUploadImage();

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = maxImages - images.length;
    const toUpload = Array.from(files).slice(0, remaining);
    const urls = await Promise.all(toUpload.map((f) => upload(f)));
    const valid = urls.filter(Boolean) as string[];
    if (valid.length) onChange([...images, ...valid]);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url, i) => (
          <div key={url} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-lg"
            >
              ✕
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-lg border border-dashed border-zinc-600 hover:border-zinc-400 transition-colors flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs">...</span>
            ) : (
              <>
                <span className="text-xl leading-none">+</span>
                <span className="text-xs">Foto</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <p className="text-xs text-zinc-600">{images.length}/{maxImages} imágenes</p>
      )}
    </div>
  );
}
