import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import { PageLoader } from '../components/Spinner'
import { EmptyState } from '../components/Feedback'
import { categoryColorClass, genderLabel, pluralize, timeAgo } from '../lib/utils'

const OTHER = '__OTHER__'

/** Pulls the student's saved class / interests out of their onboarding answers. */
function useMyAnswers() {
  const [answers, setAnswers] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/onboarding/my-answers')
      .then(({ data }) => {
        if (!cancelled) setAnswers(data)
      })
      .catch(() => {
        if (!cancelled) setAnswers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return answers
}

export default function Dashboard() {
  const { user, isAdmin, isEmployee } = useAuth()
  const myAnswers = useMyAnswers()

  const [classes, setClasses] = useState([])
  const [featured, setFeatured] = useState([])
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get('/careers/classes'),
      api.get('/careers/items', { params: { sort: 'title' } }),
      api.get('/discussions/posts', { params: { size: 4 } }),
      api.get('/discussions/categories'),
    ])
      .then(([classRes, itemRes, postRes, catRes]) => {
        if (cancelled) return
        setClasses(classRes.data)
        setStats({ totalItems: itemRes.data.length, categories: catRes.data.length })

        const first = postRes.data.content?.[0] ?? {}
        const recent = postRes.data.content ?? []
        setPosts(recent)

        // Show a spread of careers from every class rather than one long list.
        const byClass = new Map()
        itemRes.data.forEach((item) => {
          if (!byClass.has(item.className)) byClass.set(item.className, [])
          byClass.get(item.className).push(item)
        })
        const spread = []
        byClass.forEach((items) => spread.push(items[0]))
        setFeatured(spread.slice(0, 6))
        void first
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <PageLoader label="Loading your dashboard..." />

  // The class and interest answers the student gave during onboarding.
  const classAnswer = myAnswers?.find((a) => a.answerType === 'SINGLE_CHOICE')
  const interestAnswer = myAnswers?.find((a) => a.answerType === 'MULTI_CHOICE')

  const chosenClass = classAnswer
    ? classAnswer.options?.[0] === OTHER
      ? classAnswer.text || 'Others'
      : classAnswer.options?.[0] || '-'
    : '-'

  const interests = interestAnswer?.options?.filter((o) => o !== OTHER) ?? []
  const recommendedClass = classes.find((c) => c.name === chosenClass)

  return (
    <div className="container-page py-10">
      {/* header */}
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-sm font-medium text-brand-200">
              {isAdmin ? 'Administrator' : isEmployee ? 'Employee' : 'Student dashboard'}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
              Hello, {user.firstName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-100">
              {isEmployee
                ? 'Your employee account is active. Employee permissions are not enabled yet, so your view is limited to the dashboard for now.'
                : 'Pick a class in the Career Tree to sort every pathway that is actually reachable from where you are today.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/career-tree" className="btn bg-white text-brand-800 hover:bg-brand-50">
                Open Career Tree
              </Link>
              <Link
                to="/discussion"
                className="btn border border-brand-400 text-white hover:bg-brand-800"
              >
                Ask the community
              </Link>
            </div>
          </div>
        </div>

        <dl className="grid divide-y divide-slate-100 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[
            { label: 'Career pathways', value: stats?.totalItems ?? '—', to: '/career-tree' },
            { label: 'Class filters', value: classes.length || '—', to: '/career-tree' },
            { label: 'Discussion categories', value: stats?.categories ?? '—', to: '/discussion' },
            { label: 'Your class', value: chosenClass, to: '/profile' },
          ].map((item) => (
            <div key={item.label} className="px-6 py-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</dt>
              <dd className="mt-1 truncate text-xl font-bold text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-8 lg:col-span-2">
          {/* your profile summary */}
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Your onboarding answers</h2>
              <Link to="/profile" className="btn-ghost btn-sm">
                Edit
              </Link>
            </div>

            {myAnswers === null ? (
              <div className="mt-4 space-y-2">
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-2/3" />
              </div>
            ) : myAnswers.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                You have not answered the onboarding questions yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Class</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{chosenClass}</p>
                  {recommendedClass?.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{recommendedClass.description}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interests</p>
                  {interests.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">No interests selected.</p>
                  )}
                </div>

                {classAnswer?.text && classAnswer.options?.[0] === OTHER && (
                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      What you told us
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{classAnswer.text}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* recent discussions */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Latest discussions</h2>
              <Link to="/discussion" className="link text-sm">
                View all
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon="💬"
                  title="No discussions yet"
                  action={
                    <Link to="/discussion" className="btn-primary mt-2">
                      Start the first one
                    </Link>
                  }
                >
                  Be the first to ask a question. Other students will see only your first name.
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link to={`/discussion/${post.id}`} className="card-hover block p-4">
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
                          {post.displayName} · {timeAgo(post.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold text-slate-900">{post.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{post.body}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {pluralize(post.replyCount, 'reply', 'replies')}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* side column */}
        <aside className="space-y-8">
          {/* quick actions */}
          <section className="card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quick actions</h2>
            <div className="mt-4 space-y-2">
              {[
                { to: '/career-tree', icon: '🌳', label: 'Career Tree', hint: 'Filter by your class' },
                { to: '/discussion', icon: '💬', label: 'Discussion', hint: 'Ask or answer' },
                { to: '/profile', icon: '👤', label: 'My profile', hint: 'Details and password' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="text-xl" aria-hidden="true">
                    {action.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                    <span className="block text-xs text-slate-500">{action.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* a career from each class */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">One from each class</h2>
            <ul className="mt-4 space-y-3">
              {featured.map((item) => (
                <li key={item.id}>
                  <Link to={`/career-tree/${item.id}`} className="card-hover block p-4">
                    <span className="badge bg-slate-100 text-slate-600">{item.className}</span>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* account */}
          <section className="card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Your account</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ['Name', user.fullName],
                ['Email', user.email],
                ['Contact', user.contactNumber],
                ['Gender', genderLabel(user.gender)],
                ['Role', user.role.charAt(0) + user.role.slice(1).toLowerCase()],
                ['Email verified', user.emailVerified ? 'Yes' : 'Not yet'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">{label}</dt>
                  <dd className="truncate text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
