import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { companyName } = useSettings()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const dashboardLinks = isLoggedIn
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/career-tree', label: 'Career Tree' },
        { to: '/discussion', label: 'Discussion' },
        { to: '/profile', label: 'My Profile' },
        ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', accent: true }] : []),
      ]
    : []

  const links = [...PUBLIC_LINKS, ...dashboardLinks]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="shrink-0" aria-label={`${companyName} home`}>
            <Logo size="sm" />
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  link.accent
                    ? `ml-2 rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 ${
                        isActive ? 'ring-2 ring-brand-300' : ''
                      }`
                    : linkClass({ isActive })
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 text-sm transition hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">
                    {user.firstName?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                  <span className="max-w-[9rem] truncate font-semibold text-slate-800">{user.firstName}</span>
                  <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <span className="badge mt-2 bg-brand-50 text-brand-700 capitalize ring-1 ring-brand-200">
                          {user.role.toLowerCase()}
                        </span>
                      </div>
                      <Link to="/profile" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        My profile
                      </Link>
                      <Link to="/profile#password" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        Change password
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {open ? <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="my-2 border-t border-slate-200" />
            {isLoggedIn ? (
              <>
                <p className="px-3 pb-1 text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800">{user.fullName}</span>
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
