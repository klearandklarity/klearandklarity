import { Link } from 'react-router-dom'

export function Alert({ tone = 'error', title, children, action }) {
  const tones = {
    error: 'bg-rose-50 text-rose-900 ring-rose-200',
    success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    info: 'bg-brand-50 text-brand-900 ring-brand-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  }
  const icons = {
    error: 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
    success: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    info: 'M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z',
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ${tones[tone]}`} role="alert">
      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[tone]} />
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {action}
      </div>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children && <p className="max-w-md text-sm text-slate-500">{children}</p>}
      {action}
    </div>
  )
}

/** The reusable "you need to sign in" wall. */
export function SignInWall({ title = 'Please log in to continue' }) {
  return (
    <div className="container-page py-20">
      <EmptyState
        icon="🔒"
        title={title}
        action={
          <Link to="/login" className="btn-primary mt-2">
            Go to login
          </Link>
        }
      >
        Your dashboard, career tree and discussions are only available to registered students.
      </EmptyState>
    </div>
  )
}
