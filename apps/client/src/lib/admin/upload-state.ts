export type UploadState = Readonly<{
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  loadedBytes: number;
  totalBytes: number;
  fileName?: string;
  error?: string;
}>;

export function initialUploadState(): UploadState {
  return {
    status: "idle",
    progress: 0,
    loadedBytes: 0,
    totalBytes: 0
  };
}
