export function EmptyStateBlock({
  title,
  description
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <div className="sf-empty" role="status">
      <h3 className="sf-empty-title">{title}</h3>
      <p className="sf-empty-desc">{description}</p>
    </div>
  );
}
