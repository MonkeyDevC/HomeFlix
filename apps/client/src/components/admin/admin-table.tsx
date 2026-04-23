import type { CSSProperties, ReactNode } from "react";

export function AdminTable({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="hf-admin-table-wrap">
      <table className="hf-admin-table">{children}</table>
    </div>
  );
}

export function AdminTh({
  children,
  style
}: Readonly<{ children: ReactNode; style?: CSSProperties }>) {
  return <th style={style}>{children}</th>;
}

export function AdminTd({
  children,
  style
}: Readonly<{ children: ReactNode; style?: CSSProperties }>) {
  return <td style={style}>{children}</td>;
}
