import { describe, it, expect } from 'vitest'
import { formatUserType } from './formatters'

describe('formatUserType', () => {
  it('formats known types', () => {
    expect(formatUserType('superadmin')).toBe('Superadmin')
    expect(formatUserType('admin')).toBe('Admin')
    expect(formatUserType('user')).toBe('Usuario')
    expect(formatUserType('visitor')).toBe('Visitante')
  })

  it('capitalizes and replaces underscores for unknown types', () => {
    expect(formatUserType('custom_role')).toBe('Custom role')
    expect(formatUserType('unknown')).toBe('Unknown')
  })

  it('returns N/A for falsy values', () => {
    expect(formatUserType(null)).toBe('N/A')
    expect(formatUserType(undefined)).toBe('N/A')
    expect(formatUserType('')).toBe('N/A')
  })

  it('is case-insensitive', () => {
    expect(formatUserType('ADMIN')).toBe('Admin')
    expect(formatUserType('Admin')).toBe('Admin')
    expect(formatUserType('SUPERADMIN')).toBe('Superadmin')
  })
})
