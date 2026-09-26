import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth, useSubmit } from '../lib/auth'
import { TextField, ChoiceField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner } from '../components/Spinner'
import Modal from '../components/Modal'
import Logo from '../components/Logo'
import { GENDER_OPTIONS } from '../lib/utils'

const GENDERS = GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))

export default function Register() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { busy, error, fields, clearField, run } = useSubmit()

  const [form, setForm] = useState({ fullName: '', contactNumber: '', email: '', password: '', confirm: '' })
  const [gender, setGender] = useState('')
  const [localError, setLocalError] = useState('')
  const [created, setCreated] = useState(null)

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

    // Deliberately no auto-login: we show the popup and send the user to Login.
    const result = await run(() =>
      api.post('/auth/register', {
        fullName: form.fullName,
        contactNumber: form.contactNumber,
        email: form.email,
        password: form.password,
        gender,
      }),
    )

    if (result) {
      setCreated(result.data)
      setForm({ fullName: '', contactNumber: '', email: '', password: '', confirm: '' })
      setGender('')
    }
  }

  if (isLoggedIn) {
    return (
      <div className="container-page py-20">
        <Alert tone="info" title="You are already logged in">
          <Link to="/dashboard" className="link">
            Go to your dashboard
          </Link>{' '}
          or{' '}
          <Link to="/career-tree" className="link">
            browse the Career Tree
          </Link>
          .
        </Alert>
      </div>
    )
  }

  return (
    <>
      <section className="container-page py-14">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <Logo size="md" showText={false} className="justify-center" />
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-2 text-slate-600">
              Free, and takes under a minute. You will log in manually after registering.
            </p>
          </div>

          <div className="card mt-8 p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {error && <Alert tone="error">{error}</Alert>}
              {localError && <Alert tone="error">{localError}</Alert>}

              <TextField
                label="Full name"
                required
                value={form.fullName}
                onChange={update('fullName')}
                error={fields.fullName}
                placeholder="Aarav Sharma"
                autoComplete="name"
                hint="Only your first name is ever shown on discussion posts."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Contact number"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={form.contactNumber}
                  onChange={update('contactNumber')}
                  error={fields.contactNumber}
                  placeholder="9876543210"
                  autoComplete="tel"
                  hint="10 digits, no country code."
                />
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  error={fields.email}
                  placeholder="aarav@example.com"
                  autoComplete="email"
                />
              </div>

              <ChoiceField
                label="Gender"
                required
                name="gender"
                columns={2}
                options={GENDERS}
                value={gender}
                onChange={(value) => {
                  setGender(value)
                  clearField('gender')
                }}
                error={fields.gender}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Password"
                  type="password"
                  required
                  value={form.password}
                  onChange={update('password')}
                  error={fields.password}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  hint="Must include at least one letter and one number."
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  required
                  value={form.confirm}
                  onChange={update('confirm')}
                  error={form.confirm && form.confirm !== form.password ? 'Passwords do not match' : undefined}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <ButtonSpinner label="Creating account..." /> : 'Create account'}
              </button>

              <p className="text-center text-sm text-slate-600">
                Already registered?{' '}
                <Link to="/login" className="link">
                  Log in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* The popup the student sees after the account is created. */}
      <Modal
        open={Boolean(created)}
        onClose={() => navigate('/login')}
        title="Account created"
        size="sm"
        footer={
          <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full sm:w-auto">
            Go to login
          </button>
        }
      >
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl" aria-hidden="true">
            ✓
          </span>
          <p className="mt-4 font-semibold text-slate-900">{created?.message}</p>

          {created?.verificationRequired ? (
            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-left ring-1 ring-brand-200">
              <p className="text-sm font-semibold text-brand-900">Check your inbox</p>
              <p className="mt-1 text-sm text-brand-800">
                We sent a verification link to{' '}
                <span className="font-semibold break-all">{created?.email}</span>. Click it to activate your
                account, then log in.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              You were not logged in automatically. Please use your new credentials on the login page.
            </p>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Signed up as a <strong>Student</strong>. Admin accounts are created separately.
          </p>
        </div>
      </Modal>
    </>
  )
}
