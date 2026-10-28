import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { TrainingApi } from '../services/api'

export function LearnPage() {
  const { programId } = useParams()
  const list = useQuery({ queryKey: ['programs'], queryFn: TrainingApi.programs })
  const detail = useQuery({
    queryKey: ['program', programId],
    queryFn: () => TrainingApi.program(programId!),
    enabled: Boolean(programId),
  })

  if (!programId) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Belajar</h1>
        <p className="mt-2 text-muted">Pilih program pelatihan.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(list.data?.data ?? []).map((program) => (
            <Link key={program.id} to={`/belajar/${program.id}`} className="rounded-lg border border-sand bg-white p-5 hover:border-bronze">
              <div className="text-xs uppercase text-bronze">{program.code}</div>
              <h2 className="mt-1 font-serif text-2xl">{program.title}</h2>
              <p className="mt-2 text-sm text-muted">{program.description}</p>
              <div className="mt-3 text-xs text-muted">{program.duration_hours} jam</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const program = detail.data?.data
  if (detail.isLoading) return <p>Memuat program…</p>
  if (!program) return <p>Program tidak ditemukan.</p>

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase text-bronze">{program.code}</div>
        <h1 className="font-serif text-4xl">{program.title}</h1>
        <p className="mt-2 text-muted">{program.description}</p>
      </div>
      {(program.modules ?? []).map((mod) => (
        <section key={mod.id} className="rounded-lg border border-sand bg-white p-5">
          <h2 className="font-serif text-2xl">{mod.title}</h2>
          <p className="text-sm text-muted">{mod.description}</p>
          <ul className="mt-3 space-y-2">
            {(mod.lessons ?? []).map((lesson) => (
              <li key={lesson.id}>
                <Link to={`/belajar/lesson/${lesson.id}`} className="flex justify-between rounded px-2 py-2 hover:bg-sand/40">
                  <span>{lesson.title}</span>
                  <span className="text-xs uppercase text-muted">
                    {lesson.type} · {lesson.duration_minutes} mnt
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
