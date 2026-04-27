"use client";

/**
 * Orden en serie para galerías con exactamente una colección (común para álbum dentro de una serie).
 */
export function GallerySeriesPlacementSection({
  value,
  onChange
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
}>) {
  return (
    <div className="hf-admin-field">
      <label className="hf-admin-field-label" htmlFor="ci-gallery-ser-order">
        Orden en la serie
      </label>
      <input
        id="ci-gallery-ser-order"
        className="hf-admin-input"
        type="number"
        min={0}
        max={9999}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
      <p className="hf-admin-field-hint">
        Números más bajos aparecen primero en el detalle de la serie junto a capítulos y otras
        galerías.
      </p>
    </div>
  );
}
