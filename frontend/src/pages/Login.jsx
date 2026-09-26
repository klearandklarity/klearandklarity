import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../lib/api'
import { useAuth } from '../lib/auth'
import { TextField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner } from '../components/Spinner'
import Logo from '../components/Logo'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoggedIn, needsOnboarding, isAdmin } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Set when the backend says the email is not verified yet.
  const [unverified, setUnverified] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const from = location.state?.from

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setError('')
    setUnverified(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setUnverified(false)
    try {
      const user = await login(form.email, form.password)
      if (from && !user.onboardingCompleted && user.role !== 'ADMIN') {
        navigate('/onboarding', { replace: true })
      } else if (user.role !== 'ADMIN' && !user.onboardingCompleted) {
        navigate('/onboarding', { replace: true })
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from || '/dashboard', { replace: true })
      }
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      if (/verify/i.test(message)) setUnverified(true)
    } finally {
      setBusy(false)
    }
  }

  const resendVerification = async () => {
    setResendBusy(true)
    setResendMessage('')
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email })
      setResendMessage(data.message)
    } catch (err) {
      setResendMessage(errorMessage(err))
    } finally {
      setResendBusy(false)
    }
  }

  if (isLoggedIn) {
    return (
      <div className="container-page py-20">
        <Alert tone="info" title="You are already logged in">
          <Link to={isAdmin ? '/admin' : needsOnboarding ? '/onboarding' : '/dashboard'} className="link">
            Continue
          </Link>
        </Alert>
      </div>
    )
  }

  return (
    <section className="container-page py-14">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <Logo size="md" showText={false} className="justify-center" />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-600">Log in to reach your dashboard and career tree.</p>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <Alert tone="error">
                {error}
                {unverified && (
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={resendBusy}
                    className="ml-1 font-semibold underline underline-offset-2"
                  >
                    {resendBusy ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </Alert>
            )}

            {resendMessage && <Alert tone="success">{resendMessage}</Alert>}

            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              placeholder="aarav@example.com"
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={update('password')}
              placeholder="Your password"
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="link text-sm">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <ButtonSpinner label="Logging in..." /> : 'Log in'}
            </button>

            <p className="text-center text-sm text-slate-600">
              New here?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
