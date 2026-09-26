import { Link } from 'react-router-dom'
import { useSettings } from '../lib/settings'
import Logo from '../components/Logo'

const STATS = [
  { value: '163', label: 'career pathways' },
  { value: '5', label: 'stages, Class 10 to PG' },
  { value: '26', label: 'interest tags' },
  { value: '8', label: 'discussion categories' },
]

const FEATURES = [
  {
    title: 'Career Tree',
    body: 'Over 160 pathways from a structured dataset, each with subjects, entrance exams, job roles, cost range and scholarships. Pick your class and the list reorders to what you can actually reach from there.',
    icon: (
      <path d="M12 3v4m0 10v4M5.6 5.6l2.9 2.9m7 7 2.9 2.9M3 12h4m10 0h4M5.6 18.4l2.9-2.9m7-7 2.9-2.9" />
    ),
  },
  {
    title: 'Onboarding questions',
    body: 'Asked once, on your first login. Your class and interests shape the tree, and the answers show admins what students actually need help with. Admins add new options whenever students ask for them.',
    icon: (
      <>
        <path d="M9 11l2 2 4-4" />
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      </>
    ),
  },
  {
    title: 'Student discussion',
    body: 'Categories set by the admin keep posts organised, with search and filters. A first name is all that is ever shown, and one checkbox makes a post fully anonymous.',
    icon: (
      <>
        <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
      </>
    ),
  },
]

const VALUES = [
  {
    title: 'Clarity over hype',
    body: 'An honest pathway with its hard parts beats a glossy promise. Every career page names the challenges as clearly as the advantages.',
    icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    title: 'Privacy by default',
    body: 'The discussion shows a first name and nothing else. No email, no contact number, no profile link, and full anonymity is one checkbox away.',
    icon: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 118 0v3" />
      </>
    ),
  },
  {
    title: 'Fair to every route',
    body: 'ITI, polytechnic, diploma, open school, distance learning and a plain degree all get proper coverage. A skill trade is a real decision, not a fallback.',
    icon: <path d="M12 3v18M5 8h14M5 16h14M3 8l3-5 3 5M15 16l3 5 3-5" />,
  },
  {
    title: 'Corrected in public',
    body: 'Admins add, edit, hide or remove any career item, question or category, so wrong content gets fixed instead of staying online.',
    icon: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
  },
]

const PRIVACY = [
  'Your full name, contact number and email are visible only to you and to the admin.',
  'Discussion posts show your first name only, or "Anonymous" if you tick the box.',
  'We never sell or share student data, and we do not run ads.',
  'You can edit your profile or ask us to delete your account at any time.',
]

function Icon({ children, className = 'h-6 w-6' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export default function About() {
  const { companyName, aboutText, contactEmail } = useSettings()

  const paragraphs = (aboutText ||
    'Students after Class 10 are handed a hundred options and almost no structure. They compare one '
      + 'YouTube video to another, fall for whichever thumbnail looks best, and often settle on a course '
      + 'because a relative mentioned it. Nothing is wrong with that, but it is a very expensive way to '
      + 'make a decision.'
  )
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-brand-950">
        <div
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-page relative py-20 sm:py-24">
          <div className="max-w-3xl">
            <Logo size="lg" showText={false} className="rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-white/20" />

            <p className="mt-8 text-sm font-bold uppercase tracking-widest text-brand-300">About us</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {companyName}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-brand-100">
              A small education project built for one specific moment: the week after Class 10, when
              everyone asks what you want to become and you have no idea how to answer.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/careers" className="btn-primary">
                Explore the Career Tree
              </Link>
              <Link
                to="/register"
                className="btn-secondary border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Create a free account
              </Link>
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/15 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-brand-950/60 px-5 py-6 backdrop-blur-sm">
                <dt className="order-2 mt-1 text-sm text-brand-200">{stat.label}</dt>
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ mission */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Why we built this</p>
            <h2 className="mt-2 section-title">One confusing decision, made manageable</h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-700">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">At a glance</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="font-medium text-slate-900">Audience</span>
                <span className="text-right">Students after Class 10</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="font-medium text-slate-900">Cost</span>
                <span className="text-right">Free, no ads</span>
              </li>
              <li className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="font-medium text-slate-900">Sign-up</span>
                <span className="text-right">Email and class only</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="font-medium text-slate-900">Identity shown</span>
                <span className="text-right">First name, or anonymous</span>
              </li>
            </ul>

            {contactEmail && (
              <>
                <p className="mt-6 text-sm text-slate-600">
                  Found something wrong in a career page, or want to suggest a category? Tell us.
                </p>
                <Link to="/contact" className="btn-secondary mt-4 w-full">
                  Contact support
                </Link>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-2 section-title">Three tools, one decision</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Nothing here is a feed to scroll. Each part exists to answer a question you actually have.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <div key={feature.title} className="card card-hover p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <Icon>{feature.icon}</Icon>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- values */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">What we stand for</p>
          <h2 className="mt-2 section-title">Four rules we do not bend</h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value) => (
            <div key={value.title} className="card flex gap-4 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon>{value.icon}</Icon>
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{value.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ privacy */}
      <section className="border-t border-slate-200 bg-brand-50 py-16">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-700">Your privacy</p>
              <h2 className="mt-2 section-title">What we store, and who sees it</h2>
              <p className="mt-4 leading-relaxed text-slate-700">
                Most student platforms quietly build a profile. This one does not. Here is the whole list.
              </p>
              <Link to="/contact" className="btn-primary mt-6">
                Ask us anything
              </Link>
            </div>

            <ul className="card divide-y divide-slate-100 p-2">
              {PRIVACY.map((line) => (
                <li key={line} className="flex items-start gap-3 px-4 py-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06L8.75 12.19l6.97-6.97a.75.75 0 0 1 1.06.007Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- cta */}
      <section className="container-page py-16 sm:py-20">
        <div className="card flex flex-col items-start gap-6 bg-gradient-to-br from-brand-800 to-brand-950 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Start with the class you are in
            </h2>
            <p className="mt-2 max-w-xl leading-relaxed text-brand-100">
              Two questions, then a filtered list of everything you can realistically work towards next.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Get started
            </Link>
            <Link
              to="/careers"
              className="btn-secondary border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              Browse without an account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
