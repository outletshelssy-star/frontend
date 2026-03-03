import { Box, Chip } from '@mui/material'
import { ROLE_OPTIONS, formatDaysWithUnit } from './equipmentTypeUtils'

const badgeBaseSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const EquipmentTypeStatusBadge = ({ isActive }) => {
  const colors = isActive ? { fg: '#166534', bg: '#dcfce7' } : { fg: '#991b1b', bg: '#fee2e2' }
  return (
    <Box component="span" sx={{ ...badgeBaseSx, color: colors.fg, backgroundColor: colors.bg }}>
      {isActive ? 'Activo' : 'Inactivo'}
    </Box>
  )
}

const EquipmentTypeRoleBadge = ({ role }) => {
  const colors =
    role === 'reference' ? { fg: '#1d4ed8', bg: '#dbeafe' } : { fg: '#0f766e', bg: '#ccfbf1' }
  const label = ROLE_OPTIONS.find((option) => option.value === role)?.label || role || '-'
  return (
    <Box component="span" sx={{ ...badgeBaseSx, color: colors.fg, backgroundColor: colors.bg }}>
      {label}
    </Box>
  )
}

const EquipmentTypeDaysBadge = ({ value }) => {
  const numeric = Number(value ?? 0)
  if (numeric <= 0) {
    return (
      <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>
        No aplica
      </Box>
    )
  }
  let colors
  if (numeric <= 30) colors = { fg: '#166534', bg: '#dcfce7' }
  else if (numeric <= 90) colors = { fg: '#1d4ed8', bg: '#dbeafe' }
  else if (numeric <= 365) colors = { fg: '#92400e', bg: '#fef3c7' }
  else colors = { fg: '#991b1b', bg: '#fee2e2' }
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.15rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: colors.fg,
        backgroundColor: colors.bg,
      }}
    >
      {formatDaysWithUnit(numeric)}
    </Box>
  )
}

const EquipmentTypeLabBadge = ({ isLab }) => {
  const colors = isLab ? { fg: '#1d4ed8', bg: '#dbeafe' } : { fg: '#0f766e', bg: '#ccfbf1' }
  return (
    <Box
      component="span"
      sx={{
        ...badgeBaseSx,
        padding: '0.2rem 0.6rem',
        color: colors.fg,
        backgroundColor: colors.bg,
      }}
    >
      {isLab ? 'Laboratorio' : 'Campo'}
    </Box>
  )
}

const EquipmentTypeVerificationSummary = ({ verificationTypes = [] }) => {
  const active = Array.isArray(verificationTypes)
    ? verificationTypes
        .filter((item) => item?.is_active !== false)
        .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    : []
  if (!active.length) {
    return (
      <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.8rem' }}>
        No aplica
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
      {active.map((item, idx) => (
        <Chip
          key={item.id || idx}
          label={formatDaysWithUnit(item?.frequency_days)}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 20,
            backgroundColor: 'primary.light',
            color: 'primary.dark',
          }}
        />
      ))}
    </Box>
  )
}

export {
  EquipmentTypeDaysBadge,
  EquipmentTypeLabBadge,
  EquipmentTypeRoleBadge,
  EquipmentTypeStatusBadge,
  EquipmentTypeVerificationSummary,
}
