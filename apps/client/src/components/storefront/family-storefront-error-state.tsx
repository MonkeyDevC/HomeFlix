export function FamilyStorefrontErrorState({
  title,
  message
}: Readonly<{ title: string; message: string }>) {
  return (
    <div className="sf-error" role="alert">
      <h3 className="sf-error-title">{title}</h3>
      <p className="sf-error-msg">{message}</p>
    </div>
  );
}

