import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrainingApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const certs = useQuery({ queryKey: ['certificates'], queryFn: TrainingApi.certificates })

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Profil & Sertifikat</h1>
      <section className="rounded-lg border border-sand bg-white p-5">
        <div className="text-xs uppercase text-muted">Peserta</div>
        <div className="font-serif text-3xl">{user?.name}</div>
        <div className="text-muted">{user?.email}</div>
      </section>
      <section className="space-y-3">
        {(certs.data?.data ?? []).map((c) => (
          <article key={c.id} className="rounded-lg border border-sand bg-white p-5">
            <div className="text-xs uppercase text-bronze">{c.certificate_number}</div>
            <h2 className="font-serif text-2xl">{c.program?.title}</h2>
            <p className="text-sm text-muted">
              {c.competency_level} · skor {c.final_score} · {c.issued_at}
            </p>
            <Link className="mt-2 inline-block text-sm text-bronze" to={`/verify/${c.verification_token}`}>
              Verifikasi publik
            </Link>
          </article>
        ))}
        {!certs.data?.data.length && <p className="text-muted">Belum ada sertifikat.</p>}
      </section>
    </div>
  )
}
