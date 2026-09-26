import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'

const FEATURES = [
  {
    icon: '🌳',
    title: 'Career Tree',
    body: 'Pick your class and instantly sort 160+ career pathways. Filter by class, search by name, then open any item to see subjects, skills, exams, jobs, cost and growth.',
  },
  {
    icon: '📝',
    title: 'Quick onboarding',
    body: 'Two questions on your first login: which class you are in, and what you are interested in. Your answers reach the admin panel so support can be targeted.',
  },
  {
    icon: '💬',
    title: 'Anonymous discussion',
    body: 'Ask anything between students who do not know each other. Posts show a first name only, or stay fully anonymous. No emails, no phone numbers, no profiles.',
  },
  {
    icon: '🛡️',
    title: 'Admin controlled',
    body: 'Admins manage the onboarding questions, career items, discussion categories and site content, and can see every registration from one panel.',
  },
]

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Name, contact number, email and gender. It takes under a minute and we never log you in automatically.' },
  { n: '02', title: 'Answer two questions', body: 'Tell us your class and what you are interested in. This shapes what the Career Tree shows you first.' },
  { n: '03', title: 'Explore your careers', body: 'Filter the Career Tree by class, read the full pathway for anything that interests you.' },
  { n: '04', title: 'Ask the community', body: 'Post a doubt in the Discussion. Someone has almost certainly been through the same thing.' },
]

const CLASSES = [
  { name: '10th', count: 'Short skill courses you can start right away', tone: 'bg-brand-50 text-brand-800 ring-brand-200' },
  { name: 'Inter/Diploma', count: 'ITI trades, polytechnic and diploma pathways', tone: 'bg-indigo-50 text-indigo-800 ring-indigo-200' },
  { name: 'UG', count: "Bachelor's degree programmes after Class 12", tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  { name: 'PG', count: 'Postgraduate and research qualifications', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { name: 'Others', count: 'Open school, distance learning, exams and flexible routes', tone: 'bg-rose-50 text-rose-800 ring-rose-200' },
]

export default function Home() {
  const { isLoggedIn, needsOnboarding } = useAuth()
  const { companyName, tagline } = useSettings()

  const primaryCta = isLoggedIn
    ? needsOnboarding
      ? { to: '/onboarding', label: 'Finish your profile' }
      : { to: '/dashboard', label: 'Go to dashboard' }
    : { to: '/register', label: 'Create free account' }

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-50">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-page relative py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="badge bg-white text-brand-700 ring-1 ring-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Free for every student
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
                {tagline || 'Career clarity for every student.'}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {companyName} turns a huge career dataset into three simple tools. Filter 160+ pathways by
                the class you are actually in, read exactly what each one involves, and ask questions of
                other students without anyone finding out who you are.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={primaryCta.to} className="btn-primary px-6 py-3 text-base">
                  {primaryCta.label}
                </Link>
                <Link to="/career-tree" className="btn-secondary px-6 py-3 text-base">
                  Browse the Career Tree
                </Link>
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
                {[
                  { value: '160+', label: 'Career pathways' },
                  { value: '6', label: 'Categories' },
                  { value: '0', label: 'Profile leaks' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-2xl font-bold text-brand-700">{stat.value}</dt>
                    <dd className="mt-0.5 text-xs text-slate-500">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* preview card */}
            <div className="relative">
              <div className="card p-6 shadow-xl shadow-brand-900/5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Filter by class</p>
                  <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">Career Tree</span>
                </div>

                <ul className="mt-4 space-y-2">
                  {CLASSES.map((item, index) => (
                    <li
                      key={item.name}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ring-1 ${item.tone} ${
                        index === 0 ? 'ring-2' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="truncate text-xs opacity-80">{item.count}</p>
                      </div>
                      <svg className="h-4 w-4 shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discussion</p>
                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    "Is BCA worth it if I want software development?"
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-600">
                      A
                    </span>
                    <span className="text-xs text-slate-500">Aarav · 12 min ago</span>
                    <span className="badge bg-slate-200 text-slate-600">Stream Selection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="container-page py-20">
        <div className="max-w-2xl">
          <h2 className="section-title">Everything built around one question</h2>
          <p className="mt-3 text-slate-600">
            "What should I do after Class 10?" Everything here exists to make that question easier to answer.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card-hover p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="section-title">How it works</h2>
            <p className="mt-3 text-slate-600">Four steps, no hidden steps in between.</p>
          </div>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="text-sm font-bold text-brand-600">{step.n}</span>
                <h3 className="mt-2 text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* honesty band */}
      <section className="container-page py-20">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-8 lg:grid-cols-2 lg:p-10">
            <div>
              <h2 className="section-title">We tell you what we actually know</h2>
              <p className="mt-3 text-slate-600">
                Fees, exam dates, scholarship deadlines and eligibility rules change every year. We do not
                publish them as permanent facts. Instead each career page shows you the general pathway and
                tells you exactly which official source to check before you decide.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                'Every pathway shows subjects, skills, exams, jobs, cost range and growth path.',
                'Time-sensitive details are flagged so you verify them yourself.',
                'Nothing is shown about a student except a first name, and only if they choose to.',
                'Admins can correct or remove any career item, so wrong content gets fixed.',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm text-slate-700">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06L8.75 12.19l6.97-6.97a.75.75 0 0 1 1.06.007Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* cta */}
      {!isLoggedIn && (
        <section className="container-page pb-20">
          <div className="rounded-3xl bg-brand-700 px-8 py-14 text-center shadow-lg shadow-brand-900/10">
            <h2 className="text-3xl font-bold text-white">Start figuring it out today</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Create a free account, answer two questions, and see the careers that actually match the class
              you are in.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="btn bg-white px-6 py-3 text-base text-brand-800 hover:bg-brand-50"
              >
                Create free account
              </Link>
              <Link
                to="/about"
                className="btn border border-brand-400 px-6 py-3 text-base text-white hover:bg-brand-800"
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
