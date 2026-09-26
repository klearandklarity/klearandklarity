import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useSubmit } from '../lib/auth'
import { TextField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner } from '../components/Spinner'
import Logo from '../components/Logo'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const { busy, error, fields, clearField, run } = useSubmit()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [localError, setLocalError] = useState('')
  const [done, setDone] = useState(false)

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    clearField(field)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (form.password !== form.confirm) {
      setLocalError('The two passwords do not match.')
      return
    }
    const result = await run(() => api.post('/auth/reset-password', { token, newPassword: form.password }))
    if (result) setDone(true)
  }

  if (!token) {
    return (
      <section className="container-page py-20">
        <div className="mx-auto max-w-md">
          <Alert tone="error" title="This link is incomplete">
            The reset link is missing its token.{' '}
            <Link to="/forgot-password" className="link">
              Request a new one
            </Link>
            .
          </Alert>
        </div>
      </section>
    )
  }

  return (
    <section className="container-page py-14">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <Logo size="md" showText={false} className="justify-center" />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Choose a new password</h1>
        </div>

        <div className="card mt-8 p-6 sm:p-8">
          {done ? (
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl" aria-hidden="true">
                ✓
              </span>
              <p className="mt-4 font-semibold text-slate-900">Password updated</p>
              <p className="mt-2 text-sm text-slate-600">Log in with your new password.</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-primary mt-6 w-full"
              >
                Go to login
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {error && <Alert tone="error">{error}</Alert>}
              {localError && <Alert tone="error">{localError}</Alert>}

              <TextField
                label="New password"
                type="password"
                required
                value={form.password}
                onChange={update('password')}
                error={fields.newPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                hint="Must include at least one letter and one number."
              />

              <TextField
                label="Confirm new password"
                type="password"
                required
                value={form.confirm}
                onChange={update('confirm')}
                error={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : undefined}
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <ButtonSpinner label="Updating..." /> : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
