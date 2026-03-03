import { create } from 'zustand'

const initialUsersState = {
  users: [],
  usersError: '',
  isUsersLoading: false,
}

const useUsersStore = create((set) => ({
  ...initialUsersState,
  setUsers: (users) => set({ users }),
  setUsersError: (usersError) => set({ usersError }),
  setIsUsersLoading: (isUsersLoading) => set({ isUsersLoading }),
  resetUsers: () => set({ ...initialUsersState }),
}))

export { useUsersStore }
