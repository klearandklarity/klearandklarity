import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useSubmit } from '../lib/auth'
import { TextField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner } from '../components/Spinner'
import Logo from '../components/Logo'

export default function ForgotPassword() {
  const { busy, error, fields, clearField, run } = useSubmit()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    const result = await run(() => api.post('/auth/forgot-password', { email }))
    if (result) {
      setMessage(result.data.message)
      setSent(true)
    }
  }

  return (
    <section className="container-page py-14">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <Logo size="md" showText={false} className="justify-center" />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Forgot your password?</h1>
          <p className="mt-2 text-slate-600">
            Enter your registered email and we will send you a link to choose a new password.
          </p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl" aria-hidden="true">
                ✉
              </span>
              <p className="mt-4 font-semibold text-slate-900">{message}</p>
              <p className="mt-3 text-sm text-slate-600">
                If your school mailbox filters mail, check the spam folder. The link expires in 60 minutes.
              </p>
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
                Still nothing? Our admin can reset it for you from the admin panel. Send us a message and we
                will help.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to="/contact" className="btn-secondary">
                  Contact support
                </Link>
                <Link to="/login" className="btn-primary">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {error && <Alert tone="error">{error}</Alert>}

              <TextField
                label="Registered email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearField('email')
                }}
                error={fields.email}
                placeholder="aarav@example.com"
                autoComplete="email"
              />

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <ButtonSpinner label="Sending link..." /> : 'Send reset link'}
              </button>

              <p className="text-center text-sm text-slate-600">
                Remembered it?{' '}
                <Link to="/login" className="link">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
