import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuth, useSubmit } from '../lib/auth'
import { PageLoader } from '../components/Spinner'
import { Alert } from '../components/Feedback'
import { TextField } from '../components/Form'
import { ButtonSpinner } from '../components/Spinner'
import { GENDER_OPTIONS } from '../lib/utils'

export default function Profile() {
  const { user, setUser } = useAuth()
  const { busy: savingProfile, error: profileError, fields: profileFields, clearField, run: runProfile } =
    useSubmit()
  const { busy: savingPassword, error: passwordError, clearField: clearPwField, run: runPassword } =
    useSubmit()

  const [profile, setProfile] = useState({
    fullName: '',
    contactNumber: '',
    gender: '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [mustChange, setMustChange] = useState(false)
  const [localError, setLocalError] = useState('')
  const [toast, setToast] = useState('')

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    if (!user) return
    setProfile({
      fullName: user.fullName ?? '',
      contactNumber: user.contactNumber ?? '',
      gender: user.gender ?? '',
    })
    setMustChange(Boolean(user.mustChangePassword))
  }, [user])

  const updateProfile = async (e) => {
    e.preventDefault()
    setLocalError('')
    const result = await runProfile(() =>
      api.put('/auth/profile', {
        fullName: profile.fullName,
        contactNumber: profile.contactNumber,
        gender: profile.gender,
      }),
    )
    if (result) {
      setUser((prev) => ({ ...prev, ...result.data }))
      flash('Profile saved.')
    }
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (passwords.newPassword !== passwords.confirmPassword) {
      setLocalError('The new password and its confirmation do not match.')
      return
    }

    const result = await runPassword(() =>
      api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }),
    )
    if (result) {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMustChange(false)
      setUser((prev) => ({ ...prev, mustChangePassword: false }))
      flash('Password changed successfully.')
    }
  }

  if (!user) return <PageLoader />

  const passwordsMismatch = Boolean(
    passwords.newPassword &&
      passwords.confirmPassword &&
      passwords.newPassword !== passwords.confirmPassword,
  )

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Keep your name and contact details accurate. In discussion, other students only ever see your
          first name.
        </p>
      </header>

      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}

      {mustChange && (
        <div className="mb-4">
          <Alert tone="warning" title="Password change required">
            This account must set a new password before continuing. Use the form below.
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* personal details */}
          <form onSubmit={updateProfile} className="card p-6" noValidate>
            <h2 className="text-lg font-bold text-slate-900">Personal details</h2>

            {profileError && (
              <div className="mt-4">
                <Alert tone="error">{profileError}</Alert>
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <TextField
                label="Full name"
                required
                value={profile.fullName}
                onChange={(e) => {
                  setProfile({ ...profile, fullName: e.target.value })
                  clearField('fullName')
                }}
                error={profileFields.fullName}
                autoComplete="name"
              />
              <TextField
                label="Contact number"
                required
                value={profile.contactNumber}
                onChange={(e) => {
                  setProfile({ ...profile, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  clearField('contactNumber')
                }}
                hint="10 digits, no country code"
                error={profileFields.contactNumber}
                inputMode="numeric"
                maxLength={10}
              />

              <div>
                <label htmlFor="profile-gender" className="label">
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="input"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <TextField
                label="Email"
                type="email"
                value={user.email ?? ''}
                readOnly
                hint="Email cannot be changed here. Contact an admin if it is wrong."
              />
            </div>

            <button type="submit" disabled={savingProfile} className="btn-primary mt-5">
              {savingProfile ? <ButtonSpinner label="Saving..." /> : 'Save changes'}
            </button>
          </form>

          {/* change password */}
          <form id="password" onSubmit={updatePassword} className="card scroll-mt-24 p-6" noValidate>
            <h2 className="text-lg font-bold text-slate-900">Change password</h2>
            <p className="mt-1 text-sm text-slate-500">
              Between 8 and 72 characters, with at least one letter and one number.
            </p>

            {(passwordError || localError) && (
              <div className="mt-4">
                <Alert tone="error">{passwordError || localError}</Alert>
              </div>
            )}

            <div className="mt-5 max-w-lg space-y-4">
              <TextField
                label="Current password"
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                  clearPwField('currentPassword')
                }}
                autoComplete="current-password"
              />
              <TextField
                label="New password"
                type="password"
                required
                value={passwords.newPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, newPassword: e.target.value })
                  clearPwField('newPassword')
                }}
                autoComplete="new-password"
              />
              <TextField
                label="Confirm new password"
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => {
                  setPasswords({ ...passwords, confirmPassword: e.target.value })
                  clearPwField('confirmPassword')
                }}
                error={passwordsMismatch ? 'Passwords do not match' : undefined}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword || passwordsMismatch}
              className="btn-primary mt-5"
            >
              {savingPassword ? <ButtonSpinner label="Updating..." /> : 'Update password'}
            </button>
          </form>
        </div>

        {/* account summary */}
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white">
              {user.firstName?.[0]?.toUpperCase()}
            </div>
            <p className="mt-3 text-base font-bold text-slate-900">{user.fullName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>

            <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-semibold text-slate-900">{user.role}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Email verified</dt>
                <dd>
                  {user.emailVerified ? (
                    <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      Yes
                    </span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">No</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Onboarding</dt>
                <dd>
                  {user.onboardingCompleted ? (
                    <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      Complete
                    </span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      Pending
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Privacy</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Your email, contact number and account id are never shown to other students. Posts display
              your first name only, or &quot;Anonymous&quot; if you choose it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
