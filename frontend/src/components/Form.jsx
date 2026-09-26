import { useId } from 'react'

/** Text input with label, hint and inline validation message. */
export function TextField({
  label,
  hint,
  error,
  type = 'text',
  as = 'input',
  required,
  className = '',
  textareaRows = 4,
  ...props
}) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const Element = as

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <Element
        id={id}
        type={as === 'input' ? type : undefined}
        rows={as === 'textarea' ? textareaRows : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`input ${error ? 'input-error' : ''} ${as === 'textarea' ? 'resize-y' : ''}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          <svg className="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9-4a1 1 0 1 1 2 0v4a1 1 0 0 1-2 0V6Zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

/** Single-select list of options, rendered as clickable cards. */
export function ChoiceField({ label, hint, error, options, value, onChange, name, required, columns = 1 }) {
  const group = useId()
  return (
    <fieldset>
      {label && (
        <legend className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </legend>
      )}
      {hint && <p className="mb-2.5 text-xs text-slate-500">{hint}</p>}
      <div className={`grid gap-2.5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}>
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition
                ${checked
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : 'border-slate-300 bg-white hover:border-brand-300 hover:bg-slate-50'}`}
            >
              <input
                type="radio"
                name={name ?? group}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                {option.hint && <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p className="field-error">
          <svg className="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9-4a1 1 0 1 1 2 0v4a1 1 0 0 1-2 0V6Zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** Toggleable interest chips for multi-choice questions. */
export function ChipField({ label, hint, error, options, values, onToggle, required }) {
  return (
    <fieldset>
      {label && (
        <legend className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </legend>
      )}
      {hint && <p className="mb-2.5 text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition
                ${active
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800'}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="field-error">
          <svg className="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-9-4a1 1 0 1 1 2 0v4a1 1 0 0 1-2 0V6Zm1 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  )
}

export function Checkbox({ label, description, checked, onChange, ...props }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand-700"
        {...props}
      />
      <span className="text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  )
}
