import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import { useSubmit } from '../../lib/auth'
import { PageLoader } from '../../components/Spinner'
import { Alert, EmptyState } from '../../components/Feedback'
import { TextField, Checkbox, ChoiceField } from '../../components/Form'
import Modal from '../../components/Modal'
import { ButtonSpinner } from '../../components/Spinner'
import { ANSWER_TYPE_LABELS, pluralize } from '../../lib/utils'

const ANSWER_TYPES = [
  { value: 'SHORT_TEXT', label: 'Short text', hint: 'One line answer, up to 200 characters.' },
  { value: 'LONG_TEXT', label: 'Long text', hint: 'A paragraph the student can type freely.' },
  { value: 'SINGLE_CHOICE', label: 'Single choice', hint: 'Pick exactly one from the options you add.' },
  { value: 'MULTI_CHOICE', label: 'Multiple choice', hint: 'Pick any number, used for interest chips.' },
]

const CHOICE_TYPES = ['SINGLE_CHOICE', 'MULTI_CHOICE']

const emptyQuestion = () => ({
  questionText: '',
  description: '',
  answerType: 'SINGLE_CHOICE',
  options: [{ optionText: '', optionHint: '' }],
  allowOther: false,
  otherLabel: 'Others',
  otherPlaceholder: 'Tell us in your own words',
  required: true,
  active: true,
})

function toPayload(question) {
  const isChoice = CHOICE_TYPES.includes(question.answerType)
  return {
    questionText: question.questionText,
    description: question.description || null,
    answerType: question.answerType,
    options: isChoice
      ? question.options
          .map((o) => ({ optionText: o.optionText.trim(), optionHint: o.optionHint?.trim() || null }))
          .filter((o) => o.optionText)
      : [],
    allowOther: isChoice ? question.allowOther : false,
    otherLabel: isChoice && question.allowOther ? question.otherLabel || 'Others' : null,
    otherPlaceholder: isChoice && question.allowOther ? question.otherPlaceholder || null : null,
    required: question.required,
    active: question.active,
  }
}

function QuestionForm({ initial, onCancel, onSave, busy, error }) {
  const [question, setQuestion] = useState(() => ({
    ...emptyQuestion(),
    ...initial,
    options: initial?.options?.length
      ? initial.options.map((o) => ({ optionText: o.optionText, optionHint: o.optionHint ?? '' }))
      : emptyQuestion().options,
  }))
  const [localError, setLocalError] = useState('')

  const isChoice = CHOICE_TYPES.includes(question.answerType)

  const setAnswerType = (answerType) => {
    setQuestion((prev) => ({
      ...prev,
      answerType,
      // Text questions never carry options.
      options: CHOICE_TYPES.includes(answerType)
        ? prev.options.length
          ? prev.options
          : [{ optionText: '', optionHint: '' }]
        : [],
      allowOther: CHOICE_TYPES.includes(answerType) ? prev.allowOther : false,
    }))
  }

  const setOption = (index, patch) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? { ...option, ...patch } : option)),
    }))
  }

  const addOption = () => {
    setQuestion((prev) => ({ ...prev, options: [...prev.options, { optionText: '', optionHint: '' }] }))
  }

  const removeOption = (index) => {
    setQuestion((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))
  }

  const submit = (e) => {
    e.preventDefault()
    setLocalError('')

    if (!question.questionText.trim()) {
      setLocalError('The question text is required.')
      return
    }
    if (isChoice && !question.options.some((o) => o.optionText.trim())) {
      setLocalError('Add at least one option with text.')
      return
    }
    if (isChoice && !question.allowOther && !question.options.some((o) => o.optionText.trim())) {
      setLocalError('Either add options or turn on the "Others" choice.')
      return
    }

    onSave(toPayload(question))
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {(error || localError) && <Alert tone="error">{error || localError}</Alert>}

      <TextField
        label="Question"
        required
        value={question.questionText}
        onChange={(e) => setQuestion({ ...question, questionText: e.target.value })}
        placeholder="Which class are you in right now?"
        maxLength={500}
      />

      <TextField
        label="Helper text"
        as="textarea"
        textareaRows={2}
        value={question.description}
        onChange={(e) => setQuestion({ ...question, description: e.target.value })}
        hint="Optional. Shown under the question in small grey text."
      />

      <div>
        <span className="label">Answer type</span>
        <ChoiceField
          options={ANSWER_TYPES}
          value={question.answerType}
          onChange={setAnswerType}
          columns={2}
        />
      </div>

      {isChoice && (
        <div>
          <div className="flex items-center justify-between">
            <span className="label">
              Options <span className="text-rose-500">*</span>
            </span>
            <button type="button" onClick={addOption} className="btn-ghost btn-sm text-brand-700">
              + Add option
            </button>
          </div>

          <div className="mt-2 space-y-2.5">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={option.optionText}
                    onChange={(e) => setOption(index, { optionText: e.target.value })}
                    placeholder={`Option ${index + 1}`}
                    aria-label={`Option ${index + 1} text`}
                    className="input"
                  />
                  <input
                    value={option.optionHint}
                    onChange={(e) => setOption(index, { optionHint: e.target.value })}
                    placeholder="Optional hint shown under the option"
                    aria-label={`Option ${index + 1} hint`}
                    className="input text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={question.options.length === 1}
                  aria-label={`Remove option ${index + 1}`}
                  className="btn-ghost btn-sm mt-1 text-rose-600 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isChoice && (
        <div className="space-y-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <Checkbox
            label="Add an 'Others' choice with a text box"
            description="The student ticks Others and then types their own answer."
            checked={question.allowOther}
            onChange={(allowOther) => setQuestion({ ...question, allowOther })}
          />

          {question.allowOther && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Others button label"
                value={question.otherLabel}
                onChange={(e) => setQuestion({ ...question, otherLabel: e.target.value })}
                placeholder="Others"
              />
              <TextField
                label="Text box placeholder"
                value={question.otherPlaceholder}
                onChange={(e) => setQuestion({ ...question, otherPlaceholder: e.target.value })}
                placeholder="Tell us in your own words"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-2">
        <Checkbox
          label="Required"
          description="The student cannot continue without answering."
          checked={question.required}
          onChange={(required) => setQuestion({ ...question, required })}
        />
        <Checkbox
          label="Active"
          description="Inactive questions are hidden from students."
          checked={question.active}
          onChange={(active) => setQuestion({ ...question, active })}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <ButtonSpinner label="Saving..." /> : 'Save question'}
        </button>
      </div>
    </form>
  )
}

export default function AdminOnboarding() {
  const { busy, error, run } = useSubmit()

  const [questions, setQuestions] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/onboarding/questions')
      setQuestions(data)
      setLoadError('')
    } catch (err) {
      setLoadError(err.response?.data?.message ?? 'Could not load the questions.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (payload) => {
    const isEdit = Boolean(editing?.id)
    const result = await run(() =>
      isEdit
        ? api.put(`/admin/onboarding/questions/${editing.id}`, payload)
        : api.post('/admin/onboarding/questions', payload),
    )
    if (result) {
      setEditing(null)
      await load()
      flash(isEdit ? 'Question updated.' : 'Question added.')
    }
  }

  const remove = async (question) => {
    if (!window.confirm(`Delete "${question.questionText}"?`)) return
    const result = await run(() => api.delete(`/admin/onboarding/questions/${question.id}`))
    if (result) {
      await load()
      flash('Question deleted.')
    }
  }

  const move = async (question, direction) => {
    const index = questions.findIndex((q) => q.id === question.id)
    const target = index + direction
    if (target < 0 || target >= questions.length) return

    const ids = questions.map((q) => q.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    setQuestions((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

    const result = await run(() => api.post('/admin/onboarding/questions/reorder', { ids }))
    if (result) await load()
  }

  const toggleActive = async (question) => {
    const result = await run(() =>
      api.put(`/admin/onboarding/questions/${question.id}`, {
        questionText: question.questionText,
        description: question.description,
        answerType: question.answerType,
        options: question.options.map((o) => ({ optionText: o.optionText, optionHint: o.optionHint })),
        allowOther: question.allowOther,
        otherLabel: question.otherLabel,
        otherPlaceholder: question.otherPlaceholder,
        required: question.required,
        active: !question.active,
      }),
    )
    if (result) {
      await load()
      flash(result.data.active ? 'Question is now active.' : 'Question hidden from students.')
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Onboarding questions</h2>
          <p className="mt-1 text-sm text-slate-600">
            These are the questions a student answers right after their first login, in this order.
          </p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="btn-primary">
          + Add question
        </button>
      </header>

      {toast && <Alert tone="success">{toast}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {loadError && <Alert tone="error">{loadError}</Alert>}

      {!questions ? (
        <PageLoader label="Loading questions..." />
      ) : questions.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No questions yet"
          action={
            <button type="button" onClick={() => setEditing({})} className="btn-primary mt-2">
              Add the first question
            </button>
          }
        >
          Students see whatever questions are active here.
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            {pluralize(questions.length, 'question')} &middot;{' '}
            {questions.filter((q) => q.active).length} active
          </p>

          <ul className="space-y-3">
            {questions.map((question, index) => (
              <li key={question.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-slate-100 text-slate-600">#{index + 1}</span>
                      <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                        {ANSWER_TYPE_LABELS[question.answerType]}
                      </span>
                      {question.required && (
                        <span className="badge bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                          Required
                        </span>
                      )}
                      {!question.active && (
                        <span className="badge bg-slate-200 text-slate-600">Hidden</span>
                      )}
                      {question.allowOther && (
                        <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          Others + text box
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {pluralize(question.answerCount, 'answer')}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-bold text-slate-900">{question.questionText}</h3>
                    {question.description && (
                      <p className="mt-1 text-sm text-slate-500">{question.description}</p>
                    )}

                    {question.options.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {question.options.map((option) => (
                          <span
                            key={option.id}
                            className="badge bg-slate-50 text-slate-600 ring-1 ring-slate-200"
                          >
                            {option.optionText}
                          </span>
                        ))}
                        {question.allowOther && (
                          <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                            {question.otherLabel || 'Others'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => move(question, -1)}
                      disabled={busy || index === 0}
                      aria-label="Move up"
                      className="btn-ghost btn-sm disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(question, 1)}
                      disabled={busy || index === questions.length - 1}
                      aria-label="Move down"
                      className="btn-ghost btn-sm disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(question)}
                      className="btn-ghost btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(question)}
                      className="btn-ghost btn-sm"
                    >
                      {question.active ? 'Hide' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(question)}
                      className="btn-ghost btn-sm text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={editing.id ? 'Edit question' : 'Add question'}
          size="xl"
        >
          <QuestionForm
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
