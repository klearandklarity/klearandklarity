import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import { useSubmit } from '../../lib/auth'
import { PageLoader } from '../../components/Spinner'
import { Alert, EmptyState } from '../../components/Feedback'
import { TextField, Checkbox } from '../../components/Form'
import Modal from '../../components/Modal'
import { ButtonSpinner } from '../../components/Spinner'
import { formatDateTime, pluralize } from '../../lib/utils'

function MessageDetail({ message, busy, onToggleRead, onSave, onDelete, onClose }) {
  const { busy: saving, error, run } = useSubmit()
  const [note, setNote] = useState(message.adminNote ?? '')
  const [replied, setReplied] = useState(Boolean(message.replied))

  const save = async (e) => {
    e.preventDefault()
    const result = await run(() =>
      api.put(`/admin/messages/${message.id}`, { adminNote: note, replied }),
    )
    if (result) onSave(result.data)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={message.subject}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button type="submit" form="message-form" disabled={saving} className="btn-primary">
            {saving ? <ButtonSpinner label="Saving..." /> : 'Save note'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">{message.name}</p>
          <p className="text-sm text-slate-600">
            <a href={`mailto:${message.email}`} className="hover:text-brand-700 hover:underline">
              {message.email}
            </a>
          </p>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(message.createdAt)}</p>
        </div>

        <div>
          <p className="label">Message</p>
          <p className="whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-200">
            {message.message}
          </p>
        </div>

        <form id="message-form" onSubmit={save} className="space-y-4 border-t border-slate-200 pt-4">
          {error && <Alert tone="error">{error}</Alert>}

          <TextField
            as="textarea"
            textareaRows={4}
            label="Internal note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="Only admins can read this. Use it to track what you replied."
          />

          <div className="space-y-3">
            <Checkbox
              label="Marked as replied"
              description="Tick this once you have answered the sender by email."
              checked={replied}
              onChange={setReplied}
            />
            <Checkbox
              label="Read"
              checked={message.read}
              onChange={(checked) => onToggleRead(message, checked)}
            />
          </div>

          <div className="flex justify-between gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onDelete(message)}
              disabled={busy}
              className="btn-ghost text-rose-600"
            >
              Delete message
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <ButtonSpinner label="Saving..." /> : 'Save note'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default function AdminMessages() {
  const { busy, error, run } = useSubmit()

  const [messages, setMessages] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [open, setOpen] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/messages')
      setMessages(data)
      setLoadError('')
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not load the inbox.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openMessage = async (message) => {
    setOpen(message)
    // Opening an unread message marks it read so the counter stays honest.
    if (!message.read) {
      const result = await run(() =>
        api.patch(`/admin/messages/${message.id}/read`, null, { params: { read: true } }),
      )
      if (result) {
        setOpen(result.data)
        setMessages((prev) => prev.map((m) => (m.id === message.id ? result.data : m)))
      }
    }
  }

  const toggleRead = async (message, read) => {
    const result = await run(() =>
      api.patch(`/admin/messages/${message.id}/read`, null, { params: { read } }),
    )
    if (result) {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? result.data : m)))
      setOpen((prev) => (prev?.id === message.id ? result.data : prev))
    }
  }

  const saveMessage = (updated) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setOpen(updated)
    flash('Message updated.')
  }

  const removeMessage = async (message) => {
    if (!window.confirm(`Delete the message "${message.subject}"?`)) return
    const result = await run(() => api.delete(`/admin/messages/${message.id}`))
    if (result) {
      setMessages((prev) => prev.filter((m) => m.id !== message.id))
      setOpen(null)
      flash('Message deleted.')
    }
  }

  const unreadCount = (messages ?? []).filter((m) => !m.read).length
  const visible = (messages ?? []).filter((m) => (showUnreadOnly ? !m.read : true))

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inbox</h2>
          <p className="mt-1 text-sm text-slate-600">
            Messages sent from the public contact form.
            {unreadCount > 0 && ` ${pluralize(unreadCount, 'message')} unread.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUnreadOnly((v) => !v)}
          className="btn-secondary btn-sm"
        >
          {showUnreadOnly ? 'Show all' : 'Show unread only'}
        </button>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {loadError && <Alert tone="error">{loadError}</Alert>}

      {!messages ? (
        <PageLoader label="Loading inbox..." />
      ) : visible.length === 0 ? (
        <EmptyState icon="📨" title={showUnreadOnly ? 'Nothing unread' : 'No messages yet'}>
          {showUnreadOnly
            ? 'You have read every message.'
            : 'Messages from the contact form will land here.'}
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => openMessage(message)}
                className={`card-hover block w-full p-4 text-left ${
                  message.read ? '' : 'border-l-4 border-l-brand-600'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {!message.read && (
                      <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />
                    )}
                    <span className="font-semibold text-slate-900">{message.subject}</span>
                    {message.replied && (
                      <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                        Replied
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(message.createdAt)}</span>
                </div>

                <p className="mt-1.5 text-sm text-slate-600">
                  {message.name} &middot; {message.email}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{message.message}</p>
                {message.adminNote && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">
                    Note: {message.adminNote}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <MessageDetail
          message={open}
          busy={busy}
          onToggleRead={toggleRead}
          onSave={saveMessage}
          onDelete={removeMessage}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}
