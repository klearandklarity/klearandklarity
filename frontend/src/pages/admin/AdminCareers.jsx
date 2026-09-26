import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import { useSubmit } from '../../lib/auth'
import { PageLoader } from '../../components/Spinner'
import { Alert, EmptyState } from '../../components/Feedback'
import { TextField, Checkbox } from '../../components/Form'
import Modal from '../../components/Modal'
import { ButtonSpinner } from '../../components/Spinner'
import { pluralize } from '../../lib/utils'

/** The long-form fields the detail page renders, in the order it renders them. */
const DETAIL_FIELDS = [
  { key: 'simple_explanation_for_student', label: 'In one line', rows: 2 },
  { key: 'what_is_it', label: 'What is it', rows: 4 },
  { key: 'who_is_it_for', label: 'Who is it for', rows: 3 },
  { key: 'path_after_10th', label: 'Path after Class 10 (use → to separate steps)', rows: 3 },
  { key: 'entrance_exams', label: 'Entrance exams', rows: 3 },
  { key: 'courses', label: 'Courses', rows: 3 },
  { key: 'subjects_you_study', label: 'Subjects you study', rows: 3 },
  { key: 'skills_required', label: 'Skills required', rows: 3 },
  { key: 'specializations', label: 'Specializations', rows: 3 },
  { key: 'jobs_available', label: 'Jobs available', rows: 3 },
  { key: 'higher_studies', label: 'Higher studies', rows: 3 },
  { key: 'career_growth', label: 'Career growth (use → to separate steps)', rows: 3 },
  { key: 'work_environment', label: 'Work environment', rows: 2 },
  { key: 'scholarship_possibilities', label: 'Scholarship possibilities', rows: 3 },
  {
    key: 'government_private_opportunities',
    label: 'Government and private opportunities',
    rows: 3,
  },
  { key: 'advantages', label: 'Advantages', rows: 3 },
  { key: 'challenges', label: 'Challenges', rows: 3 },
  { key: 'approx_cost_range_inr', label: 'Approximate cost (INR)', rows: 1 },
  { key: 'last_reviewed', label: 'Last reviewed', rows: 1 },
  { key: 'mvp_status', label: 'Verification note', rows: 2 },
]

const emptyItem = (classId) => ({
  title: '',
  classId: classId ?? '',
  category: '',
  description: '',
  duration: '',
  stream: '',
  difficulty: '',
  workStyle: '',
  interestTags: '',
  active: true,
  detail: {},
})

function ItemForm({ initial, classes, onCancel, onSave, busy, error }) {
  const [item, setItem] = useState(() => ({ ...emptyItem(classes[0]?.id), ...initial }))
  const [localError, setLocalError] = useState('')

  const setDetail = (key, value) => {
    setItem((prev) => {
      const detail = { ...(prev.detail ?? {}) }
      if (value.trim()) detail[key] = value.trim()
      else delete detail[key]
      return { ...prev, detail }
    })
  }

  const submit = (e) => {
    e.preventDefault()
    setLocalError('')
    if (!item.title.trim()) {
      setLocalError('The title is required.')
      return
    }
    if (!item.classId) {
      setLocalError('Choose a class.')
      return
    }
    if (!item.category.trim()) {
      setLocalError('The category is required.')
      return
    }
    if (!item.description.trim()) {
      setLocalError('The description is required.')
      return
    }

    onSave({
      title: item.title,
      classId: Number(item.classId),
      category: item.category,
      description: item.description,
      stream: item.stream || null,
      duration: item.duration || null,
      difficulty: item.difficulty || null,
      workStyle: item.workStyle || null,
      interestTags: item.interestTags || null,
      active: item.active,
      detail: item.detail ?? {},
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {(error || localError) && <Alert tone="error">{error || localError}</Alert>}

      <TextField
        label="Title"
        required
        value={item.title}
        onChange={(e) => setItem({ ...item, title: e.target.value })}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="item-class" className="label">
            Class <span className="text-rose-500">*</span>
          </label>
          <select
            id="item-class"
            value={item.classId}
            onChange={(e) => setItem({ ...item, classId: e.target.value })}
            className="input"
          >
            {classes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <TextField
          label="Category"
          required
          value={item.category}
          onChange={(e) => setItem({ ...item, category: e.target.value })}
          placeholder="e.g. Medical"
        />

        <TextField
          label="Duration"
          value={item.duration}
          onChange={(e) => setItem({ ...item, duration: e.target.value })}
          placeholder="e.g. 5.5 years"
        />

        <TextField
          label="Stream"
          value={item.stream}
          onChange={(e) => setItem({ ...item, stream: e.target.value })}
        />

        <TextField
          label="Difficulty"
          value={item.difficulty}
          onChange={(e) => setItem({ ...item, difficulty: e.target.value })}
        />

        <TextField
          label="Work environment"
          value={item.workStyle}
          onChange={(e) => setItem({ ...item, workStyle: e.target.value })}
        />
      </div>

      <TextField
        label="Description"
        required
        as="textarea"
        textareaRows={3}
        value={item.description}
        onChange={(e) => setItem({ ...item, description: e.target.value })}
        hint="One or two sentences. This is what students read in the Career Tree list."
      />

      <TextField
        label="Interest and skill tags"
        value={item.interestTags}
        onChange={(e) => setItem({ ...item, interestTags: e.target.value })}
        hint="Comma separated, e.g. Biology, Patience, Stamina"
      />

      <Checkbox
        label="Visible to students"
        description="Uncheck to hide this item without deleting it."
        checked={item.active}
        onChange={(active) => setItem({ ...item, active })}
      />

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-base font-bold text-slate-900">Detail page content</h3>
        <p className="mt-1 text-sm text-slate-500">
          These blocks appear on the career detail page in this order. Leave a block empty to hide it.
        </p>

        <div className="mt-4 space-y-4">
          {DETAIL_FIELDS.map((field) => (
            <TextField
              key={field.key}
              as="textarea"
              textareaRows={field.rows}
              label={field.label}
              value={item.detail?.[field.key] ?? ''}
              onChange={(e) => setDetail(field.key, e.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <ButtonSpinner label="Saving..." /> : 'Save item'}
        </button>
      </div>
    </form>
  )
}

function ClassForm({ initial, onCancel, onSave, busy, error }) {
  const [form, setForm] = useState(
    initial ?? { name: '', code: '', description: '', sortOrder: 0 },
  )
  const [localError, setLocalError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setLocalError('')
    if (!form.name.trim() || !form.code.trim()) {
      setLocalError('Both the name and the short code are required.')
      return
    }
    onSave({
      name: form.name,
      code: form.code,
      description: form.description || null,
      sortOrder: Number(form.sortOrder) || 0,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {(error || localError) && <Alert tone="error">{error || localError}</Alert>}

      <TextField
        label="Class name"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. Class 10"
      />
      <TextField
        label="Short code"
        required
        value={form.code}
        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        hint="A unique code such as C10, INTER or PG. Used by the seeder, so do not change it casually."
      />
      <TextField
        label="Description"
        as="textarea"
        textareaRows={2}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <TextField
        label="Sort order"
        type="number"
        value={form.sortOrder}
        onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
        hint="Lower numbers appear first in the Career Tree sidebar."
      />

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <ButtonSpinner label="Saving..." /> : 'Save class'}
        </button>
      </div>
    </form>
  )
}

export default function AdminCareers() {
  const { busy, error, run } = useSubmit()

  const [classes, setClasses] = useState(null)
  const [items, setItems] = useState([])
  const [classFilter, setClassFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loadError, setLoadError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [editingClass, setEditingClass] = useState(null)
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
      if (classFilter !== 'ALL') params.classId = classFilter
      if (debounced) params.search = debounced
      const [classRes, itemRes] = await Promise.all([
        api.get('/admin/career/classes'),
        api.get('/admin/career/items', { params }),
      ])
      setClasses(classRes.data)
      setItems(itemRes.data)
      setLoadError('')
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not load the career library.')
    }
  }, [classFilter, debounced])

  useEffect(() => {
    load()
  }, [load])

  const saveClass = async (payload) => {
    const isEdit = Boolean(editingClass?.id)
    const result = await run(() =>
      isEdit
        ? api.put(`/admin/career/classes/${editingClass.id}`, payload)
        : api.post('/admin/career/classes', payload),
    )
    if (result) {
      setEditingClass(null)
      await load()
      flash(isEdit ? 'Class updated.' : 'Class added.')
    }
  }

  const removeClass = async (row) => {
    if (!window.confirm(`Delete the class "${row.name}"?`)) return
    const result = await run(() => api.delete(`/admin/career/classes/${row.id}`))
    if (result) {
      await load()
      flash('Class deleted.')
    }
  }

  const openItemForEdit = async (id) => {
    try {
      const { data } = await api.get(`/admin/career/items/${id}`)
      setEditingItem({
        id: data.id,
        title: data.title,
        classId: data.classId,
        category: data.category,
        description: data.description,
        duration: data.duration ?? '',
        stream: data.stream ?? '',
        difficulty: data.difficulty ?? '',
        workStyle: data.workStyle ?? '',
        interestTags: (data.interestTags ?? []).join(', '),
        active: data.active,
        detail: data.detail ?? {},
      })
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not open that item.')
    }
  }

  const saveItem = async (payload) => {
    const isEdit = Boolean(editingItem?.id)
    const result = await run(() =>
      isEdit
        ? api.put(`/admin/career/items/${editingItem.id}`, payload)
        : api.post('/admin/career/items', payload),
    )
    if (result) {
      setEditingItem(null)
      await load()
      flash(isEdit ? 'Item updated.' : 'Item added.')
    }
  }

  const removeItem = async (row) => {
    if (!window.confirm(`Delete "${row.title}"?`)) return
    const result = await run(() => api.delete(`/admin/career/items/${row.id}`))
    if (result) {
      await load()
      flash('Item deleted.')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Career library</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage the classes in the filter sidebar and every pathway inside them.
        </p>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {loadError && <Alert tone="error">{loadError}</Alert>}

      {/* classes */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Classes</h3>
          <button type="button" onClick={() => setEditingClass({})} className="btn-secondary btn-sm">
            + Add class
          </button>
        </div>

        {!classes ? (
          <PageLoader label="Loading classes..." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2.5 font-semibold">Name</th>
                  <th className="pb-2.5 font-semibold">Code</th>
                  <th className="pb-2.5 font-semibold">Items</th>
                  <th className="pb-2.5 font-semibold">Order</th>
                  <th className="pb-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2.5 font-medium text-slate-900">{row.name}</td>
                    <td className="py-2.5 text-slate-600">{row.code}</td>
                    <td className="py-2.5 text-slate-600">{row.itemCount}</td>
                    <td className="py-2.5 text-slate-600">{row.sortOrder}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingClass(row)}
                          className="btn-ghost btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeClass(row)}
                          disabled={busy}
                          className="btn-ghost btn-sm text-rose-600 disabled:opacity-40"
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
      </section>

      {/* items */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">Pathways</h3>
          <button
            type="button"
            onClick={() => setEditingItem(emptyItem(classes?.[0]?.id))}
            disabled={!classes?.length}
            className="btn-primary btn-sm disabled:opacity-40"
          >
            + Add pathway
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="item-search" className="label">
                Search
              </label>
              <input
                id="item-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, category or stream"
                className="input"
              />
            </div>
            <div className="sm:w-52">
              <label htmlFor="item-class-filter" className="label">
                Class
              </label>
              <select
                id="item-class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">All classes</option>
                {(classes ?? []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState icon="🌱" title="No pathways match this filter">
            Try a different search term or class.
          </EmptyState>
        ) : (
          <>
            <p className="text-sm text-slate-600">{pluralize(items.length, 'pathway')}</p>

            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Duration</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
                      <td className="px-4 py-3 text-slate-600">{row.className}</td>
                      <td className="px-4 py-3 text-slate-600">{row.category}</td>
                      <td className="px-4 py-3 text-slate-600">{row.duration ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => openItemForEdit(row.id)}
                            className="btn-ghost btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(row)}
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
          </>
        )}
      </section>

      {editingClass && (
        <Modal
          open
          onClose={() => setEditingClass(null)}
          title={editingClass.id ? 'Edit class' : 'Add class'}
        >
          <ClassForm
            initial={editingClass.id ? editingClass : null}
            busy={busy}
            error={error}
            onCancel={() => setEditingClass(null)}
            onSave={saveClass}
          />
        </Modal>
      )}

      {editingItem && classes && (
        <Modal
          open
          onClose={() => setEditingItem(null)}
          title={editingItem.id ? 'Edit pathway' : 'Add pathway'}
          size="xl"
        >
          <ItemForm
            initial={editingItem}
            classes={classes}
            busy={busy}
            error={error}
            onCancel={() => setEditingItem(null)}
            onSave={saveItem}
          />
        </Modal>
      )}
    </div>
  )
}
