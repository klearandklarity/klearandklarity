import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

const LINKS = [
  { to: '/admin', end: true, label: 'Overview', icon: '📊' },
  { to: '/admin/registrations', label: 'Registrations', icon: '👥' },
  { to: '/admin/onboarding', label: 'Onboarding', icon: '📝' },
  { to: '/admin/careers', label: 'Careers', icon: '🌱' },
  { to: '/admin/discussion', label: 'Discussion', icon: '💬' },
  { to: '/admin/messages', label: 'Inbox', icon: '📨' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Admin Panel
        </h1>
        <p className="mt-2 text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{user?.email}</span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <aside>
          <nav className="card sticky top-24 p-3">
            <ul className="space-y-1">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-brand-700 font-semibold text-white'
                          : 'font-medium text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
