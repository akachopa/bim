import { useQuery } from '@tanstack/react-query'
import { TrainingApi } from '../services/api'

export function CompetencyPage() {
  const query = useQuery({ queryKey: ['competencies'], queryFn: TrainingApi.competencies })
  const scores = query.data?.scores ?? []
  const all = query.data?.data ?? []

  return (
    <div>
      <h1 className="font-serif text-4xl">Kompetensi</h1>
      <p className="mt-2 text-muted">Matriks skill BIM. Fokus MVP: Fundamental, Architecture Modeling, Coordination Basic.</p>
      <div className="mt-6 space-y-3">
        {all.map((c) => {
          const mine = scores.find((s) => s.competency.id === c.id)
          return (
            <div key={c.id} className="rounded-lg border border-sand bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  {c.mvp_focus && <div className="text-xs uppercase text-bronze">Fokus MVP</div>}
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl">{mine ? Math.round(mine.score) : 0}</div>
                  <div className="text-xs capitalize text-muted">{mine?.level ?? 'belum dinilai'}</div>
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-sand">
                <div className="h-full bg-bronze" style={{ width: `${Math.min(100, mine?.score ?? 0)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
