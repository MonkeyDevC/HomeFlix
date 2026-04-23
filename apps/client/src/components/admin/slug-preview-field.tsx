"use client";

import { useMemo, useState } from "react";
import { slugifyLabel } from "../../lib/family/slugify-label";

export function SlugPreviewField({
  sourceValue,
  currentSlug = "",
  overrideValue = "",
  sourceLabel,
  onSlugChange
}: Readonly<{
  sourceValue: string;
  currentSlug?: string;
  overrideValue?: string;
  sourceLabel: string;
  onSlugChange: (value: string) => void;
}>) {
  const [manualEnabled, setManualEnabled] = useState(false);

  const preview = useMemo(() => {
    if (overrideValue.trim() !== "") {
      return overrideValue;
    }
    if (currentSlug.trim() !== "") {
      return currentSlug;
    }
    return slugifyLabel(sourceValue) || "item";
  }, [currentSlug, overrideValue, sourceValue]);

  return (
    <div className="hf-admin-slug-preview">
      <div>
        <div className="hf-admin-field-label">Slug interno</div>
        <code className="hf-admin-slug-code">{preview}</code>
      </div>
      <p className="hf-admin-field-hint">
        Se genera automaticamente a partir de {sourceLabel}. Solo hace falta tocarlo si quieres una URL distinta.
      </p>
      <button
        className="hf-admin-text-button"
        onClick={() => {
          const nextEnabled = !manualEnabled;
          setManualEnabled(nextEnabled);
          if (!nextEnabled) {
            onSlugChange("");
          }
        }}
        type="button"
      >
        {manualEnabled ? "Volver al slug automatico" : "Editar slug manualmente"}
      </button>

      {manualEnabled ? (
        <div className="hf-admin-field">
          <label className="hf-admin-field-label" htmlFor="slug-manual">
            Override manual
          </label>
          <input
            autoComplete="off"
            className="hf-admin-input"
            id="slug-manual"
            onChange={(event) => onSlugChange(event.target.value)}
            placeholder={currentSlug || slugifyLabel(sourceValue) || "item"}
            value={overrideValue}
          />
        </div>
      ) : null}
    </div>
  );
}
