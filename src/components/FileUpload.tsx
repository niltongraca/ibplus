"use client";

import { Upload, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ value, onChange, accept = "image/*", label = "Upload" }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
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
          <img src={value} alt="preview" className="w-full h-full object-cover" />
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
