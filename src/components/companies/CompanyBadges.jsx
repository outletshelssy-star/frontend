import { Box } from '@mui/material'
import {
  getCompanyStatusColors,
  getCompanyTypeColors,
  getCompanyTypeLabel,
} from './companyUtils'

const badgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const CompanyTypeBadge = ({ type }) => {
  const colors = getCompanyTypeColors(type)
  return (
    <Box component="span" sx={{ ...badgeSx, color: colors.fg, backgroundColor: colors.bg }}>
      {getCompanyTypeLabel(type)}
    </Box>
  )
}

const CompanyStatusBadge = ({ isActive }) => {
  const colors = getCompanyStatusColors(isActive)
  return (
    <Box component="span" sx={{ ...badgeSx, color: colors.fg, backgroundColor: colors.bg }}>
      {isActive ? 'Activo' : 'Inactivo'}
    </Box>
  )
}

export { CompanyStatusBadge, CompanyTypeBadge }
