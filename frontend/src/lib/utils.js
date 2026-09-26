/** Small formatting helpers shared across pages. */

export function timeAgo(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const seconds = Math.floor((Date.now() - then) / 1000)

  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (days < 31) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  }
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

export function genderLabel(value) {
  return GENDERS.find((g) => g.value === value)?.label ?? '-'
}

export const GENDER_OPTIONS = GENDERS

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ADMIN', label: 'Admin' },
]

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label ?? '-'
}

export const ROLE_OPTIONS = ROLES

export const ANSWER_TYPE_LABELS = {
  SHORT_TEXT: 'Short text',
  LONG_TEXT: 'Long text',
  SINGLE_CHOICE: 'Single choice',
  MULTI_CHOICE: 'Multiple choice',
}

/** Maps the colour keys the admin picks to Tailwind class sets. */
export const CATEGORY_COLORS = {
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  lime: 'bg-lime-50 text-lime-700 ring-lime-200',
}

export const CATEGORY_COLOR_KEYS = Object.keys(CATEGORY_COLORS)

export function categoryColorClass(key) {
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.slate
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}
