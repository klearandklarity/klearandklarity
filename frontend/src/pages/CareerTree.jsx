import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import { EmptyState } from '../components/Feedback'
import { pluralize } from '../lib/utils'

const SORTS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: 'title_desc', label: 'Name (Z-A)' },
  { value: 'class', label: 'By class' },
  { value: 'newest', label: 'Recently added' },
]

const OTHER = '__OTHER__'

export default function CareerTree() {
  const { user } = useAuth()

  const [classes, setClasses] = useState([])
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // classId null means "All classes"
  const [classId, setClassId] = useState(null)
  // The onboarding jump below must happen once, otherwise choosing "All classes" would set
  // classId back to null and immediately re-apply the stored answer.
  const onboardingApplied = useRef(false)
  const [selectedCategories, setSelectedCategories] = useState([])
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sort, setSort] = useState('title')

  // Debounce the search box so we are not firing a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    Promise.all([api.get('/careers/classes'), api.get('/careers/categories')])
      .then(([classRes, catRes]) => {
        if (cancelled) return
        setClasses(classRes.data)
        setCategories(catRes.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { sort }
      if (classId) params.classId = classId
      if (selectedCategories.length) params.categories = selectedCategories
      if (debounced) params.search = debounced

      const { data } = await api.get('/careers/items', { params })
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [classId, selectedCategories, debounced, sort])

  useEffect(() => {
    load()
  }, [load])

  // Jump straight to the class the student picked during onboarding, once on first load.
  useEffect(() => {
    if (onboardingApplied.current || !user || !classes.length) return
    let cancelled = false
    api
      .get('/onboarding/my-answers')
      .then(({ data }) => {
        if (cancelled) return
        const classAnswer = data.find((a) => a.answerType === 'SINGLE_CHOICE')
        if (!classAnswer?.options?.length) return

        const isOther = classAnswer.options[0] === OTHER
        const chosen = isOther ? classAnswer.text : classAnswer.options[0]
        if (!chosen) return

        const match =
          classes.find((c) => c.name.toLowerCase() === chosen.trim().toLowerCase()) ??
          // A free-text class never matches a name, so send those students to Others.
          (isOther ? classes.find((c) => c.code === 'OTHERS') : undefined)

        if (match) setClassId(match.id)
      })
      .catch(() => {})
      .finally(() => {
        onboardingApplied.current = true
      })
    return () => {
      cancelled = true
    }
  }, [classes, user])

  const toggleCategory = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    )
  }

  const clearAll = () => {
    setClassId(null)
    setSelectedCategories([])
    setSearch('')
    setSort('title')
  }

  const activeFilterCount =
    (classId ? 1 : 0) + selectedCategories.length + (debounced ? 1 : 0) + (sort !== 'title' ? 1 : 0)

  const activeClassName = classes.find((c) => c.id === classId)?.name

  /* ------------------------------------------------------------ sidebar */

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Class</h2>
          {classId !== null && (
            <button
              type="button"
              onClick={() => setClassId(null)}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <ul className="mt-3 space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => setClassId(null)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                classId === null
                  ? 'bg-brand-700 font-semibold text-white'
                  : 'font-medium text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All classes</span>
              <span
                className={`text-xs ${classId === null ? 'text-brand-100' : 'text-slate-400'}`}
              >
                {classes.reduce((sum, c) => sum + c.itemCount, 0)}
              </span>
            </button>
          </li>

          {classes.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setClassId(item.id === classId ? null : item.id)}
                aria-pressed={classId === item.id}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  classId === item.id
                    ? 'bg-brand-700 font-semibold text-white'
                    : 'font-medium text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <span className={`text-xs ${classId === item.id ? 'text-brand-100' : 'text-slate-400'}`}>
                  {item.itemCount}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {activeClassName && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
            {classes.find((c) => c.id === classId)?.description}
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Category</h2>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((name) => {
              const active = selectedCategories.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-5">
        <label htmlFor="career-sort" className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Sort by
        </label>
        <select
          id="career-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input mt-3"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {activeFilterCount > 0 && (
        <button type="button" onClick={clearAll} className="btn-secondary w-full">
          Reset all filters
        </button>
      )}
    </div>
  )

  /* ------------------------------------------------------------ render */

  return (
    <div className="container-page py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Career Tree</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Choose a class on the left and the list sorts to the pathways that are actually reachable from
          where you are. Open any item to see subjects, skills, exams, jobs, cost and growth.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-5 scroll-thin">
            {filterPanel}
          </div>
        </aside>

        <div>
          {/* search + mobile filter button */}
          <div className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 3.42 9.81l3.63 3.64a.75.75 0 1 0 1.06-1.06l-3.64-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search careers, skills or subjects..."
                  aria-label="Search careers"
                  className="input pl-10"
                />
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
                className="btn-secondary lg:hidden"
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* mobile filter panel */}
            {filtersOpen && (
              <div className="mt-4 animate-[popIn_.15s_ease-out] border-t border-slate-200 pt-4 lg:hidden">
                {filterPanel}
              </div>
            )}

            {activeFilterCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-medium text-slate-500">Active:</span>
                {activeClassName && (
                  <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">{activeClassName}</span>
                )}
                {selectedCategories.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCategory(name)}
                    className="badge bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                  >
                    {name} ×
                  </button>
                ))}
                {debounced && (
                  <span className="badge bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                    "{debounced}"
                  </span>
                )}
              </div>
            )}
          </div>

          {/* results */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {loading ? 'Loading...' : pluralize(items.length, 'career')}
              {activeClassName && !loading && ` in ${activeClassName}`}
            </p>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-28 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="🔍"
                title="No careers match these filters"
                action={
                  <button type="button" onClick={clearAll} className="btn-primary mt-2">
                    Reset filters
                  </button>
                }
              >
                {activeClassName && activeClassName === 'PG'
                  ? 'There are no postgraduate items in the library yet. Our admin team adds them as they are verified.'
                  : 'Try a different class, clear the category filter, or search for something broader.'}
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link to={`/career-tree/${item.id}`} className="card-hover block p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                        {item.className}
                      </span>
                      <span className="badge bg-slate-100 text-slate-600">{item.category}</span>
                      {item.duration && (
                        <span className="text-xs text-slate-500">{item.duration}</span>
                      )}
                    </div>

                    <h2 className="mt-2.5 text-lg font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>

                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                      View pathway
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
