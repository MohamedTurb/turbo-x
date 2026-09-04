export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
        <span className="h-2 w-2 rounded-full bg-crimson" />
      </div>
      <h3 className="text-lg font-medium text-neutral-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action}
    </div>
  );
}
