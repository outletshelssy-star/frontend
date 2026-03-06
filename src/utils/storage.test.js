import { describe, it, expect, beforeEach } from 'vitest'
import { getStoredFilterValue } from './storage'

describe('getStoredFilterValue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns fallback when key is absent', () => {
    expect(getStoredFilterValue('missing-key', 'default')).toBe('default')
  })

  it('returns parsed object for valid JSON', () => {
    localStorage.setItem('my-key', JSON.stringify({ foo: 'bar' }))
    expect(getStoredFilterValue('my-key', null)).toEqual({ foo: 'bar' })
  })

  it('returns raw string for invalid JSON', () => {
    localStorage.setItem('bad-json', '{not valid json}')
    expect(getStoredFilterValue('bad-json', null)).toBe('{not valid json}')
  })

  it('returns simple string for non-JSON string', () => {
    localStorage.setItem('plain', 'hello')
    expect(getStoredFilterValue('plain', null)).toBe('hello')
  })
})
