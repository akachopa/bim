import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ProjectApi, TrainingApi } from '../services/api'

export function LabPage() {
  const labs = useQuery({ queryKey: ['labs'], queryFn: TrainingApi.labs })
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: TrainingApi.challenges })
  const navigate = useNavigate()

  async function openLab(id: string, title: string) {
    const project = await ProjectApi.create({ title: `Lab — ${title}`, bim_lab_id: id })
    navigate(`/studio/${project.data.id}?lab=${id}`)
  }
  async function openChallenge(id: string, title: string) {
    const project = await ProjectApi.create({ title: `Challenge — ${title}`, challenge_id: id })
    navigate(`/studio/${project.data.id}?challenge=${id}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">BIM Lab</h1>
        <p className="mt-2 text-muted">Praktik terpandu step-by-step, lalu challenge simulasi proyek.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(labs.data?.data ?? []).map((lab) => (
          <article key={lab.id} className="rounded-lg border border-sand bg-white p-5">
            <h2 className="font-serif text-2xl">{lab.title}</h2>
            <p className="mt-2 text-sm text-muted">{lab.description}</p>
            <ol className="mt-3 list-decimal pl-5 text-sm">
              {lab.steps.map((s) => (
                <li key={s.id}>{s.title}</li>
              ))}
            </ol>
            <button className="mt-4 rounded bg-bronze px-4 py-2 text-ink" onClick={() => void openLab(lab.id, lab.title)}>
              Mulai lab
            </button>
          </article>
        ))}
      </div>
      <section>
        <h2 className="font-serif text-2xl">Challenge</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(challenges.data?.data ?? []).map((ch) => (
            <article key={ch.id} className="rounded-lg border border-sand bg-white p-5">
              <div className="text-xs uppercase text-bronze">{ch.difficulty}</div>
              <h3 className="font-serif text-2xl">{ch.title}</h3>
              <p className="mt-2 text-sm text-muted">{ch.description}</p>
              <p className="mt-2 text-xs text-muted">
                {ch.duration_minutes} menit · passing {ch.passing_score}
              </p>
              <button className="mt-4 rounded bg-charcoal px-4 py-2 text-warm" onClick={() => void openChallenge(ch.id, ch.title)}>
                Kerjakan challenge
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
