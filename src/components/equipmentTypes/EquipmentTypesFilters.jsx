import { FilterAltOff } from '@mui/icons-material'
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { ROLE_OPTIONS, STATUS_FILTER_OPTIONS } from './equipmentTypeUtils'

const EquipmentTypesFilters = ({
  query,
  roleFilter,
  statusFilter,
  hasActiveFilters,
  filteredCount,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onClearFilters,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
        p: 1.5,
        borderRadius: 2,
        backgroundColor: '#f9fafb',
        border: '1px solid #f0f0f5',
      }}
    >
      <TextField
        size="small"
        placeholder="Buscar por nombre o rol"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        sx={{ minWidth: 260, flex: '1 1 260px' }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="equipment-role-filter">Rol</InputLabel>
        <Select
          labelId="equipment-role-filter"
          value={roleFilter}
          label="Rol"
          onChange={(event) => onRoleFilterChange(event.target.value)}
        >
          <MenuItem value="all">Todos</MenuItem>
          {ROLE_OPTIONS.map((role) => (
            <MenuItem key={role.value} value={role.value}>
              {role.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="equipment-status-filter">Estado</InputLabel>
        <Select
          labelId="equipment-status-filter"
          value={statusFilter}
          label="Estado"
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
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
        sx={{ borderColor: 'rgba(227, 28, 121, 0.4)', color: 'secondary.main', height: 40 }}
      >
        Limpiar filtros
      </Button>
      <Chip
        label={`${filteredCount} resultados`}
        size="small"
        sx={{ backgroundColor: 'primary.light', color: 'primary.main', fontWeight: 600 }}
      />
    </Box>
  )
}

export { EquipmentTypesFilters }
