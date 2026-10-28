import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { TrainingApi } from '../services/api'

export function VerifyPage() {
  const { token } = useParams()
  const query = useQuery({
    queryKey: ['verify', token],
    queryFn: () => TrainingApi.verify(token!),
    enabled: Boolean(token),
  })

  const data = query.data?.data
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-bronze">Verifikasi Sertifikat</div>
      {query.isLoading && <p className="mt-6">Memeriksa…</p>}
      {query.isError && <p className="mt-6 text-danger">Sertifikat tidak ditemukan.</p>}
      {data && (
        <div className="mt-6 rounded-lg border border-sand bg-white p-8">
          <div className="font-serif text-3xl">{data.participant}</div>
          <p className="mt-2">{data.program}</p>
          <p className="text-sm text-muted">{data.organization}</p>
          <div className="mt-4 text-bronze">{data.certificate_number}</div>
          <p className="mt-2 text-sm">
            {data.competency_level} · {data.final_score} · {data.issued_at}
          </p>
        </div>
      )}
    </div>
  )
}
