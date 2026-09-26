import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useSubmit } from '../../lib/auth'
import { Alert } from '../../components/Feedback'
import { TextField } from '../../components/Form'
import { ButtonSpinner } from '../../components/Spinner'
import { useSettings } from '../../lib/settings'

const FALLBACK = {
  companyName: 'Klear And Klarity',
  tagline: 'Find your path. Own your future.',
  aboutText: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  logoPath: '/logo.jpeg',
}

export default function AdminSettings() {
  const { refresh } = useSettings()
  const { busy, error, run } = useSubmit()

  const [form, setForm] = useState(FALLBACK)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get('/public/settings')
      .then(({ data }) => {
        if (!cancelled) setForm({ ...FALLBACK, ...data })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const result = await run(() => api.put('/admin/settings', form))
    if (result) {
      await refresh()
      setToast('Settings saved. They appear immediately across the site.')
      setTimeout(() => setToast(''), 3500)
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Site settings</h2>
        <p className="mt-1 text-sm text-slate-600">
          These values drive the header, the footer, the About page and the contact details.
        </p>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={submit} className="card p-6" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Company name"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <TextField
            label="Tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
          <TextField
            label="Contact email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            hint="Shown in the footer and on the contact page."
          />
          <TextField
            label="Contact phone"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
          />
          <TextField
            label="Logo path"
            value={form.logoPath}
            onChange={(e) => setForm({ ...form, logoPath: e.target.value })}
            hint="A path served by the frontend, for example /logo.jpeg"
          />
          <TextField
            label="Address"
            as="textarea"
            textareaRows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className="mt-5">
          <TextField
            label="About text"
            as="textarea"
            textareaRows={8}
            value={form.aboutText}
            onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
            hint="Displayed on the About page. Blank lines separate paragraphs."
          />
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Preview</p>
          <p className="mt-1.5 font-bold text-slate-900">{form.companyName}</p>
          {form.tagline && <p className="text-sm text-slate-600">{form.tagline}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {form.contactEmail && <span>{form.contactEmail}</span>}
            {form.contactPhone && <span>{form.contactPhone}</span>}
            {form.address && <span>{form.address}</span>}
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary mt-5">
          {busy ? <ButtonSpinner label="Saving..." /> : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
