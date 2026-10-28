import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ACCOUNTS = [
  { email: 'peserta@bim.test', role: 'Peserta' },
  { email: 'trainer@bim.test', role: 'Trainer' },
  { email: 'admin@bim.test', role: 'Admin Lembaga' },
  { email: 'super@bim.test', role: 'Super Admin' },
]

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('peserta@bim.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-charcoal p-12 text-warm md:flex">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold">BIM Training & Modeling</div>
          <h1 className="mt-6 max-w-md font-serif text-5xl leading-tight">Studio modeling untuk belajar BIM, bukan klon Revit.</h1>
        </div>
        <p className="max-w-sm text-sand/80">
          Data semantik adalah sumber kebenaran. Geometry dan renderer hanya turunan. Latihan, validasi, review trainer, dan sertifikat dalam satu alur.
        </p>
      </section>
      <section className="flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <h2 className="font-serif text-3xl">Masuk</h2>
          <p className="text-sm text-muted">Gunakan akun demo. Kata sandi: password</p>
          {error && <div className="rounded bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
          <label className="block text-sm">
            Email
            <input className="mt-1 w-full rounded border border-sand bg-white px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            Kata sandi
            <input type="password" className="mt-1 w-full rounded border border-sand bg-white px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button disabled={loading} className="w-full rounded bg-charcoal py-2 text-warm">
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {ACCOUNTS.map((acc) => (
              <button key={acc.email} type="button" className="rounded border border-sand px-2 py-2 text-left" onClick={() => setEmail(acc.email)}>
                <div className="font-medium">{acc.role}</div>
                <div className="text-muted">{acc.email}</div>
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  )
}
