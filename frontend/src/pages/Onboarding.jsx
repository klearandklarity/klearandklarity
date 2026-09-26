import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuth, useSubmit } from '../lib/auth'
import { TextField, ChoiceField, ChipField } from '../components/Form'
import { Alert } from '../components/Feedback'
import { ButtonSpinner, PageLoader } from '../components/Spinner'
import Logo from '../components/Logo'
import { ANSWER_TYPE_LABELS } from '../lib/utils'

const OTHER = '__OTHER__'

/**
 * Renders one onboarding question, supporting all four answer types the admin can create.
 * `allowOther` adds an extra "Others" choice that reveals a text box.
 */
function Question({ question, index, total, value, onChange, error }) {
  const { answerType, allowOther, otherLabel, otherPlaceholder, options = [] } = question
  const choiceOptions = options.map((o) => ({ value: o.optionText, label: o.optionText, hint: o.optionHint }))

  const textValue = value?.text ?? ''
  const selected = value?.options ?? []

  const toggleChip = (optionText) => {
    const next = selected.includes(optionText)
      ? selected.filter((o) => o !== optionText)
      : [...selected, optionText]
    onChange({ ...value, options: next })
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-snug text-slate-900">
            {question.questionText}
            {question.required && <span className="ml-1 text-rose-500">*</span>}
          </h2>
          {question.description && <p className="mt-1.5 text-sm text-slate-500">{question.description}</p>}
          <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            {ANSWER_TYPE_LABELS[answerType]}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {answerType === 'SHORT_TEXT' && (
          <TextField
            as="textarea"
            textareaRows={2}
            value={textValue}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder="Type your answer"
            maxLength={200}
          />
        )}

        {answerType === 'LONG_TEXT' && (
          <TextField
            as="textarea"
            textareaRows={5}
            value={textValue}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            placeholder="Type your answer"
          />
        )}

        {answerType === 'SINGLE_CHOICE' && (
          <>
            <ChoiceField
              columns={2}
              options={choiceOptions}
              value={selected[0] ?? ''}
              onChange={(option) => onChange({ ...value, options: [option], text: '' })}
              error={error}
            />

            {allowOther && (
              <div className="mt-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-white p-3.5 transition hover:border-brand-300 hover:bg-slate-50">
                  <input
                    type="radio"
                    checked={selected[0] === OTHER}
                    onChange={() => onChange({ ...value, options: [OTHER], text: value.text ?? '' })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
                  />
                  <span className="text-sm font-semibold text-slate-900">{otherLabel || 'Others'}</span>
                </label>

                {selected[0] === OTHER && (
                  <div className="mt-3 animate-[popIn_.15s_ease-out]">
                    <TextField
                      label="Please specify"
                      required
                      value={textValue}
                      onChange={(e) => onChange({ ...value, text: e.target.value })}
                      placeholder={otherPlaceholder || 'Tell us in your own words'}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {answerType === 'MULTI_CHOICE' && (
          <>
            <ChipField
              options={choiceOptions}
              values={selected}
              onToggle={toggleChip}
              error={error}
            />
            <p className="mt-3 text-xs text-slate-500">
              {selected.length === 0
                ? 'Nothing selected yet.'
                : `${selected.length} selected.`}
            </p>

            {allowOther && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <TextField
                  label={otherLabel || 'Anything else?'}
                  as="textarea"
                  textareaRows={2}
                  value={textValue}
                  onChange={(e) => onChange({ ...value, text: e.target.value })}
                  placeholder={otherPlaceholder || 'Add your own interest'}
                />
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
        Question {index + 1} of {total}
      </p>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, refresh, logout } = useAuth()
  const { busy, error, run } = useSubmit()

  const [questions, setQuestions] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    api
      .get('/onboarding/questions')
      .then(({ data }) => {
        if (cancelled) return
        setQuestions(data)
        const initial = {}
        data.forEach((q) => {
          initial[q.id] = { text: '', options: [] }
        })
        setAnswers(initial)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.data?.message ?? 'Could not load the questions.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const current = questions?.[step]

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => ({ ...prev, [questionId]: undefined }))
  }

  const validateCurrent = () => {
    if (!current) return true
    if (!current.required) return true

    const answer = answers[current.id] ?? { text: '', options: [] }
    const hasText = Boolean(answer.text?.trim())
    const hasOption = Boolean(answer.options?.length)

    if (current.answerType === 'SINGLE_CHOICE' || current.answerType === 'MULTI_CHOICE') {
      if (!hasOption) {
        setErrors((prev) => ({ ...prev, [current.id]: 'Please choose an option to continue.' }))
        return false
      }
      // "Others" on a single choice question needs the text box filled in.
      if (answer.options.includes(OTHER) && !hasText) {
        setErrors((prev) => ({ ...prev, [current.id]: 'Please type your answer in the text box.' }))
        return false
      }
    } else if (!hasText) {
      setErrors((prev) => ({ ...prev, [current.id]: 'Please type an answer to continue.' }))
      return false
    }
    return true
  }

  const goNext = () => {
    if (!validateCurrent()) return
    setStep((s) => Math.min(s + 1, questions.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onFinish = async () => {
    if (!validateCurrent()) return

    const payload = questions.map((q) => {
      const answer = answers[q.id] ?? { text: '', options: [] }
      return {
        questionId: q.id,
        text: answer.text?.trim() || null,
        options: answer.options ?? [],
      }
    })

    const result = await run(() => api.post('/onboarding/submit', { answers: payload }))
    if (result) {
      await refresh()
      navigate('/dashboard', { replace: true })
    }
  }

  const progress = questions?.length ? ((step + 1) / questions.length) * 100 : 0

  const greeting = useMemo(() => user?.firstName ?? 'there', [user])

  if (loadError) {
    return (
      <section className="container-page py-20">
        <div className="mx-auto max-w-md">
          <Alert tone="error" title="Could not load the questions">
            {loadError}
          </Alert>
          <button type="button" onClick={logout} className="btn-secondary mt-4 w-full">
            Log out
          </button>
        </div>
      </section>
    )
  }

  if (!questions) return <PageLoader label="Preparing your questions..." />

  // An admin has no onboarding, and a finished student should never see this page again.
  if (user?.role === 'ADMIN' || user?.onboardingCompleted) {
    return (
      <section className="container-page py-20">
        <div className="mx-auto max-w-md text-center">
          <Alert tone="info" title="Nothing to do here">
            You have already completed your profile.
          </Alert>
          <button
            type="button"
            onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard')}
            className="btn-primary mt-4 w-full"
          >
            Go to {user.role === 'ADMIN' ? 'admin panel' : 'dashboard'}
          </button>
        </div>
      </section>
    )
  }

  if (questions.length === 0) {
    return (
      <section className="container-page py-20">
        <div className="mx-auto max-w-md text-center">
          <Alert tone="info" title="No questions to answer">
            There are no onboarding questions right now.
          </Alert>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary mt-4 w-full">
            Go to dashboard
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Logo size="md" showText={false} className="justify-center" />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome, {greeting}
          </h1>
          <p className="mt-2 text-slate-600">
            Two quick questions so we can point you at the careers that actually fit. Your answers go to our
            admin team, never to other students.
          </p>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Step {step + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-6">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6">
          <Question
            question={current}
            index={step}
            total={questions.length}
            value={answers[current.id]}
            onChange={(value) => setAnswer(current.id, value)}
            error={errors[current.id]}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="btn-secondary"
          >
            Back
          </button>

          {step < questions.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              Continue
            </button>
          ) : (
            <button type="button" onClick={onFinish} disabled={busy} className="btn-primary">
              {busy ? <ButtonSpinner label="Saving..." /> : 'Finish and go to dashboard'}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          You can update these answers any time from your profile.
        </p>
      </div>
    </section>
  )
}
