import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ProjectApi } from '../services/api'

export function StudioEntryPage() {
  const list = useQuery({ queryKey: ['projects'], queryFn: ProjectApi.list })
  const navigate = useNavigate()
  const projects = list.data?.data.data ?? []

  return (
    <div>
      <h1 className="font-serif text-4xl">BIM Studio</h1>
      <p className="mt-2 text-muted">Lanjutkan model yang ada, atau buat proyek baru untuk modeling 2D/3D.</p>
      <button
        className="mt-6 rounded bg-bronze px-4 py-2 text-ink"
        onClick={async () => {
          const res = await ProjectApi.create({ title: 'Studio Baru' })
          navigate(`/studio/${res.data.id}`)
        }}
      >
        Proyek baru
      </button>
      <div className="mt-6 grid gap-3">
        {projects.map((p) => (
          <Link key={p.id} to={`/studio/${p.id}`} className="flex items-center justify-between rounded-lg border border-sand bg-white px-4 py-3 hover:border-bronze">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-muted">{p.code}</div>
            </div>
            <span className="text-sm capitalize text-muted">{p.status}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
