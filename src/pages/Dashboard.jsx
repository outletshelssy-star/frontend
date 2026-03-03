import { useCallback, useEffect, useRef, useState } from 'react'
import { getStoredFilterValue } from '../utils/storage'
import { Box, Typography } from '@mui/material'
import { useAuthStore } from '../store/useAuthStore'
import { useUsersStore } from '../store/useUsersStore'
import { useUiStore } from '../store/useUiStore'
import { useCompanyBlocksQuery } from '../hooks/useCompanyBlocksQuery'
import { useCompanyTerminalsQuery } from '../hooks/useCompanyTerminalsQuery'
import { useEquipmentTypesQuery } from '../hooks/useEquipmentTypesQuery'
import { useEquipmentsQuery } from '../hooks/useEquipmentsQuery'
import { useCompaniesQuery } from '../hooks/useCompaniesQuery'
import { fetchCurrentUser, fetchEquipments, fetchUsers, logout } from '../services/api'
import { formatUserType } from '../utils/formatters'
import Sidebar from '../components/Sidebar'
import UsersTable from '../components/users/UsersTable'
import ProfileSection from '../components/ProfileSection'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSummary from '../components/DashboardSummary'
import CompaniesTable from '../components/companies/CompaniesTable'
import CompanyBlocksTable from '../components/blocks/CompanyBlocksTable'
import CompanyTerminalsTable from '../components/terminals/CompanyTerminalsTable'
import EquipmentTypesTable from '../components/equipmentTypes/EquipmentTypesTable'
import EquipmentsTable from '../components/equipments/EquipmentsTable'
import SamplesTable from '../components/samples/SamplesTable'
import ExternalAnalysesTable from '../components/externalAnalyses/ExternalAnalysesTable'
import CompaniesSection from '../components/CompaniesSection'

const DashBoard = () => {
  const {
    username,
    tokenType,
    accessToken,
    currentUser,
    currentUserError,
    setCurrentUser,
    setCurrentUserError,
    resetAuth,
  } = useAuthStore()
  const {
    users,
    usersError,
    isUsersLoading,
    setUsers,
    setUsersError,
    setIsUsersLoading,
    resetUsers,
  } = useUsersStore()
  const { activeSection, isSidebarCollapsed, setActiveSection, setIsSidebarCollapsed, resetUi } =
    useUiStore()
  const role = String(currentUser?.user_type || '').toLowerCase()
  const canSeeUsers = role === 'admin' || role === 'superadmin'
  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('users.filters.status', 'all'),
  )
  const lastUserIdRef = useRef(null)
  const { data: companies = [] } = useCompaniesQuery()
  const { data: blocks = [] } = useCompanyBlocksQuery()
  const terminalsEnabled = [
    'terminals',
    'equipment',
    'samples',
    'external-analyses',
    'companies',
  ].includes(activeSection)
  const {
    data: terminals = [],
    isLoading: isTerminalsLoading,
    error: terminalsError,
  } = useCompanyTerminalsQuery({ enabled: terminalsEnabled })
  const equipmentTypesEnabled = ['equipment-types', 'equipment'].includes(activeSection)
  const { data: equipmentTypes = [] } = useEquipmentTypesQuery({ enabled: equipmentTypesEnabled })
  const equipmentsEnabled = ['dashboard', 'equipment', 'samples'].includes(activeSection)
  const {
    data: equipments = [],
    isLoading: isEquipmentsLoading,
    error: equipmentsError,
  } = useEquipmentsQuery({ enabled: equipmentsEnabled })
  const handleLogout = async () => {
    try {
      await logout({ tokenType, accessToken })
    } catch (err) {
      // Ignore network errors on logout; still clear local session.
    }
    resetUsers()
    resetUi()
    resetAuth()
  }

  const loadCurrentUser = useCallback(async () => {
    if (!accessToken) return
    try {
      const data = await fetchCurrentUser({ tokenType, accessToken })
      setCurrentUser(data)
      setCurrentUserError('')
    } catch (err) {
      setCurrentUserError(err?.detail || 'No se pudo cargar el usuario actual.')
    }
  }, [accessToken, tokenType, setCurrentUser, setCurrentUserError])

  const loadUsers = useCallback(async () => {
    if (!accessToken || !canSeeUsers) return
    setIsUsersLoading(true)
    setUsersError('')
    try {
      const data = await fetchUsers({ tokenType, accessToken })
      setUsers(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setUsersError(err?.detail || 'No se pudieron cargar los usuarios.')
    } finally {
      setIsUsersLoading(false)
    }
  }, [accessToken, tokenType, setIsUsersLoading, setUsersError, setUsers, canSeeUsers])
  useEffect(() => {
    if (!accessToken) return
    loadCurrentUser()
  }, [accessToken, loadCurrentUser])

  useEffect(() => {
    if (!currentUser?.id) return
    if (lastUserIdRef.current === currentUser.id) return
    lastUserIdRef.current = currentUser.id
    const userRole = String(currentUser.user_type || '').toLowerCase()
    if (userRole === 'visitor') {
      if (typeof window !== 'undefined') {
        const savedSection = window.localStorage.getItem('ui.activeSection')
        if (!savedSection) {
          setActiveSection('profile')
        }
      } else {
        setActiveSection('profile')
      }
      return
    }
    if (typeof window !== 'undefined') {
      const savedSection = window.localStorage.getItem('ui.activeSection')
      if (savedSection) {
        return
      }
    }
    setActiveSection('dashboard')
  }, [currentUser, setActiveSection])

  useEffect(() => {
    if (!accessToken) return
    switch (activeSection) {
      case 'dashboard':
        if (canSeeUsers) {
          loadUsers()
        }

        break
      case 'users':
        if (canSeeUsers) {
          loadUsers()
        }
        break
      case 'terminals':
        break
      case 'equipment-types':
        break
      case 'equipment':
        break
      case 'samples':
        break
      case 'external-analyses':
        break
      case 'companies':
        break
      case 'profile':
      default:
        break
    }
  }, [accessToken, activeSection, loadUsers])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('users.filters.status', JSON.stringify(statusFilter))
  }, [statusFilter])

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardSummary
            username={username}
            usersCount={users.length}
            isUsersLoading={isUsersLoading}
            equipments={equipments}
            isEquipmentsLoading={isEquipmentsLoading}
            onLogout={handleLogout}
          />
        )
      case 'users':
        if (!canSeeUsers) {
          return (
            <ProfileSection
              currentUser={currentUser}
              currentUserError={currentUserError}
              formatUserType={formatUserType}
              onProfileUpdated={loadCurrentUser}
            />
          )
        }
        return (
          <UsersTable
            users={users}
            usersError={usersError}
            isUsersLoading={isUsersLoading}
            formatUserType={formatUserType}
            onUserCreated={loadUsers}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        )
      case 'terminals':
        return (
          <CompanyTerminalsTable
            terminals={terminals}
            terminalsError={terminalsError}
            isTerminalsLoading={isTerminalsLoading}
            companies={companies}
            blocks={blocks}
          />
        )
      case 'equipment-types':
        return <EquipmentTypesTable currentUser={currentUser} />
      case 'equipment':
        return (
          <EquipmentsTable
            equipmentTypes={equipmentTypes}
            companies={companies}
            terminals={terminals}
            currentUser={currentUser}
          />
        )
      case 'reports':
        return (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
              Reportes
            </Typography>
            <Typography color="text.secondary">Bienvenidos a reportes.</Typography>
          </Box>
        )
      case 'samples':
        return (
          <SamplesTable terminals={terminals} equipments={equipments} currentUser={currentUser} />
        )
      case 'external-analyses':
        return (
          <ExternalAnalysesTable
            terminals={terminals}
            companies={companies}
            currentUser={currentUser}
          />
        )
      case 'companies':
        return <CompaniesSection companies={companies} />
      case 'profile':
      default:
        return (
          <ProfileSection
            currentUser={currentUser}
            currentUserError={currentUserError}
            formatUserType={formatUserType}
            onProfileUpdated={loadCurrentUser}
          />
        )
    }
  }

  return (
    <DashboardLayout
      isCollapsed={isSidebarCollapsed}
      onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      sidebar={
        <Sidebar
          currentUser={currentUser}
          currentUserError={currentUserError}
          activeSection={activeSection}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  )
}

export default DashBoard
