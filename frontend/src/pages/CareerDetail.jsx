import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../lib/api'
import { PageLoader } from '../components/Spinner'
import { Alert } from '../components/Feedback'

/** The dataset fields rendered as titled sections on the detail page. */
const SECTIONS = [
  { key: 'what_is_it', title: 'What is it' },
  { key: 'who_is_it_for', title: 'Who is it for' },
  { key: 'path_after_10th', title: 'Path after Class 10', tree: true },
  { key: 'entrance_exams', title: 'Entrance exams' },
  { key: 'courses', title: 'Courses' },
  { key: 'subjects_you_study', title: 'Subjects you study' },
  { key: 'skills_required', title: 'Skills required' },
  { key: 'specializations', title: 'Specializations' },
  { key: 'jobs_available', title: 'Jobs available' },
  { key: 'higher_studies', title: 'Higher studies' },
  { key: 'career_growth', title: 'Career growth', tree: true },
  { key: 'work_environment', title: 'Work environment' },
  { key: 'scholarship_possibilities', title: 'Scholarship possibilities' },
  { key: 'government_private_opportunities', title: 'Government and private opportunities' },
  { key: 'advantages', title: 'Advantages' },
  { key: 'challenges', title: 'Challenges' },
]

function splitInline(text) {
  if (!text) return []
  return text
    .split(/\s*[→|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function DetailSection({ title, value, tree }) {
  if (!value) return null
  const parts = tree ? splitInline(value) : [value]

  return (
    <section className="border-t border-slate-200 py-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">{title}</h2>

      {tree ? (
        <ol className="mt-3 space-y-2">
          {parts.map((part, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                {index + 1}
              </span>
              <span className="text-sm leading-relaxed text-slate-700">{part}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-700">{value}</p>
      )}
    </section>
  )
}

export default function CareerDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setItem(null)
    setError('')
    api
      .get(`/careers/items/${id}`)
      .then(({ data }) => {
        if (!cancelled) setItem(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? 'Could not load this career.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="container-page py-16">
        <Alert tone="error" title="Career not found">
          {error}
        </Alert>
        <Link to="/career-tree" className="btn-primary mt-4">
          Back to Career Tree
        </Link>
      </div>
    )
  }

  if (!item) return <PageLoader label="Loading pathway..." />

  const detail = item.detail ?? {}
  const facts = [
    { label: 'Class', value: item.className },
    { label: 'Category', value: item.category },
    { label: 'Duration', value: detail.duration ?? item.duration },
    { label: 'Stream', value: detail.which_stream ?? item.stream },
    { label: 'Work environment', value: detail.work_environment ?? item.workStyle },
    { label: 'Approximate cost', value: detail.approx_cost_range_inr },
    { label: 'Last reviewed', value: detail.last_reviewed },
  ].filter((fact) => fact.value)

  return (
    <div className="container-page py-8">
      <nav className="mb-5 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/career-tree" className="hover:text-brand-700">
          Career Tree
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-slate-700">{item.className}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">{item.className}</span>
              <span className="badge bg-slate-100 text-slate-600">{item.category}</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {item.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">{item.description}</p>

            {detail.simple_explanation_for_student && (
              <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                  In one line
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-900">
                  {detail.simple_explanation_for_student}
                </p>
              </div>
            )}
          </header>

          {/* interest tags */}
          {item.interestTags?.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Skills and interests
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {item.interestTags.map((tag) => (
                  <span key={tag} className="badge bg-slate-100 text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card mt-8 px-6 py-2">
            {SECTIONS.map((section) => (
              <DetailSection
                key={section.key}
                title={section.title}
                value={detail[section.key]}
                tree={section.tree}
              />
            ))}
          </div>

          {detail.mvp_status && (
            <div className="mt-6">
              <Alert tone="warning" title="Verify before you decide">
                {detail.mvp_status}
              </Alert>
            </div>
          )}
        </div>

        {/* facts sidebar */}
        <aside className="space-y-6">
          <div className="card sticky top-24 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">At a glance</h2>
            <dl className="mt-3 space-y-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs text-slate-500">{fact.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <Link to="/discussion" className="btn-primary mt-5 w-full">
              Ask a doubt
            </Link>
            <Link to="/career-tree" className="btn-secondary mt-2 w-full">
              Back to tree
            </Link>
          </div>

          {item.classDescription && (
            <div className="card p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">About this class</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.classDescription}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
