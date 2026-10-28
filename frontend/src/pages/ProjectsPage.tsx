import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProjectApi } from '../services/api'

export function ProjectsPage() {
  const navigate = useNavigate()
  const list = useQuery({ queryKey: ['projects'], queryFn: ProjectApi.list })
  const [title, setTitle] = useState('Gedung Kantor')
  const [error, setError] = useState<string | null>(null)
  const projects = list.data?.data.data ?? []

  return (
    <div>
      <h1 className="font-serif text-4xl">Project</h1>
      <form
        className="mt-6 flex flex-wrap gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          try {
            const res = await ProjectApi.create({ title })
            navigate(`/studio/${res.data.id}`)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal membuat proyek')
          }
        }}
      >
        <input className="rounded border border-sand bg-white px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="rounded bg-charcoal px-4 py-2 text-warm">Buat proyek</button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-lg border border-sand bg-white">
        <table className="w-full text-sm">
          <thead className="bg-sand/50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Kode</th>
              <th>Judul</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-sand">
                <td className="px-4 py-3">{p.code}</td>
                <td>{p.title}</td>
                <td className="capitalize">{p.status}</td>
                <td className="px-4 text-right">
                  <Link to={`/studio/${p.id}`} className="text-bronze">
                    Buka studio
                  </Link>
                </td>
              </tr>
            ))}
            {!projects.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Belum ada proyek.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
