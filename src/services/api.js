import { useAuthStore } from '../store/useAuthStore'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'
let refreshInFlight = null

const handleJson = async (response) => {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.detail || 'Error en la solicitud.')
    error.detail = data.detail
    throw error
  }
  return data
}

const refreshAccessToken = async () => {
  if (refreshInFlight) {
    return refreshInFlight
  }
  refreshInFlight = (async () => {
    const {
      refreshToken,
      setAccessToken,
      setRefreshToken,
      setTokenType,
      resetAuth,
    } = useAuthStore.getState()
    if (!refreshToken) {
      resetAuth()
      return null
    }
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      resetAuth()
      return null
    }
    setAccessToken(data.access_token || '')
    setRefreshToken(data.refresh_token || '')
    setTokenType(data.token_type || 'bearer')
    return data.access_token || null
  })()
  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

const authFetch = async (url, options = {}) => {
  const response = await fetch(url, options)
  if (response.status !== 401 && response.status !== 403) {
    return response
  }
  const newToken = await refreshAccessToken()
  if (!newToken) {
    return response
  }
  const nextHeaders = {
    ...(options.headers || {}),
    Authorization: `${useAuthStore.getState().tokenType || 'bearer'} ${newToken}`,
  }
  return fetch(url, { ...options, headers: nextHeaders })
}

const login = async ({ username, password }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: username.trim(),
      password,
    }),
  })
  return handleJson(response)
}

const logout = async ({ tokenType, accessToken }) => {
  if (!accessToken) return
  await authFetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
}

const fetchUsers = async ({ tokenType, accessToken, isActive }) => {
  const params = new URLSearchParams()
  params.set('include', 'company,terminals')
  if (typeof isActive === 'boolean') {
    params.set('is_active', String(isActive))
  }
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/?${params.toString()}`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanies = async ({ tokenType, accessToken }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/companies/`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchEquipmentTypes = async ({ tokenType, accessToken }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-types/?include=creator,verification_types`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTypeById = async ({ tokenType, accessToken, equipmentTypeId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-types/${equipmentTypeId}?include=creator,inspection_items,verification_types`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipments = async ({ tokenType, accessToken }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment/?include=equipment_type,terminal,owner_company,inspections,verifications,calibrations`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentById = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment/${equipmentId}?include=equipment_type,terminal,owner_company,calibrations`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTypeHistory = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment/${equipmentId}/type-history`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTerminalHistory = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment/${equipmentId}/terminal-history`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentHistory = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment/${equipmentId}/history`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTypeInspectionItems = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-inspection-items/equipment-type/${equipmentTypeId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTypeVerificationItems = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  verificationTypeId,
}) => {
  const params = new URLSearchParams()
  if (verificationTypeId !== undefined && verificationTypeId !== null) {
    params.set('verification_type_id', String(verificationTypeId))
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-verification-items/equipment-type/${equipmentTypeId}${query}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchEquipmentTypeVerifications = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-verifications/equipment-type/${equipmentTypeId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createEquipmentInspection = async ({
  tokenType,
  accessToken,
  equipmentId,
  payload,
  replaceExisting = false,
}) => {
  const query = replaceExisting ? '?replace_existing=true' : ''
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-inspections/equipment/${equipmentId}${query}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const fetchEquipmentInspections = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-inspections/equipment/${equipmentId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const updateEquipmentInspection = async ({
  tokenType,
  accessToken,
  inspectionId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-inspections/${inspectionId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const createEquipmentVerification = async ({
  tokenType,
  accessToken,
  equipmentId,
  payload,
  replaceExisting = false,
}) => {
  const query = replaceExisting ? '?replace_existing=true' : ''
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-verifications/equipment/${equipmentId}${query}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const fetchEquipmentVerifications = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-verifications/equipment/${equipmentId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createEquipmentCalibration = async ({
  tokenType,
  accessToken,
  equipmentId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-calibrations/equipment/${equipmentId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const fetchEquipmentCalibrations = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-calibrations/equipment/${equipmentId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const updateEquipmentCalibration = async ({
  tokenType,
  accessToken,
  calibrationId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-calibrations/${calibrationId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const uploadEquipmentCalibrationCertificate = async ({
  tokenType,
  accessToken,
  calibrationId,
  file,
}) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-calibrations/${calibrationId}/certificate`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
      body: formData,
    }
  )
  return handleJson(response)
}

const calculateHydrometerApi60f = async ({
  tokenType,
  accessToken,
  temp_obs_f,
  lectura_api,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/hydrometer/api60f`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ temp_obs_f, lectura_api }),
    }
  )
  return handleJson(response)
}

const updateEquipmentVerification = async ({
  tokenType,
  accessToken,
  verificationId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-verifications/${verificationId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const createEquipmentTypeInspectionItem = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-inspection-items/equipment-type/${equipmentTypeId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const createEquipmentTypeVerification = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-verifications/equipment-type/${equipmentTypeId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const updateEquipmentTypeVerification = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  verificationTypeId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-verifications/equipment-type/${equipmentTypeId}/${verificationTypeId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const deleteEquipmentTypeVerification = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  verificationTypeId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-verifications/equipment-type/${equipmentTypeId}/${verificationTypeId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createEquipmentTypeInspectionItemsBulk = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-inspection-items/equipment-type/${equipmentTypeId}/bulk`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const updateEquipmentTypeInspectionItem = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  itemId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-inspection-items/equipment-type/${equipmentTypeId}/${itemId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const deleteEquipmentTypeInspectionItem = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  itemId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-type-inspection-items/equipment-type/${equipmentTypeId}/${itemId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createEquipmentType = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/equipment-types/`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const createEquipment = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/equipment/`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateEquipment = async ({ tokenType, accessToken, equipmentId, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/equipment/${equipmentId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const deleteEquipment = async ({ tokenType, accessToken, equipmentId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/equipment/${equipmentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const updateEquipmentType = async ({
  tokenType,
  accessToken,
  equipmentTypeId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-types/${equipmentTypeId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const deleteEquipmentType = async ({ tokenType, accessToken, equipmentTypeId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/equipment-types/${equipmentTypeId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchCompanyBlocks = async ({ tokenType, accessToken }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-blocks/?include=company`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchCompanyBlockById = async ({
  tokenType,
  accessToken,
  blockId,
  companyId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-blocks/${blockId}?include=company&company_id=${companyId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createCompanyBlock = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/company-blocks/`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateCompanyBlock = async ({ tokenType, accessToken, blockId, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/company-blocks/${blockId}`, {
    method: 'PUT',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const deleteCompanyBlock = async ({ tokenType, accessToken, blockId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/company-blocks/${blockId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanyTerminals = async ({ tokenType, accessToken }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-terminals/?include=block,owner_company,admin_company`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchCompanyTerminalById = async ({
  tokenType,
  accessToken,
  terminalId,
  ownerCompanyId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-terminals/${terminalId}?include=block,owner_company,admin_company&owner_company_id=${ownerCompanyId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createCompanyTerminal = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/company-terminals/`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateCompanyTerminal = async ({
  tokenType,
  accessToken,
  terminalId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-terminals/${terminalId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const deleteCompanyTerminal = async ({ tokenType, accessToken, terminalId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/company-terminals/${terminalId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const fetchExternalAnalysisTypes = async ({ tokenType, accessToken }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/external-analyses/types`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchExternalAnalysesByTerminal = async ({ tokenType, accessToken, terminalId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/terminal/${terminalId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const upsertExternalAnalysisTerminal = async ({
  tokenType,
  accessToken,
  terminalId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/terminal/${terminalId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const createExternalAnalysisRecord = async ({
  tokenType,
  accessToken,
  terminalId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/records/terminal/${terminalId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const fetchExternalAnalysisRecords = async ({
  tokenType,
  accessToken,
  terminalId,
  analysisTypeId,
}) => {
  const query = analysisTypeId ? `?analysis_type_id=${analysisTypeId}` : ''
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/records/terminal/${terminalId}${query}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const uploadExternalAnalysisReport = async ({
  tokenType,
  accessToken,
  recordId,
  file,
}) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/records/${recordId}/report`,
    {
      method: 'POST',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
      body: formData,
    }
  )
  return handleJson(response)
}

const updateExternalAnalysisRecord = async ({
  tokenType,
  accessToken,
  recordId,
  payload,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/records/${recordId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )
  return handleJson(response)
}

const deleteExternalAnalysisRecord = async ({
  tokenType,
  accessToken,
  recordId,
}) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/external-analyses/records/${recordId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createUser = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const uploadUserPhoto = async ({ tokenType, accessToken, userId, file }) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/${userId}/photo`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
    body: formData,
  })
  return handleJson(response)
}

const uploadMyPhoto = async ({ tokenType, accessToken, file }) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/me/photo`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
    body: formData,
  })
  return handleJson(response)
}

const updateUser = async ({ tokenType, accessToken, userId, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const fetchUserById = async ({ tokenType, accessToken, userId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/users/${userId}?include=company,terminals`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const deleteUser = async ({ tokenType, accessToken, userId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCurrentUser = async ({ tokenType, accessToken }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/me?include=company,terminals`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const updateMe = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/me`, {
    method: 'PUT',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateMyPassword = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/users/me/password`, {
    method: 'PUT',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (response.status === 204) {
    return { ok: true }
  }
  return handleJson(response)
}

const createCompany = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/companies/`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateCompany = async ({ tokenType, accessToken, companyId, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
    method: 'PUT',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const deleteCompany = async ({ tokenType, accessToken, companyId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanyById = async ({ tokenType, accessToken, companyId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchSamplesByTerminal = async ({ tokenType, accessToken, terminalId }) => {
  const response = await authFetch(
    `${apiBaseUrl}/api/v1/samples/terminal/${terminalId}`,
    {
      headers: {
        Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      },
    }
  )
  return handleJson(response)
}

const createSample = async ({ tokenType, accessToken, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/samples`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const updateSample = async ({ tokenType, accessToken, sampleId, payload }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/samples/${sampleId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleJson(response)
}

const deleteSample = async ({ tokenType, accessToken, sampleId }) => {
  const response = await authFetch(`${apiBaseUrl}/api/v1/samples/${sampleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  if (response.status === 204) {
    return { ok: true }
  }
  return handleJson(response)
}

export {
  createUser,
  fetchCompanies,
  fetchCurrentUser,
  fetchUsers,
  login,
  logout,
  updateUser,
  deleteUser,
  fetchUserById,
  uploadUserPhoto,
  updateMe,
  uploadMyPhoto,
  updateMyPassword,
  createCompany,
  updateCompany,
  deleteCompany,
  fetchCompanyById,
  fetchSamplesByTerminal,
  createSample,
  updateSample,
  deleteSample,
  fetchCompanyBlocks,
  fetchCompanyBlockById,
  createCompanyBlock,
  updateCompanyBlock,
  deleteCompanyBlock,
  fetchCompanyTerminals,
  fetchCompanyTerminalById,
  createCompanyTerminal,
  updateCompanyTerminal,
  deleteCompanyTerminal,
  fetchEquipmentTypes,
  fetchEquipmentTypeById,
  fetchEquipments,
  fetchEquipmentById,
  fetchEquipmentTypeHistory,
  fetchEquipmentTerminalHistory,
  fetchEquipmentHistory,
  fetchEquipmentTypeInspectionItems,
  fetchEquipmentTypeVerifications,
  fetchEquipmentTypeVerificationItems,
  createEquipmentInspection,
  createEquipmentVerification,
  fetchEquipmentVerifications,
  createEquipmentCalibration,
  fetchEquipmentInspections,
  fetchEquipmentCalibrations,
  updateEquipmentInspection,
  updateEquipmentVerification,
  updateEquipmentCalibration,
  uploadEquipmentCalibrationCertificate,
  calculateHydrometerApi60f,
  createEquipmentTypeVerification,
  updateEquipmentTypeVerification,
  deleteEquipmentTypeVerification,
  createEquipmentTypeInspectionItem,
  createEquipmentTypeInspectionItemsBulk,
  updateEquipmentTypeInspectionItem,
  deleteEquipmentTypeInspectionItem,
  createEquipmentType,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  updateEquipmentType,
  deleteEquipmentType,
  fetchExternalAnalysisTypes,
  fetchExternalAnalysesByTerminal,
  upsertExternalAnalysisTerminal,
  createExternalAnalysisRecord,
  fetchExternalAnalysisRecords,
  uploadExternalAnalysisReport,
  updateExternalAnalysisRecord,
  deleteExternalAnalysisRecord,
}
