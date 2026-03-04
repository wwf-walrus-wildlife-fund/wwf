import { useState, useCallback } from "react";

interface UploadParams {
  file: File;
  name: string;
  description: string;
  category: string;
  price: string;
  storageDays: number;
}

interface UseUploadReturn {
  upload: (params: UploadParams) => Promise<void>;
  isUploading: boolean;
  isSuccess: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (params: UploadParams) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("name", params.name);
      formData.append("description", params.description);
      formData.append("category", params.category);
      formData.append("price", params.price);
      formData.append("storageDays", String(params.storageDays));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return { upload, isUploading, isSuccess, error, reset };
}
