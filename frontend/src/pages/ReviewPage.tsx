import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SubmissionApi } from '../services/api'

export function ReviewPage() {
  const list = useQuery({ queryKey: ['submissions'], queryFn: SubmissionApi.list })
  const submissions = list.data?.data.data ?? []
  const [comment, setComment] = useState('Perbaiki alignment wall ke grid.')
  const [score, setScore] = useState(80)
  const [message, setMessage] = useState<string | null>(null)

  return (
    <div>
      <h1 className="font-serif text-4xl">Review trainer</h1>
      <p className="mt-2 text-muted">Buka model, buat issue per objek, minta revisi, atau setujui.</p>
      <div className="mt-6 space-y-4">
        {submissions.map((s) => (
          <article key={s.id} className="rounded-lg border border-sand bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-serif text-2xl">{s.project?.title ?? 'Proyek'}</div>
                <div className="text-sm text-muted">
                  {s.user?.name} · {s.status} · auto {s.auto_score ?? '—'}
                </div>
              </div>
              {s.project && (
                <Link to={`/studio/${s.project.id}`} className="text-sm text-bronze">
                  Buka model
                </Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className="min-w-60 flex-1 rounded border border-sand px-2 py-1" value={comment} onChange={(e) => setComment(e.target.value)} />
              <input className="w-20 rounded border border-sand px-2 py-1" type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} />
              <button className="rounded border px-3 py-1" onClick={() => void SubmissionApi.review(s.id, { comment, status: 'under_review' }).then(() => setMessage('Ditandai under review'))}>
                Review
              </button>
              <button className="rounded border border-danger px-3 py-1 text-danger" onClick={() => void SubmissionApi.revision(s.id, comment).then(() => setMessage('Revisi diminta'))}>
                Minta revisi
              </button>
              <button className="rounded bg-olive px-3 py-1 text-warm" onClick={() => void SubmissionApi.approve(s.id, { trainer_score: score, comment }).then(() => setMessage('Disetujui'))}>
                Approve
              </button>
            </div>
          </article>
        ))}
        {!submissions.length && <p className="text-muted">Belum ada submission.</p>}
      </div>
      {message && <p className="mt-4 text-olive">{message}</p>}
    </div>
  )
}
