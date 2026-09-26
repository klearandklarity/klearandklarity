import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <section className="container-page py-24">
      <div className="mx-auto max-w-lg text-center">
        <Logo size="lg" showText={false} className="justify-center" />
        <p className="mt-6 text-6xl font-extrabold text-brand-700">404</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">We could not find that page</h1>
        <p className="mt-2 text-slate-600">
          The link may be broken, or the page may have been moved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            Back to home
          </Link>
          <Link to="/career-tree" className="btn-secondary">
            Open Career Tree
          </Link>
        </div>
      </div>
    </section>
  )
}
