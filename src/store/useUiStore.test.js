import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from './useUiStore'

beforeEach(() => {
  localStorage.clear()
  useUiStore.setState({ activeSection: 'dashboard', isSidebarCollapsed: false })
})

describe('useUiStore', () => {
  it('has correct initial state', () => {
    const state = useUiStore.getState()
    expect(state.activeSection).toBe('dashboard')
    expect(state.isSidebarCollapsed).toBe(false)
  })

  it('setActiveSection updates state and localStorage', () => {
    useUiStore.getState().setActiveSection('users')
    expect(useUiStore.getState().activeSection).toBe('users')
    expect(localStorage.getItem('ui.activeSection')).toBe('users')
  })

  it('setIsSidebarCollapsed updates with a boolean', () => {
    useUiStore.getState().setIsSidebarCollapsed(true)
    expect(useUiStore.getState().isSidebarCollapsed).toBe(true)
    expect(localStorage.getItem('ui.sidebarCollapsed')).toBe('true')
  })

  it('setIsSidebarCollapsed toggles with an updater function', () => {
    useUiStore.getState().setIsSidebarCollapsed(false)
    useUiStore.getState().setIsSidebarCollapsed((prev) => !prev)
    expect(useUiStore.getState().isSidebarCollapsed).toBe(true)
  })

  it('resetUi clears localStorage and resets state', () => {
    useUiStore.getState().setActiveSection('equipment')
    useUiStore.getState().setIsSidebarCollapsed(true)

    useUiStore.getState().resetUi()

    expect(useUiStore.getState().activeSection).toBe('dashboard')
    expect(useUiStore.getState().isSidebarCollapsed).toBe(false)
    expect(localStorage.getItem('ui.activeSection')).toBeNull()
    expect(localStorage.getItem('ui.sidebarCollapsed')).toBeNull()
  })
})
