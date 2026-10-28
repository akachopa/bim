const TOKEN_KEY = 'bim.token'
const ORG_KEY = 'bim.org'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getOrgId() {
  return localStorage.getItem(ORG_KEY)
}

export function setOrgId(id: string | null) {
  if (id) localStorage.setItem(ORG_KEY, id)
  else localStorage.removeItem(ORG_KEY)
}

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const org = getOrgId()
  if (org) headers.set('X-Organization-Id', org)

  const response = await fetch(path, { ...init, headers })
  const text = await response.text()
  const json = text ? JSON.parse(text) : null
  if (!response.ok) {
    const message = json?.message || json?.errors?.email?.[0] || `Permintaan gagal (${response.status})`
    throw new ApiError(response.status, message, json)
  }
  return json as T
}

export const AuthApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: AuthUser }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<{ data: AuthUser }>('/api/v1/auth/me'),
  logout: () => api('/api/v1/auth/logout', { method: 'POST' }),
}

export type AuthUser = {
  id: string
  name: string
  email: string
  is_super_admin: boolean
  current_organization_id: string | null
  role: string | null
  organizations: Array<{ id: string; name: string; slug: string; code: string; role: string }>
}

export const TrainingApi = {
  dashboard: () => api<{ data: DashboardData }>('/api/v1/dashboard'),
  programs: () => api<{ data: Program[] }>('/api/v1/programs'),
  program: (id: string) => api<{ data: Program }>('/api/v1/programs/' + id),
  lesson: (id: string) => api<{ data: Lesson }>('/api/v1/lessons/' + id),
  quizAttempt: (id: string, answers: Record<string, number>) =>
    api<{ data: { score: number; passed: boolean } }>(`/api/v1/quizzes/${id}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  labs: () => api<{ data: Lab[] }>('/api/v1/labs'),
  lab: (id: string) => api<{ data: Lab }>('/api/v1/labs/' + id),
  challenges: () => api<{ data: Challenge[] }>('/api/v1/challenges'),
  challenge: (id: string) => api<{ data: Challenge }>('/api/v1/challenges/' + id),
  competencies: () => api<{ data: Competency[]; scores: UserCompetency[] }>('/api/v1/competencies'),
  certificates: () => api<{ data: Certificate[] }>('/api/v1/certificates'),
  verify: (token: string) => api<{ valid: boolean; data: PublicCertificate }>(`/api/v1/certificates/verify/${token}`),
}

export const ProjectApi = {
  list: () => api<{ data: { data: ProjectSummary[] } }>('/api/v1/projects'),
  get: (id: string) => api<{ data: ProjectDetail }>(`/api/v1/projects/${id}`),
  create: (payload: Record<string, unknown>) =>
    api<{ data: ProjectDetail }>('/api/v1/projects', { method: 'POST', body: JSON.stringify(payload) }),
  document: (id: string) => api<{ data: unknown }>(`/api/v1/projects/${id}/document`),
  saveDocument: (id: string, document: unknown, checkpoint = false, label?: string) =>
    api<{ data: unknown; saved_at: string }>(`/api/v1/projects/${id}/document`, {
      method: 'PUT',
      body: JSON.stringify({ document, checkpoint, label }),
    }),
  validate: (id: string, document?: unknown) =>
    api<ValidationApiReport>(`/api/v1/projects/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ document }),
    }),
  submit: (id: string) => api<{ data: Submission; assessment: unknown }>(`/api/v1/projects/${id}/submit`, { method: 'POST' }),
  versions: (id: string) => api<{ data: Version[] }>(`/api/v1/projects/${id}/versions`),
  createVersion: (id: string, label: string) =>
    api<{ data: Version }>(`/api/v1/projects/${id}/versions`, { method: 'POST', body: JSON.stringify({ label }) }),
  issues: (id: string) => api<{ data: Issue[] }>(`/api/v1/projects/${id}/issues`),
  createIssue: (id: string, payload: Record<string, unknown>) =>
    api<{ data: Issue }>(`/api/v1/projects/${id}/issues`, { method: 'POST', body: JSON.stringify(payload) }),
  updateIssue: (id: string, payload: Record<string, unknown>) =>
    api<{ data: Issue }>(`/api/v1/issues/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  exportIfc: (id: string) => api<{ data: { id: string; status: string; result?: unknown } }>(`/api/v1/projects/${id}/ifc/export`, { method: 'POST' }),
}

export const SubmissionApi = {
  list: () => api<{ data: { data: Submission[] } }>('/api/v1/submissions'),
  get: (id: string) => api<{ data: Submission }>(`/api/v1/submissions/${id}`),
  review: (id: string, payload: Record<string, unknown>) =>
    api<{ data: Submission }>(`/api/v1/submissions/${id}/review`, { method: 'POST', body: JSON.stringify(payload) }),
  revision: (id: string, comment: string) =>
    api<{ data: Submission }>(`/api/v1/submissions/${id}/revision`, { method: 'POST', body: JSON.stringify({ comment }) }),
  approve: (id: string, payload: Record<string, unknown>) =>
    api<{ data: Submission }>(`/api/v1/submissions/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
}

export type DashboardData = {
  user: AuthUser
  trainer?: Record<string, number>
  participant: Record<string, unknown>
}

export type Program = {
  id: string
  title: string
  code: string
  description?: string
  duration_hours: number
  modules?: Module[]
}

export type Module = {
  id: string
  title: string
  description?: string
  lessons?: Lesson[]
}

export type Lesson = {
  id: string
  title: string
  type: string
  duration_minutes: number
  contents?: LessonContent[]
  quiz?: Quiz
  module?: { program?: Program }
}

export type LessonContent = {
  id: string
  kind: string
  title?: string
  body?: string
  url?: string
  lab_id?: string
}

export type Quiz = {
  id: string
  title: string
  passing_score: number
  questions: Array<{ id: string; prompt: string; options: string[]; sort_order: number }>
}

export type Lab = {
  id: string
  title: string
  description?: string
  project_template?: unknown
  steps: LabStep[]
}

export type LabStep = {
  id: string
  title: string
  instruction: string
  required_action: string
  validation_rule?: Record<string, unknown>
  hint?: string
  sort_order: number
}

export type Challenge = {
  id: string
  title: string
  description?: string
  difficulty: string
  duration_minutes: number
  passing_score: number
  maximum_score: number
  project_template?: unknown
  rules: Array<{ id: string; rule_id: string; name: string; type: string; config: Record<string, unknown>; weight: number }>
}

export type ProjectSummary = {
  id: string
  title: string
  code: string
  status: string
  updated_at: string
}

export type ProjectDetail = ProjectSummary & {
  document?: unknown
  owner?: { name: string }
  challenge?: Challenge
  lab?: Lab
  levels?: unknown[]
}

export type Submission = {
  id: string
  status: string
  auto_score?: number
  trainer_score?: number
  final_score?: number
  trainer_comment?: string
  project?: ProjectSummary
  user?: { name: string; email: string }
}

export type Issue = {
  id: string
  title: string
  description?: string
  severity: string
  status: string
  element_id?: string
  camera_state?: { position: number[]; target: number[]; zoom: number }
  created_by?: string
}

export type Version = { id: string; number: number; label: string; kind: string }
export type Competency = { id: string; name: string; slug: string; mvp_focus: boolean }
export type UserCompetency = { id: string; score: number; level: string; competency: Competency }
export type Certificate = {
  id: string
  certificate_number: string
  competency_level: string
  final_score: number
  issued_at: string
  verification_token: string
  program?: { title: string }
  organization?: { name: string }
}
export type PublicCertificate = {
  certificate_number: string
  participant: string
  program: string
  organization: string
  competency_level: string
  final_score: number
  issued_at: string
  verification_url: string
}
export type ValidationApiReport = {
  valid: boolean
  score: number
  errors: Array<{ code: string; elementId?: string; message: string }>
  warnings: Array<{ code: string; elementId?: string; message: string }>
  rules: Array<{ id: string; name: string; passed: boolean; message: string; weight: number }>
}
