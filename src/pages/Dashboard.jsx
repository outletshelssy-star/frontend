import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { useAuthStore } from '../store/useAuthStore'
import { useUsersStore } from '../store/useUsersStore'
import { useUiStore } from '../store/useUiStore'
import {
  fetchCompanies,
  fetchCompanyBlocks,
  fetchCompanyTerminals,
  fetchCurrentUser,
  fetchEquipments,
  fetchEquipmentTypes,
  fetchUsers,
  logout,
} from '../services/api'
import { formatUserType } from '../utils/formatters'
import Sidebar from '../components/Sidebar'
import UsersTable from '../components/UsersTable'
import ProfileSection from '../components/ProfileSection'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSummary from '../components/DashboardSummary'
import CompaniesTable from '../components/CompaniesTable'
import CompanyBlocksTable from '../components/CompanyBlocksTable'
import CompanyTerminalsTable from '../components/CompanyTerminalsTable'
import EquipmentTypesTable from '../components/EquipmentTypesTable'
import EquipmentsTable from '../components/EquipmentsTable'
import SamplesTable from '../components/SamplesTable'
import ExternalAnalysesTable from '../components/ExternalAnalysesTable'
import PruebaPage from '../components/PruebaPage'

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
  const {
    activeSection,
    isSidebarCollapsed,
    setActiveSection,
    setIsSidebarCollapsed,
    resetUi,
  } = useUiStore()
  const role = String(currentUser?.user_type || '').toLowerCase()
  const canSeeUsers = role === 'admin' || role === 'superadmin'
  const [companies, setCompanies] = useState([])
  const [companiesError, setCompaniesError] = useState('')
  const [isCompaniesLoading, setIsCompaniesLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [blocksError, setBlocksError] = useState('')
  const [isBlocksLoading, setIsBlocksLoading] = useState(false)
  const [terminals, setTerminals] = useState([])
  const [terminalsError, setTerminalsError] = useState('')
  const [isTerminalsLoading, setIsTerminalsLoading] = useState(false)
  const [equipmentTypes, setEquipmentTypes] = useState([])
  const [equipmentTypesError, setEquipmentTypesError] = useState('')
  const [isEquipmentTypesLoading, setIsEquipmentTypesLoading] = useState(false)
  const [equipments, setEquipments] = useState([])
  const [equipmentsError, setEquipmentsError] = useState('')
  const [isEquipmentsLoading, setIsEquipmentsLoading] = useState(false)
  const getStoredFilterValue = (key, fallback) => {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    try {
      return JSON.parse(raw)
    } catch (err) {
      return raw
    }
  }

  const [statusFilter, setStatusFilter] = useState(() =>
    getStoredFilterValue('users.filters.status', 'all')
  )
  const lastUserIdRef = useRef(null)

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

  const loadCompanies = useCallback(async () => {
    if (!accessToken) return
    setIsCompaniesLoading(true)
    setCompaniesError('')
    try {
      const data = await fetchCompanies({ tokenType, accessToken })
      setCompanies(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setCompaniesError(err?.detail || 'No se pudieron cargar las empresas.')
    } finally {
      setIsCompaniesLoading(false)
    }
  }, [accessToken, tokenType])

  const loadBlocks = useCallback(async () => {
    if (!accessToken) return
    setIsBlocksLoading(true)
    setBlocksError('')
    try {
      const data = await fetchCompanyBlocks({ tokenType, accessToken })
      setBlocks(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setBlocksError(err?.detail || 'No se pudieron cargar los bloques.')
    } finally {
      setIsBlocksLoading(false)
    }
  }, [accessToken, tokenType])

  const loadTerminals = useCallback(async () => {
    if (!accessToken) return
    setIsTerminalsLoading(true)
    setTerminalsError('')
    try {
      const data = await fetchCompanyTerminals({ tokenType, accessToken })
      setTerminals(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setTerminalsError(err?.detail || 'No se pudieron cargar los terminales.')
    } finally {
      setIsTerminalsLoading(false)
    }
  }, [accessToken, tokenType])

  const loadEquipmentTypes = useCallback(async () => {
    if (!accessToken) return
    setIsEquipmentTypesLoading(true)
    setEquipmentTypesError('')
    try {
      const data = await fetchEquipmentTypes({ tokenType, accessToken })
      setEquipmentTypes(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setEquipmentTypesError(err?.detail || 'No se pudieron cargar los tipos de equipo.')
    } finally {
      setIsEquipmentTypesLoading(false)
    }
  }, [accessToken, tokenType])

  const loadEquipments = useCallback(async () => {
    if (!accessToken) return
    setIsEquipmentsLoading(true)
    setEquipmentsError('')
    try {
      const data = await fetchEquipments({ tokenType, accessToken })
      setEquipments(Array.isArray(data?.items) ? data.items : [])
    } catch (err) {
      setEquipmentsError(err?.detail || 'No se pudieron cargar los equipos.')
    } finally {
      setIsEquipmentsLoading(false)
    }
  }, [accessToken, tokenType])

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
      setActiveSection('profile')
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
        loadEquipments()
        break
      case 'users':
        if (canSeeUsers) {
          loadUsers()
        }
        break
      case 'terminals':
        loadCompanies()
        loadBlocks()
        loadTerminals()
        break
      case 'equipment-types':
        loadEquipmentTypes()
        break
      case 'equipment':
        loadEquipmentTypes()
        loadCompanies()
        loadTerminals()
        loadEquipments()
        break
      case 'samples':
        loadTerminals()
        loadEquipments()
        break
      case 'external-analyses':
        loadTerminals()
        loadCompanies()
        break
      case 'prueba':
        loadCompanies()
        loadBlocks()
        loadTerminals()
        break
      case 'profile':
      default:
        break
    }
  }, [
    accessToken,
    activeSection,
    loadUsers,
    loadCompanies,
    loadBlocks,
    loadTerminals,
    loadEquipmentTypes,
    loadEquipments,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'users.filters.status',
      JSON.stringify(statusFilter)
    )
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
              tokenType={tokenType}
              accessToken={accessToken}
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
            tokenType={tokenType}
            accessToken={accessToken}
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
            tokenType={tokenType}
            accessToken={accessToken}
            onTerminalChanged={loadTerminals}
          />
        )
      case 'equipment-types':
        return (
          <EquipmentTypesTable
            equipmentTypes={equipmentTypes}
            equipmentTypesError={equipmentTypesError}
            isEquipmentTypesLoading={isEquipmentTypesLoading}
            tokenType={tokenType}
            accessToken={accessToken}
            onEquipmentTypeChanged={loadEquipmentTypes}
          />
        )
      case 'equipment':
        return (
          <EquipmentsTable
            equipments={equipments}
            equipmentsError={equipmentsError}
            isEquipmentsLoading={isEquipmentsLoading}
            equipmentTypes={equipmentTypes}
            companies={companies}
            terminals={terminals}
            currentUser={currentUser}
            tokenType={tokenType}
            accessToken={accessToken}
            onEquipmentChanged={loadEquipments}
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
          <SamplesTable
            terminals={terminals}
            equipments={equipments}
            currentUser={currentUser}
            tokenType={tokenType}
            accessToken={accessToken}
          />
        )
      case 'external-analyses':
        return (
          <ExternalAnalysesTable
            terminals={terminals}
            companies={companies}
            currentUser={currentUser}
            tokenType={tokenType}
            accessToken={accessToken}
          />
        )
      case 'prueba':
        return (
          <PruebaPage
            companies={companies}
            companiesError={companiesError}
            isCompaniesLoading={isCompaniesLoading}
            blocks={blocks}
            blocksError={blocksError}
            isBlocksLoading={isBlocksLoading}
            terminals={terminals}
            terminalsError={terminalsError}
            isTerminalsLoading={isTerminalsLoading}
            tokenType={tokenType}
            accessToken={accessToken}
            onCompanyChanged={loadCompanies}
            onBlockChanged={loadBlocks}
            onTerminalChanged={loadTerminals}
          />
        )
      case 'profile':
      default:
        return (
          <ProfileSection
            currentUser={currentUser}
            currentUserError={currentUserError}
            formatUserType={formatUserType}
            tokenType={tokenType}
            accessToken={accessToken}
            onProfileUpdated={loadCurrentUser}
          />
        )
    }
  }

  return (
    <DashboardLayout
      isCollapsed={isSidebarCollapsed}
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
