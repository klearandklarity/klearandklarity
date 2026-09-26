import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth, useSubmit } from '../../lib/auth'
import { PageLoader } from '../../components/Spinner'
import { Alert, EmptyState } from '../../components/Feedback'
import { TextField } from '../../components/Form'
import Modal from '../../components/Modal'
import { ButtonSpinner } from '../../components/Spinner'
import { ROLE_OPTIONS, formatDate, genderLabel, roleLabel } from '../../lib/utils'

function StatusPill({ on, onLabel, offLabel }) {
  return (
    <span
      className={`badge ring-1 ${
        on ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  )
}

function AnswersModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/admin/registrations/${userId}/answers`)
      .then(({ data: payload }) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? 'Could not load answers.')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Modal open onClose={onClose} title="Onboarding answers" size="lg">
      {error && <Alert tone="error">{error}</Alert>}
      {!data && !error && <PageLoader label="Loading answers..." />}

      {data && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
            <p className="font-semibold text-slate-900">{data.user.fullName}</p>
            <p className="text-slate-500">{data.user.email}</p>
          </div>

          {data.answers.length === 0 ? (
            <p className="text-sm text-slate-500">This user has not answered any questions yet.</p>
          ) : (
            data.answers.map((answer) => (
              <div key={answer.id} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm font-semibold text-slate-900">{answer.question}</p>
                {answer.options?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {answer.options.map((option) => (
                      <span
                        key={option}
                        className={`badge ${
                          option === '__OTHER__'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                        }`}
                      >
                        {option === '__OTHER__' ? 'Others' : option}
                      </span>
                    ))}
                  </div>
                )}
                {answer.text && (
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {answer.text}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  )
}

function SetPasswordModal({ user, onClose, onDone }) {
  const { busy, error, run } = useSubmit()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (password !== confirm) {
      setLocalError('The password and its confirmation do not match.')
      return
    }
    const result = await run(() => api.post(`/admin/registrations/${user.id}/set-password`, { newPassword: password }))
    if (result) onDone()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Set a new password for ${user.firstName}`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="set-password-form" disabled={busy} className="btn-primary">
            {busy ? <ButtonSpinner label="Saving..." /> : 'Set password'}
          </button>
        </>
      }
    >
      <form id="set-password-form" onSubmit={submit} className="space-y-4" noValidate>
        {(error || localError) && <Alert tone="error">{error || localError}</Alert>}

        <Alert tone="info">
          Use this when the student cannot receive the emailed reset link. They will be asked to change it
          again after logging in.
        </Alert>

        <TextField
          label="New password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters, with one letter and one number."
        />
        <TextField
          label="Confirm password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </form>
    </Modal>
  )
}

export default function AdminRegistrations() {
  const { user: me } = useAuth()
  const { busy, error, run } = useSubmit()

  const [rows, setRows] = useState(null)
  const [resets, setResets] = useState([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('ALL')
  const [loadError, setLoadError] = useState('')
  const [answersFor, setAnswersFor] = useState(null)
  const [passwordFor, setPasswordFor] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const load = useCallback(async () => {
    try {
      const params = {}
      if (debounced) params.search = debounced
      if (role !== 'ALL') params.role = role
      const [list, pending] = await Promise.all([
        api.get('/admin/registrations', { params }),
        api.get('/admin/password-resets'),
      ])
      setRows(list.data)
      setResets(pending.data)
      setLoadError('')
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not load registrations.')
    }
  }, [debounced, role])

  useEffect(() => {
    load()
  }, [load])

  const setEnabled = async (row) => {
    const result = await run(() =>
      api.patch(`/admin/registrations/${row.id}/enabled`, null, {
        params: { enabled: !row.enabled },
      }),
    )
    if (result) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...result.data } : r)))
      flash(result.data.enabled ? 'Account enabled.' : 'Account disabled.')
    }
  }

  const setRoleFor = async (row, nextRole) => {
    if (nextRole === row.role) return
    const result = await run(() =>
      api.patch(`/admin/registrations/${row.id}/role`, null, { params: { role: nextRole } }),
    )
    if (result) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...result.data } : r)))
      flash(`Role changed to ${roleLabel(nextRole)}.`)
    }
  }

  const verifyEmail = async (row) => {
    const result = await run(() => api.patch(`/admin/registrations/${row.id}/verify-email`))
    if (result) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...result.data } : r)))
      flash('Email marked as verified.')
    }
  }

  const removeUser = async (row) => {
    if (
      !window.confirm(
        `Delete ${row.fullName}? Their onboarding answers are removed too. This cannot be undone.`,
      )
    ) {
      return
    }
    const result = await run(() => api.delete(`/admin/registrations/${row.id}`))
    if (result) {
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      flash('Account deleted.')
    }
  }

  const resetUserIds = new Set(resets.map((r) => r.userId))

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Registrations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review accounts, change roles, disable access, mark emails verified, or set a password when a
          student cannot receive the reset email.
        </p>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {loadError && <Alert tone="error">{loadError}</Alert>}

      {resets.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">
            {resets.length} pending password reset request(s)
          </h3>
          <ul className="mt-3 space-y-2">
            {resets.map((item) => (
              <li
                key={item.requestId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm ring-1 ring-amber-200"
              >
                <span className="text-amber-900">
                  {item.name} &middot; {item.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const row = rows?.find((r) => r.id === item.userId)
                    if (row) setPasswordFor(row)
                  }}
                  className="font-semibold text-amber-800 underline"
                >
                  Set password
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="reg-search" className="label">
              Search
            </label>
            <input
              id="reg-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email or contact number"
              className="input"
            />
          </div>
          <div className="sm:w-48">
            <label htmlFor="reg-role" className="label">
              Role
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
            >
              <option value="ALL">All roles</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!rows ? (
        <PageLoader label="Loading registrations..." />
      ) : rows.length === 0 ? (
        <EmptyState icon="👥" title="No accounts match this filter">
          Try a different search term or role.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className={row.enabled ? '' : 'bg-slate-50 text-slate-400'}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {row.email} &middot; {genderLabel(row.gender)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.contactNumber}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.role}
                      onChange={(e) => setRoleFor(row, e.target.value)}
                      disabled={busy}
                      aria-label={`Role for ${row.fullName}`}
                      className="input py-1.5 text-xs"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusPill
                        on={row.enabled}
                        onLabel="Enabled"
                        offLabel="Disabled"
                      />
                      <StatusPill
                        on={row.emailVerified}
                        onLabel="Email verified"
                        offLabel="Email unverified"
                      />
                      <StatusPill
                        on={row.onboardingCompleted}
                        onLabel="Onboarded"
                        offLabel="Onboarding pending"
                      />
                      {resetUserIds.has(row.id) && (
                        <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          Reset requested
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAnswersFor(row)}
                        className="btn-ghost btn-sm"
                      >
                        Answers
                      </button>
                      {!row.emailVerified && (
                        <button
                          type="button"
                          onClick={() => verifyEmail(row)}
                          className="btn-ghost btn-sm"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPasswordFor(row)}
                        className="btn-ghost btn-sm"
                      >
                        Set password
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnabled(row)}
                        disabled={busy || row.id === me?.id}
                        className="btn-ghost btn-sm"
                      >
                        {row.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUser(row)}
                        disabled={busy || row.id === me?.id}
                        className="btn-ghost btn-sm text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {answersFor && (
        <AnswersModal userId={answersFor.id} onClose={() => setAnswersFor(null)} />
      )}

      {passwordFor && (
        <SetPasswordModal
          user={passwordFor}
          onClose={() => setPasswordFor(null)}
          onDone={() => {
            setPasswordFor(null)
            load()
            flash('Password updated. The student will be asked to change it again.')
          }}
        />
      )}
    </div>
  )
}
