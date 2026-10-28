import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { StudioApp } from './features/studio/StudioApp'
import { CompetencyPage } from './pages/CompetencyPage'
import { HomePage } from './pages/HomePage'
import { LabPage } from './pages/LabPage'
import { LearnPage } from './pages/LearnPage'
import { LessonPage } from './pages/LessonPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ReviewPage } from './pages/ReviewPage'
import { StudioEntryPage } from './pages/StudioEntryPage'
import { VerifyPage } from './pages/VerifyPage'
import { getToken } from './services/api'
import { useAuthStore } from './stores/authStore'

const queryClient = new QueryClient()

function Guard() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <div className="p-10 text-muted">Memuat sesi…</div>
  if (!user && !getToken()) return <Navigate to="/login" replace />
  if (!user) return <div className="p-10 text-muted">Memuat sesi…</div>
  return <Outlet />
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:token" element={<VerifyPage />} />
          <Route element={<Guard />}>
            <Route path="/studio/:projectId" element={<StudioApp />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/belajar" element={<LearnPage />} />
              <Route path="/belajar/:programId" element={<LearnPage />} />
              <Route path="/belajar/lesson/:lessonId" element={<LessonPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/studio" element={<StudioEntryPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/kompetensi" element={<CompetencyPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/review" element={<ReviewPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
