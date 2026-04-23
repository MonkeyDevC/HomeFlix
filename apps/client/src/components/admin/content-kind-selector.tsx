"use client";

const OPTIONS = [
  {
    value: "movie",
    label: "Pelicula",
    description: "Una pieza suelta del catalogo familiar."
  },
  {
    value: "episode",
    label: "Episodio",
    description: "Pertenece a una serie o agrupacion."
  },
  {
    value: "clip",
    label: "Clip",
    description: "Contenido corto o bonus."
  }
] as const;

export function ContentKindSelector({
  value,
  onChange
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="hf-admin-choice-grid">
      {OPTIONS.map((option) => {
        const checked = option.value === value;

        return (
          <label className={`hf-admin-choice-card${checked ? " is-active" : ""}`} key={option.value}>
            <input
              checked={checked}
              name="content-kind"
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="hf-admin-choice-copy">
              <span className="hf-admin-choice-label">{option.label}</span>
              <span className="hf-admin-choice-description">{option.description}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
