import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { normalizeErrorDetail, refreshAccessToken } from './api'
import { useAuthStore } from '../store/useAuthStore'

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

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('normalizeErrorDetail', () => {
  it('returns string detail as-is', () => {
    expect(normalizeErrorDetail('something went wrong')).toBe('something went wrong')
  })

  it('formats array of validation error objects', () => {
    const detail = [{ loc: ['body', 'email'], msg: 'field required' }]
    const result = normalizeErrorDetail(detail)
    expect(result).toBe('email: field required')
  })

  it('filters "body" from location path', () => {
    const detail = [{ loc: ['body', 'username'], msg: 'invalid' }]
    expect(normalizeErrorDetail(detail)).toBe('username: invalid')
  })

  it('returns fallback for null', () => {
    expect(normalizeErrorDetail(null)).toBe('Error en la solicitud.')
  })

  it('returns fallback for undefined', () => {
    expect(normalizeErrorDetail(undefined)).toBe('Error en la solicitud.')
  })

  it('joins multiple errors with pipe separator', () => {
    const detail = [
      { loc: ['body', 'email'], msg: 'required' },
      { loc: ['body', 'password'], msg: 'too short' },
    ]
    expect(normalizeErrorDetail(detail)).toBe('email: required | password: too short')
  })
})

describe('refreshAccessToken', () => {
  it('calls resetAuth and returns null when no refreshToken in store', async () => {
    useAuthStore.setState({ refreshToken: '', isLoggedIn: true, accessToken: 'old' })

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().accessToken).toBe('')
  })

  it('calls resetAuth when fetch returns non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      }),
    )

    useAuthStore.setState({ refreshToken: 'valid-token', isLoggedIn: true, accessToken: 'old' })

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('')
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
  })

  it('calls resetAuth after timeout when fetch never resolves', async () => {
    vi.useFakeTimers()

    vi.stubGlobal(
      'fetch',
      vi.fn((_url, opts) => {
        return new Promise((_, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
      }),
    )

    useAuthStore.setState({ refreshToken: 'valid-token', isLoggedIn: true, accessToken: 'old' })

    const promise = refreshAccessToken()
    await vi.advanceTimersByTimeAsync(8001)
    await promise

    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().accessToken).toBe('')
  })
})
