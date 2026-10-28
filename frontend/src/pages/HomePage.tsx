import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrainingApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export function HomePage() {
  const user = useAuthStore((s) => s.user)
  const dash = useQuery({ queryKey: ['dashboard'], queryFn: TrainingApi.dashboard })
  const data = dash.data?.data
  const trainer = data?.trainer

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-bronze">Akademi BIM Nusantara</div>
        <h1 className="mt-2 font-serif text-4xl">Selamat datang, {user?.name}</h1>
        <p className="mt-2 max-w-2xl text-muted">Ikuti learning path, praktik di BIM Lab, modelkan di Studio, lalu submit untuk review dan sertifikasi.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Program" value={String(data?.participant.programs ?? '—')} />
        <Stat label="BIM Lab" value={String(data?.participant.labs ?? '—')} />
        <Stat label="Proyek" value={String(data?.participant.projects ?? '—')} />
        <Stat label="Sertifikat" value={String(data?.participant.certificates ?? '—')} />
      </div>
      {trainer && (
        <section>
          <h2 className="font-serif text-2xl">Dasbor trainer</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-4">
            <Stat label="Submission antre" value={String(trainer.submissions)} />
            <Stat label="Rata-rata skor" value={String(trainer.average_score)} />
            <Stat label="Issue terbuka" value={String(trainer.issues)} />
            <Stat label="Revisi" value={String(trainer.revisions)} />
          </div>
        </section>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/belajar" className="rounded bg-charcoal px-4 py-2 text-warm">
          Lanjut belajar
        </Link>
        <Link to="/lab" className="rounded border border-charcoal px-4 py-2">
          Buka BIM Lab
        </Link>
        <Link to="/studio" className="rounded border border-bronze px-4 py-2 text-bronze">
          BIM Studio
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sand bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-serif text-3xl">{value}</div>
    </div>
  )
}
