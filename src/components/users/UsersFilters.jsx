import { FilterAltOff } from '@mui/icons-material'
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { USER_ROLE_FILTER_OPTIONS, USER_STATUS_FILTER_OPTIONS } from './userUtils'

const UsersFilters = ({
  query,
  roleFilter,
  terminalFilter,
  statusFilter,
  terminals,
  terminalsLoading,
  filteredCount,
  hasActiveFilters,
  onQueryChange,
  onRoleFilterChange,
  onTerminalFilterChange,
  onStatusFilterChange,
  onClearFilters,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          xl: '2fr 1fr 1fr 1fr auto auto',
        },
        alignItems: 'center',
        p: 1.5,
        borderRadius: 2,
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f5',
      }}
    >
      <TextField
        size="small"
        placeholder="Buscar por nombre, correo, rol o empresa"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        sx={{ minWidth: 0, width: '100%' }}
      />
      <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
        <InputLabel id="users-terminal-filter" shrink>
          Terminales
        </InputLabel>
        <Select
          labelId="users-terminal-filter"
          label="Terminales"
          multiple
          displayEmpty
          value={terminalFilter}
          onChange={(event) => onTerminalFilterChange(event.target.value)}
          renderValue={(selected) => {
            if (!selected.length) return 'Todos'
            return selected.map((id) => terminals.find((terminal) => terminal.id === id)?.name || id).join(', ')
          }}
        >
          {terminalsLoading ? (
            <MenuItem value="" disabled>
              Cargando terminales...
            </MenuItem>
          ) : null}
          {terminals.map((terminal) => (
            <MenuItem key={terminal.id} value={terminal.id}>
              {terminal.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
        <InputLabel id="users-role-filter">Rol</InputLabel>
        <Select
          labelId="users-role-filter"
          value={roleFilter}
          label="Rol"
          onChange={(event) => onRoleFilterChange(event.target.value)}
        >
          {USER_ROLE_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
        <InputLabel id="users-status-filter">Estado</InputLabel>
        <Select
          labelId="users-status-filter"
          value={statusFilter}
          label="Estado"
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          {USER_STATUS_FILTER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        type="button"
        size="small"
        variant="outlined"
        startIcon={<FilterAltOff fontSize="small" />}
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        sx={{
          borderColor: 'rgba(227, 28, 121, 0.4)',
          color: 'secondary.main',
          height: 40,
          width: { xs: '100%', xl: 'auto' },
        }}
      >
        Limpiar filtros
      </Button>
      <Chip
        label={`${filteredCount} resultados`}
        size="small"
        sx={{
          backgroundColor: 'primary.light',
          color: 'primary.main',
          fontWeight: 600,
          justifySelf: { xs: 'start', xl: 'end' },
        }}
      />
    </Box>
  )
}

export { UsersFilters }
