import { useAuthStore } from '../store/useAuthStore'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'

const handleJson = async (response) => {
  const data = await response.json().catch(() => ({}))

  if (response.status === 401 || response.status === 403) {
    const { resetAuth } = useAuthStore.getState()
    resetAuth()
  }

  if (!response.ok) {
    const error = new Error(data.detail || 'Error en la solicitud.')
    error.detail = data.detail
    throw error
  }
  return data
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
  await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users/?${params.toString()}`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanies = async ({ tokenType, accessToken }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/companies/`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchEquipmentTypes = async ({ tokenType, accessToken }) => {
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
    `${apiBaseUrl}/api/v1/equipment/${equipmentId}?include=equipment_type,terminal,owner_company,calibrations`,
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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

const createEquipmentCalibration = async ({
  tokenType,
  accessToken,
  equipmentId,
  payload,
}) => {
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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

const updateEquipmentVerification = async ({
  tokenType,
  accessToken,
  verificationId,
  payload,
}) => {
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(`${apiBaseUrl}/api/v1/equipment-types/`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/equipment/`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/equipment/${equipmentId}`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/equipment/${equipmentId}`, {
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(`${apiBaseUrl}/api/v1/company-blocks/`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/company-blocks/${blockId}`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/company-blocks/${blockId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanyTerminals = async ({ tokenType, accessToken }) => {
  const response = await fetch(
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
  const response = await fetch(
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
  const response = await fetch(`${apiBaseUrl}/api/v1/company-terminals/`, {
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
  const response = await fetch(
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
  const response = await fetch(
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

const createUser = async ({ tokenType, accessToken, payload }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/users`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users/${userId}/photo`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users/me/photo`, {
    method: 'POST',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
    body: formData,
  })
  return handleJson(response)
}

const updateUser = async ({ tokenType, accessToken, userId, payload }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/users/${userId}`, {
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
  const response = await fetch(
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCurrentUser = async ({ tokenType, accessToken }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/users/me?include=company,terminals`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const updateMe = async ({ tokenType, accessToken, payload }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/users/me`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/users/me/password`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/companies/`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
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
  const response = await fetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
  return handleJson(response)
}

const fetchCompanyById = async ({ tokenType, accessToken, companyId }) => {
  const response = await fetch(`${apiBaseUrl}/api/v1/companies/${companyId}`, {
    headers: {
      Authorization: `${tokenType || 'bearer'} ${accessToken}`,
    },
  })
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
  fetchEquipmentTypeInspectionItems,
  fetchEquipmentTypeVerifications,
  fetchEquipmentTypeVerificationItems,
  createEquipmentInspection,
  createEquipmentVerification,
  createEquipmentCalibration,
  fetchEquipmentInspections,
  fetchEquipmentCalibrations,
  updateEquipmentInspection,
  updateEquipmentVerification,
  updateEquipmentCalibration,
  uploadEquipmentCalibrationCertificate,
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
}
