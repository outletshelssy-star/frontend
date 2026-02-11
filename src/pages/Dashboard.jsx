import { useCallback, useEffect, useState } from 'react'
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
import CompaniesTable from '../components/CompaniesTable'
import CompanyBlocksTable from '../components/CompanyBlocksTable'
import CompanyTerminalsTable from '../components/CompanyTerminalsTable'
import EquipmentTypesTable from '../components/EquipmentTypesTable'
import EquipmentsTable from '../components/EquipmentsTable'

const Dashboard = () => {
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
  const [statusFilter, setStatusFilter] = useState('all')

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

  // currentUser is loaded in AppRoutes session validation

  useEffect(() => {
    if (!currentUser) return
    if (activeSection) return
    setActiveSection('profile')
  }, [currentUser, activeSection, setActiveSection])

  const refreshUsers = useCallback(async (statusFilter = 'all') => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeUsers = role === 'admin' || role === 'superadmin'

    if (!accessToken || !canSeeUsers) {
      setUsers([])
      setUsersError('')
      setIsUsersLoading(false)
      return
    }

    setIsUsersLoading(true)
    setUsersError('')

    try {
      const isActive =
        statusFilter === 'all' ? undefined : statusFilter === 'active'
      const data = await fetchUsers({ tokenType, accessToken, isActive })
      setUsers(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setUsersError(data.message)
      }
    } catch (err) {
      setUsers([])
      setUsersError(err?.detail || 'Error de red al cargar usuarios.')
    } finally {
      setIsUsersLoading(false)
    }
  }, [
    accessToken,
    tokenType,
    currentUser,
    setUsers,
    setUsersError,
    setIsUsersLoading,
  ])

  const refreshCompanies = useCallback(async () => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeCompanies =
      role === 'admin' || role === 'superadmin' || role === 'user'

    if (!accessToken || !canSeeCompanies) {
      setCompanies([])
      setCompaniesError('')
      setIsCompaniesLoading(false)
      return
    }

    setIsCompaniesLoading(true)
    setCompaniesError('')

    try {
      const data = await fetchCompanies({ tokenType, accessToken })
      setCompanies(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setCompaniesError(data.message)
      }
    } catch (err) {
      setCompanies([])
      setCompaniesError(err?.detail || 'Error de red al cargar empresas.')
    } finally {
      setIsCompaniesLoading(false)
    }
  }, [accessToken, tokenType, currentUser])

  const refreshBlocks = useCallback(async () => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeBlocks = role === 'admin' || role === 'superadmin'

    if (!accessToken || !canSeeBlocks) {
      setBlocks([])
      setBlocksError('')
      setIsBlocksLoading(false)
      return
    }

    setIsBlocksLoading(true)
    setBlocksError('')

    try {
      const data = await fetchCompanyBlocks({ tokenType, accessToken })
      setBlocks(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setBlocksError(data.message)
      }
    } catch (err) {
      setBlocks([])
      setBlocksError(err?.detail || 'Error de red al cargar bloques.')
    } finally {
      setIsBlocksLoading(false)
    }
  }, [accessToken, tokenType, currentUser])

  const refreshTerminals = useCallback(async () => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeAllTerminals = role === 'admin' || role === 'superadmin'
    const canSeeOwnTerminals = role === 'user'

    if (!accessToken || (!canSeeAllTerminals && !canSeeOwnTerminals)) {
      setTerminals([])
      setTerminalsError('')
      setIsTerminalsLoading(false)
      return
    }

    if (canSeeOwnTerminals) {
      const ownTerminals = Array.isArray(currentUser?.terminals)
        ? currentUser.terminals
        : []
      setTerminals(ownTerminals)
      setTerminalsError('')
      setIsTerminalsLoading(false)
      return
    }

    setIsTerminalsLoading(true)
    setTerminalsError('')

    try {
      const data = await fetchCompanyTerminals({ tokenType, accessToken })
      setTerminals(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setTerminalsError(data.message)
      }
    } catch (err) {
      setTerminals([])
      setTerminalsError(err?.detail || 'Error de red al cargar terminales.')
    } finally {
      setIsTerminalsLoading(false)
    }
  }, [accessToken, tokenType, currentUser])

  const refreshEquipmentTypes = useCallback(async () => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeEquipmentTypes =
      role === 'admin' || role === 'superadmin' || role === 'user'

    if (!accessToken || !canSeeEquipmentTypes) {
      setEquipmentTypes([])
      setEquipmentTypesError('')
      setIsEquipmentTypesLoading(false)
      return
    }

    setIsEquipmentTypesLoading(true)
    setEquipmentTypesError('')

    try {
      const data = await fetchEquipmentTypes({ tokenType, accessToken })
      setEquipmentTypes(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setEquipmentTypesError(data.message)
      }
    } catch (err) {
      setEquipmentTypes([])
      setEquipmentTypesError(err?.detail || 'Error de red al cargar tipos de equipo.')
    } finally {
      setIsEquipmentTypesLoading(false)
    }
  }, [accessToken, tokenType, currentUser])

  const refreshEquipments = useCallback(async () => {
    const role = String(currentUser?.user_type || '').toLowerCase()
    const canSeeEquipments = role === 'admin' || role === 'superadmin' || role === 'user'

    if (!accessToken || !canSeeEquipments) {
      setEquipments([])
      setEquipmentsError('')
      setIsEquipmentsLoading(false)
      return
    }

    setIsEquipmentsLoading(true)
    setEquipmentsError('')

    try {
      const data = await fetchEquipments({ tokenType, accessToken })
      setEquipments(Array.isArray(data.items) ? data.items : [])
      if (data.message && !data.items?.length) {
        setEquipmentsError(data.message)
      }
    } catch (err) {
      setEquipments([])
      setEquipmentsError(err?.detail || 'Error de red al cargar equipos.')
    } finally {
      setIsEquipmentsLoading(false)
    }
  }, [accessToken, tokenType, currentUser])

  useEffect(() => {
    refreshUsers(statusFilter)
  }, [refreshUsers, statusFilter])

  useEffect(() => {
    if (activeSection === 'companies' || activeSection === 'blocks') {
      refreshCompanies()
    }
  }, [activeSection, refreshCompanies])

  useEffect(() => {
    if (activeSection === 'blocks') {
      refreshBlocks()
    }
  }, [activeSection, refreshBlocks])

  useEffect(() => {
    if (activeSection === 'terminals') {
      refreshCompanies()
      refreshBlocks()
      refreshTerminals()
    }
  }, [activeSection, refreshCompanies, refreshBlocks, refreshTerminals])

  useEffect(() => {
    if (activeSection === 'equipment-types') {
      refreshEquipmentTypes()
    }
  }, [activeSection, refreshEquipmentTypes])

  useEffect(() => {
    if (activeSection === 'equipment') {
      refreshEquipments()
      refreshEquipmentTypes()
      refreshCompanies()
      refreshTerminals()
    }
  }, [activeSection, refreshEquipments, refreshEquipmentTypes, refreshCompanies, refreshTerminals])

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
      {activeSection === 'users' ? (
        <UsersTable
          users={users}
          usersError={usersError}
          isUsersLoading={isUsersLoading}
          formatUserType={formatUserType}
          tokenType={tokenType}
          accessToken={accessToken}
          onUserCreated={refreshUsers}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      ) : activeSection === 'companies' ? (
        <CompaniesTable
          companies={companies}
          companiesError={companiesError}
          isCompaniesLoading={isCompaniesLoading}
          tokenType={tokenType}
          accessToken={accessToken}
          onCompanyChanged={refreshCompanies}
        />
      ) : activeSection === 'blocks' ? (
        <CompanyBlocksTable
          blocks={blocks}
          blocksError={blocksError}
          isBlocksLoading={isBlocksLoading}
          companies={companies}
          tokenType={tokenType}
          accessToken={accessToken}
          onBlockChanged={refreshBlocks}
        />
      ) : activeSection === 'terminals' ? (
        <CompanyTerminalsTable
          terminals={terminals}
          terminalsError={terminalsError}
          isTerminalsLoading={isTerminalsLoading}
          companies={companies}
          blocks={blocks}
          tokenType={tokenType}
          accessToken={accessToken}
          onTerminalChanged={refreshTerminals}
        />
      ) : activeSection === 'equipment-types' ? (
        <EquipmentTypesTable
          equipmentTypes={equipmentTypes}
          equipmentTypesError={equipmentTypesError}
          isEquipmentTypesLoading={isEquipmentTypesLoading}
          tokenType={tokenType}
          accessToken={accessToken}
          onEquipmentTypeChanged={refreshEquipmentTypes}
        />
        ) : activeSection === 'equipment' ? (
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
            onEquipmentChanged={refreshEquipments}
          />
      ) : (
        <ProfileSection
          currentUser={currentUser}
          currentUserError={currentUserError}
          formatUserType={formatUserType}
          tokenType={tokenType}
          accessToken={accessToken}
          onProfileUpdated={setCurrentUser}
        />
      )}
    </DashboardLayout>
  )
}

export default Dashboard
