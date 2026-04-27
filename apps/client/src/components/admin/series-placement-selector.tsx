"use client";

/**
 * Selector de una serie (colección) y posición para galerías en el asistente de creación.
 */
export function SeriesPlacementSelector({
  value,
  onChange,
  position,
  onPositionChange,
  collections,
  disabled
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  position: string;
  onPositionChange: (v: string) => void;
  collections: ReadonlyArray<{ id: string; name: string }>;
  disabled?: boolean;
}>) {
  return (
    <div className="hf-admin-wizard__info-pair">
      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="wz-gallery-series">Serie (opcional)</label>
        <select
          id="wz-gallery-series"
          className="hf-admin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">— Sin serie (galería independiente) —</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hf-admin-field">
        <label className="hf-admin-field-label" htmlFor="wz-gallery-pos">Orden en la serie</label>
        <input
          id="wz-gallery-pos"
          className="hf-admin-input"
          type="number"
          min={0}
          max={9999}
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          disabled={disabled || value === ""}
        />
      </div>
    </div>
  );
}
