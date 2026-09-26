import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { useSubmit } from '../../lib/auth'
import { PageLoader } from '../../components/Spinner'
import { Alert, EmptyState } from '../../components/Feedback'
import { TextField, Checkbox, ChoiceField } from '../../components/Form'
import Modal from '../../components/Modal'
import { ButtonSpinner } from '../../components/Spinner'
import {
  CATEGORY_COLOR_KEYS,
  categoryColorClass,
  formatDateTime,
  pluralize,
} from '../../lib/utils'

const PAGE_SIZE = 10

function CategoryForm({ initial, onCancel, onSave, busy, error }) {
  const [form, setForm] = useState(
    initial ?? { name: '', description: '', color: 'blue', sortOrder: 0, active: true },
  )
  const [localError, setLocalError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setLocalError('')
    if (!form.name.trim()) {
      setLocalError('The category name is required.')
      return
    }
    onSave({
      name: form.name,
      description: form.description || null,
      color: form.color || 'blue',
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {(error || localError) && <Alert tone="error">{error || localError}</Alert>}

      <TextField
        label="Category name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Career doubts"
      />
      <TextField
        label="Description"
        as="textarea"
        textareaRows={2}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        hint="Optional. Shown to students as guidance for this category."
      />

      <div>
        <span className="label">Badge colour</span>
        <ChoiceField
          options={CATEGORY_COLOR_KEYS.map((key) => ({
            value: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
          }))}
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
          columns={2}
        />
        <p
          className={`badge mt-2 inline-flex ${categoryColorClass(form.color)}`}
        >
          Preview
        </p>
      </div>

      <TextField
        label="Sort order"
        type="number"
        value={form.sortOrder}
        onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
        hint="Lower numbers appear first."
      />

      <Checkbox
        label="Active"
        description="Inactive categories are hidden from students, but their posts stay."
        checked={form.active}
        onChange={(active) => setForm({ ...form, active })}
      />

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <ButtonSpinner label="Saving..." /> : 'Save category'}
        </button>
      </div>
    </form>
  )
}

export default function AdminDiscussion() {
  const { busy, error, run } = useSubmit()

  const [categories, setCategories] = useState(null)
  const [page, setPage] = useState(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/discussion/categories')
      setCategories(data)
    } catch {
      setCategories([])
    }
  }, [])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/discussions/posts', {
        params: { page: pageIndex, size: PAGE_SIZE },
      })
      setPage(data)
    } catch {
      setPage(null)
    } finally {
      setLoading(false)
    }
  }, [pageIndex])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const save = async (payload) => {
    const isEdit = Boolean(editing?.id)
    const result = await run(() =>
      isEdit
        ? api.put(`/admin/discussion/categories/${editing.id}`, payload)
        : api.post('/admin/discussion/categories', payload),
    )
    if (result) {
      setEditing(null)
      await loadCategories()
      await loadPosts()
      flash(isEdit ? 'Category updated.' : 'Category added.')
    }
  }

  const removeCategory = async (row) => {
    if (
      !window.confirm(
        `Delete "${row.name}"? It has ${pluralize(row.postCount, 'post')}. Those posts cannot be recovered.`,
      )
    ) {
      return
    }
    const result = await run(() => api.delete(`/admin/discussion/categories/${row.id}`))
    if (result) {
      await loadCategories()
      await loadPosts()
      flash('Category deleted.')
    }
  }

  const setPinned = async (post, pinned) => {
    const result = await run(() =>
      api.patch(`/discussions/posts/${post.id}/pin`, null, { params: { pinned } }),
    )
    if (result) {
      await loadPosts()
      flash(pinned ? 'Post pinned to the top.' : 'Post unpinned.')
    }
  }

  const deletePost = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const result = await run(() => api.delete(`/discussions/posts/${post.id}`))
    if (result) {
      await loadPosts()
      await loadCategories()
      flash('Post deleted.')
    }
  }

  const posts = page?.content ?? []

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Discussion</h2>
        <p className="mt-1 text-sm text-slate-600">
          Define the categories students can post in, then moderate the posts themselves.
        </p>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {/* categories */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Categories</h3>
          <button type="button" onClick={() => setEditing({})} className="btn-secondary btn-sm">
            + Add category
          </button>
        </div>

        {!categories ? (
          <PageLoader label="Loading categories..." />
        ) : categories.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No categories yet. Students cannot post until you add one.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {categories.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ring-1 ${categoryColorClass(row.color)}`}>{row.name}</span>
                    {!row.active && (
                      <span className="badge bg-slate-200 text-slate-600">Hidden</span>
                    )}
                    <span className="text-xs text-slate-500">
                      {pluralize(row.postCount, 'post')} &middot; order {row.sortOrder}
                    </span>
                  </div>
                  {row.description && (
                    <p className="mt-1 text-xs text-slate-500">{row.description}</p>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="btn-ghost btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(row)}
                    className="btn-ghost btn-sm text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* posts */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Posts {page && `(${page.totalElements})`}
        </h3>

        {loading ? (
          <PageLoader label="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState icon="💬" title="No posts yet">
            Student posts will appear here for moderation.
          </EmptyState>
        ) : (
          <>
            <ul className="space-y-3">
              {posts.map((post) => (
                <li key={post.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.pinned && (
                          <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                            📌 Pinned
                          </span>
                        )}
                        <span className={`badge ring-1 ${categoryColorClass(post.categoryColor)}`}>
                          {post.categoryName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {post.displayName} &middot; {formatDateTime(post.createdAt)}
                        </span>
                      </div>

                      <Link
                        to={`/discussion/${post.id}`}
                        className="mt-2 block font-bold text-slate-900 hover:text-brand-700"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.body}</p>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {pluralize(post.replyCount, 'reply', 'replies')}
                        {post.anonymous && ' · anonymous'}
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPinned(post, !post.pinned)}
                        className="btn-ghost btn-sm"
                      >
                        {post.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePost(post)}
                        className="btn-ghost btn-sm text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {page && page.totalPages > 1 && (
              <div className="flex items-center justify-between">
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
      </section>

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? 'Edit category' : 'Add category'}
        >
          <CategoryForm
            initial={editing.id ? editing : null}
            busy={busy}
            error={error}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        </Modal>
      )}
    </div>
  )
}
