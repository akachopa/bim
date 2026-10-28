import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/belajar', label: 'Belajar' },
  { to: '/lab', label: 'BIM Lab' },
  { to: '/studio', label: 'BIM Studio' },
  { to: '/projects', label: 'Project' },
  { to: '/kompetensi', label: 'Kompetensi' },
  { to: '/profil', label: 'Profil & Sertifikat' },
]

export function AppShell() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const trainer = user?.role === 'trainer' || user?.role === 'org_admin' || user?.is_super_admin

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <header className="sticky top-0 z-20 flex items-center gap-6 border-b border-sand bg-warm/95 px-6 py-3 backdrop-blur">
        <div className="font-serif text-xl">
          BIM<span className="text-bronze">Studio</span>
        </div>
        <nav className="hidden gap-4 text-sm md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => (isActive ? 'text-bronze' : 'text-muted hover:text-charcoal')}>
              {link.label}
            </NavLink>
          ))}
          {trainer && (
            <NavLink to="/review" className={({ isActive }) => (isActive ? 'text-bronze' : 'text-muted hover:text-charcoal')}>
              Review
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <div className="hidden text-right sm:block">
            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-muted">{user?.role}</div>
          </div>
          <button
            className="rounded border border-sand px-3 py-1"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Keluar
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
