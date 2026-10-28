import { create } from 'zustand'
import { AuthApi, getOrgId, setOrgId, setToken, type AuthUser } from '../services/api'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  bootstrap: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  async login(email, password) {
    set({ error: null })
    const res = await AuthApi.login(email, password)
    setToken(res.token)
    const orgId = res.user.current_organization_id || res.user.organizations[0]?.id || null
    setOrgId(orgId)
    set({ user: res.user, loading: false })
  },
  async bootstrap() {
    if (!getToken()) {
      set({ user: null, loading: false })
      return
    }
    try {
      const res = await AuthApi.me()
      if (!getOrgId() && res.data.current_organization_id) setOrgId(res.data.current_organization_id)
      set({ user: res.data, loading: false })
    } catch {
      setToken(null)
      set({ user: null, loading: false })
    }
  },
  async logout() {
    try {
      await AuthApi.logout()
    } catch {
      /* ignore */
    }
    setToken(null)
    setOrgId(null)
    set({ user: null })
  },
}))
