import { useState } from 'react'
import api from '../lib/api'
import { useSubmit } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { TextField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner } from '../components/Spinner'
import Logo from '../components/Logo'

const TOPICS = ['Career guidance', 'Wrong information on a career page', 'Technical problem', 'Feedback', 'Other']

export default function Contact() {
  const { contactEmail, contactPhone, address, companyName } = useSettings()
  const { busy, error, fields, clearField, run } = useSubmit()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    clearField(field)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    
    const result = await run(() => api.post('/public/contact', form))
    if (result) {
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    }
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-brand-50 to-white py-14">
        <div className="container-page">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Contact us</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Questions, corrections, or a category you think we are missing. Messages land directly in the
            admin inbox.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              {sent ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl" aria-hidden="true">
                    ✓
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">Message sent</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
                    Thank you for contacting {companyName}. Our team will get back to you shortly.
                  </p>
                  <button type="button" onClick={() => setSent(false)} className="btn-secondary mt-6">
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
                  <p className="mt-1 text-sm text-slate-500">All fields are required.</p>

                  <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
                    {error && <Alert tone="error">{error}</Alert>}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        label="Your name"
                        required
                        value={form.name}
                        onChange={update('name')}
                        error={fields.name}
                        placeholder="Aarav Sharma"
                        autoComplete="name"
                      />
                      <TextField
                        label="Your email"
                        type="email"
                        required
                        value={form.email}
                        onChange={update('email')}
                        error={fields.email}
                        placeholder="aarav@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <TextField
                      label="Subject"
                      required
                      value={form.subject}
                      onChange={update('subject')}
                      error={fields.subject}
                      placeholder="Short summary of your question"
                    />

                    <div>
                      <p className="label">What is this about?</p>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, subject: topic }))}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                              form.subject === topic
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50'
                            }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    <TextField
                      as="textarea"
                      label="Message"
                      required
                      textareaRows={6}
                      value={form.message}
                      onChange={update('message')}
                      error={fields.message}
                      hint="At least 10 characters. Please include your class if it helps us answer."
                      placeholder="Tell us what you need help with..."
                    />

                    <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
                      {busy ? <ButtonSpinner label="Sending..." /> : 'Send message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card p-6">
              <Logo size="sm" />
              <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-500">Reach us</h3>
              <ul className="mt-3 space-y-3 text-sm">
                {contactEmail && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600" aria-hidden="true">
                      ✉
                    </span>
                    <a href={`mailto:${contactEmail}`} className="link break-all">
                      {contactEmail}
                    </a>
                  </li>
                )}
                {contactPhone && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600" aria-hidden="true">
                      ☎
                    </span>
                    <span className="text-slate-700">{contactPhone}</span>
                  </li>
                )}
                {address && (
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand-600" aria-hidden="true">
                      ⌂
                    </span>
                    <span className="text-slate-700">{address}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="card border-amber-200 bg-amber-50 p-6">
              <h3 className="text-sm font-bold text-amber-900">Before you write</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-900">
                For career advice specifically, the <strong>Discussion</strong> usually gets you a faster
                answer, because other students in the same class have already been through it.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
