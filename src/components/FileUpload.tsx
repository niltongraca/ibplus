"use client";

import { Upload, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { apiFetch } from "@/lib/api";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  maxDimension?: number;
}

const DEFAULT_MAX_DIMENSION = 1024;

function hasTransparency(file: File): boolean {
  const t = file.type || "";
  return t === "image/png" || t === "image/webp" || t === "image/gif";
}

async function resizeImage(file: File, maxDimension: number): Promise<File | string> {
  if (!file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao ler a imagem."));
      img.src = url;
    });

    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, maxDimension / Math.max(w, h));
    if (scale >= 1 && !hasTransparency(file)) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    if (hasTransparency(file)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mime = file.type === "image/webp" || file.type === "image/png" || file.type === "image/gif"
      ? "image/png"
      : "image/jpeg";
    const quality = mime === "image/png" ? undefined : 0.85;
    const dataUrl = canvas.toDataURL(mime, quality);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FileUpload({ value, onChange, accept = "image/*", label = "Upload", maxDimension = DEFAULT_MAX_DIMENSION }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const processed = await resizeImage(file, maxDimension);
      if (typeof processed === "string") {
        onChange(processed);
      } else {
        const formData = new FormData();
        formData.append("file", processed);
        const data = await apiFetch<{ url?: string }>("/api/upload", { method: "POST", body: formData });
        if (data.url) onChange(data.url);
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value && (
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
          <img src={value} alt="preview" width={48} height={48} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-bl flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "A enviar..." : label}
      </button>
      {!value && (
        <span className="text-xs text-ib-muted">Nenhuma imagem seleccionada</span>
      )}
    </div>
  );
}