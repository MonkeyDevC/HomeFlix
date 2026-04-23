export function LoadingSkeletonRow() {
  return (
    <div className="sf-skeleton-row" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="sf-skeleton-card" />
      ))}
    </div>
  );
}
