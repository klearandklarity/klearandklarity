import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth, useSubmit } from '../lib/auth'
import { Alert, EmptyState } from '../components/Feedback'
import { TextField, Checkbox } from '../components/Form'
import Modal from '../components/Modal'
import { ButtonSpinner } from '../components/Spinner'
import { categoryColorClass, pluralize, timeAgo } from '../lib/utils'

const PAGE_SIZE = 12

function PostCard({ post }) {
  return (
    <li>
      <Link to={`/discussion/${post.id}`} className="card-hover block p-5">
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && (
            <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">📌 Pinned</span>
          )}
          <span className={`badge ring-1 ${categoryColorClass(post.categoryColor)}`}>{post.categoryName}</span>
          <span className="text-xs text-slate-500">
            {post.displayName} · {timeAgo(post.createdAt)}
          </span>
        </div>

        <h2 className="mt-2.5 text-base font-bold text-slate-900">{post.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{post.body}</p>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>💬 {pluralize(post.replyCount, 'reply', 'replies')}</span>
          {post.mine && <span className="font-semibold text-brand-700">Your post</span>}
        </div>
      </Link>
    </li>
  )
}

export default function Discussion() {
  const { isLoggedIn, isAdmin } = useAuth()
  const { busy, error, setError, fields, clearField, run } = useSubmit()

  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [categoryId, setCategoryId] = useState(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const [composerOpen, setComposerOpen] = useState(false)
  const [form, setForm] = useState({ categoryId: '', title: '', body: '', anonymous: false })
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api
      .get('/discussions/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: pageIndex, size: PAGE_SIZE }
      if (categoryId) params.categoryId = categoryId
      if (debounced) params.search = debounced
      const { data } = await api.get('/discussions/posts', { params })
      setPage(data)
    } catch {
      setPage(null)
    } finally {
      setLoading(false)
    }
  }, [pageIndex, categoryId, debounced])

  useEffect(() => {
    load()
  }, [load])

  // Any filter change starts again from the first page.
  const applyCategory = (id) => {
    setCategoryId(id)
    setPageIndex(0)
  }

  const applySearch = (value) => {
    setSearch(value)
    setPageIndex(0)
  }

  const openComposer = () => {
    setForm({
      categoryId: categoryId ? String(categoryId) : categories[0] ? String(categories[0].id) : '',
      title: '',
      body: '',
      anonymous: false,
    })
    setFormError('')
    setError('')
    setComposerOpen(true)
  }

  const submitPost = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.categoryId) {
      setFormError('Please choose a category.')
      return
    }

    const result = await run(() =>
      api.post('/discussions/posts', {
        categoryId: Number(form.categoryId),
        title: form.title,
        body: form.body,
        anonymous: form.anonymous,
      }),
    )

    if (result) {
      setComposerOpen(false)
      setToast('Your post is live. Only your first name is shown.')
      setTimeout(() => setToast(''), 4000)
      setPageIndex(0)
      load()
    }
  }

  const posts = page?.content ?? []
  const activeCategoryName = categories.find((c) => c.id === categoryId)?.name

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Discussion</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Talk to students you have never met. Posts show your first name only, or nothing at all if you
            tick the anonymous box.
          </p>
        </div>
        {isLoggedIn && (
          <button type="button" onClick={openComposer} className="btn-primary">
            + New post
          </button>
        )}
      </header>

      {toast && (
        <div className="mb-4">
          <Alert tone="success">{toast}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* category filter */}
        <aside>
          <div className="card sticky top-24 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Categories</h2>

            <ul className="mt-3 space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => applyCategory(null)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    categoryId === null
                      ? 'bg-brand-700 font-semibold text-white'
                      : 'font-medium text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All categories
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => applyCategory(category.id === categoryId ? null : category.id)}
                    aria-pressed={categoryId === category.id}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      categoryId === category.id
                        ? 'bg-brand-700 font-semibold text-white'
                        : 'font-medium text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>

            {categories.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">
                No categories yet. Ask an admin to add one.
              </p>
            )}

            <div className="mt-5 border-t border-slate-200 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Search</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => applySearch(e.target.value)}
                placeholder="Search posts..."
                aria-label="Search posts"
                className="input mt-2.5"
              />
            </div>

            {(activeCategoryName || debounced) && (
              <button
                type="button"
                onClick={() => {
                  applyCategory(null)
                  applySearch('')
                }}
                className="btn-secondary mt-4 w-full"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* posts */}
        <div>
          <p className="mb-3 text-sm text-slate-600">
            {loading ? 'Loading...' : pluralize(page?.totalElements ?? 0, 'post')}
            {activeCategoryName && ` in ${activeCategoryName}`}
            {debounced && ` matching "${debounced}"`}
          </p>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-32 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon="💬"
              title="Nothing here yet"
              action={
                isLoggedIn ? (
                  <button type="button" onClick={openComposer} className="btn-primary mt-2">
                    Write the first post
                  </button>
                ) : (
                  <Link to="/login" className="btn-primary mt-2">
                    Log in to post
                  </Link>
                )
              }
            >
              {debounced || activeCategoryName
                ? 'No posts match this filter. Try clearing it.'
                : 'Be the first to start a conversation in this category.'}
            </EmptyState>
          ) : (
            <>
              <ul className="space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </ul>

              {page && page.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
                    disabled={pageIndex === 0}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {pageIndex + 1} of {page.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPageIndex((p) => Math.min(p + 1, page.totalPages - 1))}
                    disabled={page.last}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* composer */}
      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        title="Start a discussion"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setComposerOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="new-post-form" disabled={busy} className="btn-primary">
              {busy ? <ButtonSpinner label="Posting..." /> : 'Post'}
            </button>
          </>
        }
      >
        <form id="new-post-form" onSubmit={submitPost} className="space-y-5" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          {formError && <Alert tone="error">{formError}</Alert>}

          {categories.length === 0 ? (
            <Alert tone="warning" title="No categories available">
              An admin needs to add at least one discussion category before you can post.
            </Alert>
          ) : (
            <>
              <div>
                <label htmlFor="post-category" className="label">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="post-category"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="input"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {fields.categoryId && <p className="field-error">{fields.categoryId}</p>}
              </div>

              <TextField
                label="Title"
                required
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value })
                  clearField('title')
                }}
                error={fields.title}
                placeholder="Ask a clear, specific question"
                maxLength={250}
              />

              <TextField
                as="textarea"
                label="Your opinion or question"
                required
                textareaRows={7}
                value={form.body}
                onChange={(e) => {
                  setForm({ ...form, body: e.target.value })
                  clearField('body')
                }}
                error={fields.body}
                hint="At least 10 characters. Share what you have already tried if it helps."
                placeholder="I am in Class 10 and confused between..."
              />

              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <Checkbox
                  label="Post anonymously"
                  description="Your name is replaced with 'Anonymous'. Nobody can tell it is you."
                  checked={form.anonymous}
                  onChange={(checked) => setForm({ ...form, anonymous: checked })}
                />
                <p className="mt-2.5 text-xs text-slate-500">
                  Either way, only your <strong>first name</strong> is ever shown. Your email, contact
                  number and profile are never visible to other students.
                </p>
              </div>

              {isAdmin && (
                <Alert tone="info">
                  As an admin you can pin or delete any post from the Admin Panel.
                </Alert>
              )}
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
