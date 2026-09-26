import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { PageLoader } from '../../components/Spinner'
import { Alert } from '../../components/Feedback'

function StatCard({ label, value, hint, to, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  }

  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value ?? 0}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  )

  return to ? (
    <Link to={to} className={`card-hover block p-5 ${tones[tone]}`}>
      {body}
    </Link>
  ) : (
    <div className={`card p-5 ${tones[tone]}`}>{body}</div>
  )
}

const QUICK_ACTIONS = [
  { to: '/admin/careers', label: 'Add or edit career pathways', icon: '🌱' },
  { to: '/admin/onboarding', label: 'Manage onboarding questions', icon: '📝' },
  { to: '/admin/discussion', label: 'Add discussion categories', icon: '💬' },
  { to: '/admin/messages', label: 'Read the contact inbox', icon: '📨' },
  { to: '/admin/settings', label: 'Edit site details', icon: '⚙️' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message ?? 'Could not load statistics.'))
  }, [])

  if (error) {
    return (
      <Alert tone="error" title="Failed to load statistics">
        {error}
      </Alert>
    )
  }

  if (!stats) return <PageLoader label="Loading statistics..." />

  const pendingOnboarding = Math.max(
    (stats.students ?? 0) - (stats.onboardingCompleted ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registrations"
          value={stats.totalRegistrations}
          hint="All accounts"
          to="/admin/registrations"
        />
        <StatCard
          label="Career items"
          value={stats.totalCareerItems}
          hint="Active in the library"
          to="/admin/careers"
          tone="sky"
        />
        <StatCard
          label="Discussions"
          value={stats.totalDiscussions}
          hint="Posts, not deleted"
          to="/admin/discussion"
          tone="amber"
        />
        <StatCard
          label="Unread messages"
          value={stats.unreadMessages}
          hint="Contact form"
          to="/admin/messages"
          tone="rose"
        />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900">Accounts by role</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Students" value={stats.students} tone="sky" />
          <StatCard label="Employees" value={stats.employees} tone="slate" />
          <StatCard label="Admins" value={stats.admins} tone="slate" />
          <StatCard label="Verified emails" value={stats.verifiedEmails} tone="sky" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Onboarding complete"
          value={stats.onboardingCompleted}
          hint="Students who finished the questions"
          tone="sky"
        />
        <StatCard
          label="Still pending"
          value={pendingOnboarding}
          hint="Registered but not finished"
          to="/admin/registrations"
          tone="amber"
        />
      </div>

      {stats.pendingPasswordResets > 0 && (
        <Alert tone="warning" title={`${stats.pendingPasswordResets} password reset request(s) waiting`}>
          <Link to="/admin/registrations" className="font-semibold underline">
            Review them in Registrations
          </Link>{' '}
          and set a new password for the student, since email delivery may not be configured.
        </Alert>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="btn-secondary justify-start">
              <span aria-hidden="true">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
