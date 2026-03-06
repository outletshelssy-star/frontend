import { Box } from '@mui/material'
import { getBlockStatusColors } from './blockUtils'

const statusBadgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const BlockStatusBadge = ({ isActive }) => {
  const colors = getBlockStatusColors(isActive)
  return (
    <Box component="span" sx={{ ...statusBadgeSx, color: colors.fg, backgroundColor: colors.bg }}>
      {isActive ? 'Activo' : 'Inactivo'}
    </Box>
  )
}

export { BlockStatusBadge }
