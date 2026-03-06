import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './useAuthStore'

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

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ ...initialAuthState })
})

describe('useAuthStore', () => {
  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.accessToken).toBe('')
    expect(state.refreshToken).toBe('')
    expect(state.currentUser).toBeNull()
    expect(state.username).toBe('')
  })

  it('setUsername updates username', () => {
    useAuthStore.getState().setUsername('john')
    expect(useAuthStore.getState().username).toBe('john')
  })

  it('setAccessToken updates accessToken', () => {
    useAuthStore.getState().setAccessToken('my-token')
    expect(useAuthStore.getState().accessToken).toBe('my-token')
  })

  it('setIsLoggedIn updates isLoggedIn', () => {
    useAuthStore.getState().setIsLoggedIn(true)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
  })

  it('setCurrentUser updates currentUser', () => {
    const user = { id: 1, name: 'John' }
    useAuthStore.getState().setCurrentUser(user)
    expect(useAuthStore.getState().currentUser).toEqual(user)
  })

  it('resetAuth returns to initial state', () => {
    useAuthStore.getState().setAccessToken('token')
    useAuthStore.getState().setIsLoggedIn(true)
    useAuthStore.getState().setCurrentUser({ id: 1 })

    useAuthStore.getState().resetAuth()

    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.accessToken).toBe('')
    expect(state.currentUser).toBeNull()
  })
})
