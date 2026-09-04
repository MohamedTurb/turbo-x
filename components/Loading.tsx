export default function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 py-16 text-neutral-400">
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-crimson" />
      </div>
      <p className="text-sm tracking-wide">{label}…</p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-900 ${className}`}
      aria-hidden="true"
    />
  );
}
