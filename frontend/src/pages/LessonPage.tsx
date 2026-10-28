import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProjectApi, TrainingApi } from '../services/api'

export function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => TrainingApi.lesson(lessonId!), enabled: Boolean(lessonId) })
  const data = lesson.data?.data
  const quiz = data?.quiz
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (lesson.isLoading) return <p>Memuat materi…</p>
  if (!data) return <p>Materi tidak ditemukan.</p>

  return (
    <article className="space-y-6">
      <Link to="/belajar" className="text-sm text-bronze">
        ← Semua program
      </Link>
      <h1 className="font-serif text-4xl">{data.title}</h1>
      {(data.contents ?? []).map((content) => (
        <section key={content.id} className="rounded-lg border border-sand bg-white p-5">
          {content.title && <h2 className="font-serif text-2xl">{content.title}</h2>}
          {content.body && <p className="mt-3 whitespace-pre-wrap leading-7 text-charcoal/90">{content.body}</p>}
          {content.kind === 'lab' && content.lab_id && (
            <button
              className="mt-4 rounded bg-bronze px-4 py-2 text-ink"
              onClick={async () => {
                try {
                  const project = await ProjectApi.create({
                    title: `Lab — ${data.title}`,
                    bim_lab_id: content.lab_id,
                  })
                  navigate(`/studio/${project.data.id}?lab=${content.lab_id}`)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Gagal membuka lab')
                }
              }}
            >
              Praktikkan Sekarang
            </button>
          )}
        </section>
      ))}
      {quiz && (
        <section className="rounded-lg border border-sand bg-white p-5">
          <h2 className="font-serif text-2xl">{quiz.title}</h2>
          <p className="text-sm text-muted">Nilai lulus {quiz.passing_score}</p>
          <div className="mt-4 space-y-4">
            {quiz.questions.map((q, i) => (
              <div key={q.id}>
                <div className="font-medium">
                  {i + 1}. {q.prompt}
                </div>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, idx) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={q.id} checked={answers[q.id] === idx} onChange={() => setAnswers({ ...answers, [q.id]: idx })} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-4 rounded bg-charcoal px-4 py-2 text-warm"
            onClick={async () => {
              const res = await TrainingApi.quizAttempt(quiz.id, answers)
              setResult(res.data)
            }}
          >
            Kirim kuis
          </button>
          {result && (
            <p className={`mt-3 ${result.passed ? 'text-olive' : 'text-danger'}`}>
              Skor {result.score}. {result.passed ? 'Lulus.' : 'Belum lulus, coba lagi.'}
            </p>
          )}
        </section>
      )}
      {error && <p className="text-danger">{error}</p>}
    </article>
  )
}
