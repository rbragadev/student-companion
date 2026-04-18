interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message = 'Carregando...', rows = 5 }: LoadingStateProps) {
  return (
    <div className="space-y-3" role="status" aria-label={message}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
      <span className="sr-only">{message}</span>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className ?? ''}`}>
      <svg
        className="h-6 w-6 animate-spin text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
