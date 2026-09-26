import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../lib/api'
import { Spinner } from '../components/Spinner'
import Logo from '../components/Logo'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState(token ? 'working' : 'error')
  const [message, setMessage] = useState(token ? 'Verifying your email address...' : 'This link is missing its token.')

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false

    api
      .get(`/auth/verify-email`, { params: { token } })
      .then(({ data }) => {
        if (cancelled) return
        setMessage(data.message)
        setState('done')
      })
      .catch((err) => {
        if (cancelled) return
        setMessage(errorMessage(err))
        setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <section className="container-page py-20">
      <div className="mx-auto max-w-md text-center">
        <Logo size="md" showText={false} className="justify-center" />

        <div className="card mt-8 p-8">
          {state === 'working' && (
            <>
              <Spinner className="mx-auto h-10 w-10 text-brand-600" />
              <p className="mt-4 font-semibold text-slate-900">{message}</p>
            </>
          )}

          {state === 'done' && (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl" aria-hidden="true">
                ✓
              </span>
              <h1 className="mt-4 text-xl font-bold text-slate-900">Email verified</h1>
              <p className="mt-2 text-sm text-slate-600">{message}</p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Go to login
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl" aria-hidden="true">
                !
              </span>
              <h1 className="mt-4 text-xl font-bold text-slate-900">Could not verify</h1>
              <p className="mt-2 text-sm text-slate-600">{message}</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/login" className="btn-secondary flex-1">
                  Back to login
                </Link>
                <Link to="/forgot-password" className="btn-primary flex-1">
                  Reset via email
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                If the link expired, ask for a new verification email from the sign-in page.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
