import { Box } from '@mui/material'
import { getTerminalStatusColors } from './terminalUtils'

const badgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.5rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
}

const TerminalStatusBadge = ({ isActive }) => {
  const colors = getTerminalStatusColors(isActive)
  return (
    <Box component="span" sx={{ ...badgeSx, color: colors.fg, backgroundColor: colors.bg }}>
      {isActive ? 'Activo' : 'Inactivo'}
    </Box>
  )
}

export { TerminalStatusBadge }
