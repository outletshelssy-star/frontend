import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialAuthState = {
  username: '',
  password: '',
  error: '',
  isLoggedIn: false,
  isLoading: false,
  tokenType: '',
  accessToken: '',
  refreshToken: '',
  currentUser: null,
  currentUserError: '',
}

const useAuthStore = create(
  persist(
    (set) => ({
      ...initialAuthState,
      setUsername: (username) => set({ username }),
      setPassword: (password) => set({ password }),
      setError: (error) => set({ error }),
      setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setTokenType: (tokenType) => set({ tokenType }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      setCurrentUserError: (currentUserError) => set({ currentUserError }),
      resetAuth: () => set({ ...initialAuthState }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        tokenType: state.tokenType,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentUser: state.currentUser,
      }),
    }
  )
)

export { useAuthStore }
