import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuth, useSubmit } from '../lib/auth'
import { PageLoader } from '../components/Spinner'
import { Alert } from '../components/Feedback'
import { TextField, Checkbox } from '../components/Form'
import Modal from '../components/Modal'
import { ButtonSpinner } from '../components/Spinner'
import { categoryColorClass, formatDateTime, timeAgo } from '../lib/utils'

export default function DiscussionPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { busy, error, run } = useSubmit()

  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [reply, setReply] = useState({ body: '', anonymous: false })
  const [replyError, setReplyError] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const load = async () => {
    try {
      const { data: post } = await api.get(`/discussions/posts/${id}`)
      setData(post)
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not load this discussion.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const submitReply = async (e) => {
    e.preventDefault()
    setReplyError('')
    if (!reply.body.trim()) {
      setReplyError('Please write a reply.')
      return
    }
    const result = await run(() => api.post(`/discussions/posts/${id}/replies`, reply))
    if (result) {
      setReply({ body: '', anonymous: false })
      load()
    }
  }

  const deletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    const result = await run(() => api.delete(`/discussions/posts/${id}`))
    if (result) navigate('/discussion')
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    const result = await run(() => api.put(`/discussions/posts/${id}`, editing))
    if (result) {
      setEditing(null)
      load()
      flash('Post updated.')
    }
  }

  const togglePin = async () => {
    const result = await run(() =>
      api.patch(`/discussions/posts/${id}/pin`, null, { params: { pinned: !data.post.pinned } }),
    )
    if (result) {
      setData((prev) => ({ ...prev, post: { ...prev.post, pinned: !prev.post.pinned } }))
      flash(data.post.pinned ? 'Post unpinned.' : 'Post pinned to the top.')
    }
  }

  const deleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return
    const result = await run(() => api.delete(`/discussions/replies/${replyId}`))
    if (result) load()
  }

  if (loadError) {
    return (
      <div className="container-page py-16">
        <Alert tone="error" title="Discussion not found">
          {loadError}
        </Alert>
        <Link to="/discussion" className="btn-primary mt-4">
          Back to Discussion
        </Link>
      </div>
    )
  }

  if (!data) return <PageLoader label="Loading discussion..." />

  const { post, replies } = data
  const canModerate = post.mine || isAdmin

  return (
    <div className="container-page py-8">
      <nav className="mb-5 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/discussion" className="hover:text-brand-700">
          Discussion
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate">{post.categoryName}</span>
      </nav>

      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          {/* post */}
          <article className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              {post.pinned && (
                <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">📌 Pinned</span>
              )}
              <span className={`badge ring-1 ${categoryColorClass(post.categoryColor)}`}>
                {post.categoryName}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl">
              {post.title}
            </h1>

            <div className="mt-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                {post.anonymous ? '?' : post.displayName?.[0]?.toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {post.displayName}
                  {post.anonymous && (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">(anonymous)</span>
                  )}
                </p>
                <p className="text-xs text-slate-500" title={formatDateTime(post.createdAt)}>
                  {timeAgo(post.createdAt)}
                </p>
              </div>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-slate-700">{post.body}</p>

            {canModerate && (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {post.mine && !isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditing({ title: post.title, body: post.body })}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button type="button" onClick={togglePin} className="btn-secondary btn-sm">
                    {post.pinned ? 'Unpin' : 'Pin to top'}
                  </button>
                )}
                <button type="button" onClick={deletePost} className="btn-ghost btn-sm text-rose-600">
                  Delete
                </button>
              </div>
            )}
          </article>

          {/* replies */}
          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-900">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </h2>

            {replies.length === 0 ? (
              <p className="mt-3 rounded-xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                No replies yet. If you know this topic, your answer could be the one that helps.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {replies.map((item) => (
                  <li key={item.id} className="card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {item.anonymous ? '?' : item.displayName?.[0]?.toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.displayName}
                            {item.anonymous && (
                              <span className="ml-1.5 text-xs font-normal text-slate-500">(anonymous)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500" title={formatDateTime(item.createdAt)}>
                            {timeAgo(item.createdAt)}
                          </p>
                        </div>
                      </div>

                      {(item.mine || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => deleteReply(item.id)}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* reply composer */}
          <section className="card mt-6 p-5">
            <h2 className="text-base font-bold text-slate-900">Write a reply</h2>

            <form onSubmit={submitReply} className="mt-4 space-y-4" noValidate>
              {error && <Alert tone="error">{error}</Alert>}
              {replyError && <Alert tone="error">{replyError}</Alert>}

              <TextField
                as="textarea"
                textareaRows={4}
                label="Your reply"
                required
                value={reply.body}
                onChange={(e) => {
                  setReply({ ...reply, body: e.target.value })
                  setReplyError('')
                }}
                placeholder="Share what you know..."
              />

              <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                <Checkbox
                  label="Reply anonymously"
                  description="Your name is replaced with 'Anonymous'."
                  checked={reply.anonymous}
                  onChange={(checked) => setReply({ ...reply, anonymous: checked })}
                />
              </div>

              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? <ButtonSpinner label="Posting..." /> : 'Post reply'}
              </button>
            </form>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Posted by</h2>
            <p className="mt-2 text-sm font-semibold text-slate-900">{post.displayName}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Only a first name is ever shown. Email, contact number and profile stay private.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Details</h2>
            <dl className="mt-2.5 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{post.categoryName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Replies</dt>
                <dd className="font-medium text-slate-900">{replies.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Posted</dt>
                <dd className="font-medium text-slate-900">{formatDateTime(post.createdAt)}</dd>
              </div>
            </dl>
          </div>

          <Link to="/discussion" className="btn-secondary w-full">
            Back to all discussions
          </Link>
        </aside>
      </div>

      {/* edit modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit your post"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="edit-post-form" disabled={busy} className="btn-primary">
              {busy ? <ButtonSpinner label="Saving..." /> : 'Save changes'}
            </button>
          </>
        }
      >
        {editing && (
          <form id="edit-post-form" onSubmit={saveEdit} className="space-y-4" noValidate>
            {error && <Alert tone="error">{error}</Alert>}
            <TextField
              label="Title"
              required
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <TextField
              as="textarea"
              label="Your opinion or question"
              required
              textareaRows={7}
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
            <Alert tone="info">
              Your display name stays as <strong>{post.displayName}</strong> and cannot be changed after
              posting.
            </Alert>
          </form>
        )}
      </Modal>
    </div>
  )
}
