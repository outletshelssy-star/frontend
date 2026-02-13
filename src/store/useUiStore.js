import { create } from 'zustand'

const getInitialSection = () => {
  if (typeof window === 'undefined') return 'dashboard'
  return window.localStorage.getItem('ui.activeSection') || 'dashboard'
}

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('ui.sidebarCollapsed') === 'true'
}

const initialUiState = {
  activeSection: getInitialSection(),
  isSidebarCollapsed: getInitialSidebarState(),
}

const useUiStore = create((set) => ({
  ...initialUiState,
  setActiveSection: (activeSection) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ui.activeSection', activeSection)
    }
    set({ activeSection })
  },
  setIsSidebarCollapsed: (valueOrUpdater) =>
    set((state) => {
      const nextValue =
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(state.isSidebarCollapsed)
          : valueOrUpdater
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ui.sidebarCollapsed', String(nextValue))
      }
      return { isSidebarCollapsed: nextValue }
    }),
  resetUi: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ui.activeSection')
      window.localStorage.removeItem('ui.sidebarCollapsed')
    }
    set({ ...initialUiState })
  },
}))

export { useUiStore }
