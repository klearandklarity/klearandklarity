export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  )
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ButtonSpinner({ label = 'Please wait' }) {
  return (
    <>
      <Spinner className="h-4 w-4" />
      {label}
    </>
  )
}
