"use client";

import { useId, useState } from "react";

export function SimpleDropzone({
  accept,
  busy,
  onSelect,
  label,
  hint
}: Readonly<{
  accept: string;
  busy: boolean;
  onSelect: (file: File | null) => void;
  label: string;
  hint: string;
}>) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className={`hf-admin-dropzone${dragging ? " is-dragging" : ""}${busy ? " is-busy" : ""}`}>
      <input
        accept={accept}
        className="hf-admin-dropzone-input"
        id={inputId}
        onChange={(event) => {
          const selected = event.target.files?.item(0) ?? null;
          setFileName(selected?.name ?? null);
          onSelect(selected);
        }}
        type="file"
      />
      <label
        className="hf-admin-dropzone-label"
        htmlFor={inputId}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const selected = event.dataTransfer.files.item(0);
          setFileName(selected?.name ?? null);
          onSelect(selected ?? null);
        }}
      >
        <span className="hf-admin-dropzone-title">{label}</span>
        <span className="hf-admin-dropzone-hint">{fileName ?? hint}</span>
        <span className="hf-admin-dropzone-action">{busy ? "Procesando..." : "Seleccionar archivo"}</span>
      </label>
    </div>
  );
}
