import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useSettings } from '../lib/settings'

export default function Footer() {
  const { companyName, contactEmail, contactPhone, address } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              An education-only career guidance platform. We help students pick a direction after Class 10
              using a filterable career tree, a short onboarding questionnaire and a peer discussion that
              keeps everyone anonymous.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Explore</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About us' },
                { to: '/career-tree', label: 'Career Tree' },
                { to: '/discussion', label: 'Discussion' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-600 transition hover:text-brand-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Account</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { to: '/login', label: 'Log in' },
                { to: '/register', label: 'Create account' },
                { to: '/forgot-password', label: 'Forgot password' },
                { to: '/contact', label: 'Contact support' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-600 transition hover:text-brand-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(contactEmail || contactPhone || address) && (
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-100 pt-6 text-sm text-slate-600">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="transition hover:text-brand-700">
                {contactEmail}
              </a>
            )}
            {contactPhone && <span>{contactPhone}</span>}
            {address && <span>{address}</span>}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {companyName}. Built for students.
          </p>
          <p>
            Career content is general guidance only. Always confirm fees, eligibility and exam dates on the
            official website.
          </p>
        </div>
      </div>
    </footer>
  )
}
