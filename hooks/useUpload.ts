import { useState } from "react";
import { api } from "@/lib/api";

export function useUploadImage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<{ url: string }>("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.url;
    } catch {
      setError("Error al subir imagen");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
