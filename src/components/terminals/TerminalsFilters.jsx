import { FilterAltOff } from '@mui/icons-material'
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { TERMINAL_STATUS_FILTER_OPTIONS } from './terminalUtils'

const TerminalsFilters = ({
  query,
  blockFilter,
  ownerFilter,
  statusFilter,
  blocks,
  companies,
  filteredCount,
  hasActiveFilters,
  onQueryChange,
  onBlockFilterChange,
  onOwnerFilterChange,
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
        placeholder="Buscar por nombre o empresa"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        sx={{ minWidth: 240, flex: '1 1 240px' }}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="terminal-block-filter">Bloque</InputLabel>
        <Select
          labelId="terminal-block-filter"
          value={blockFilter}
          label="Bloque"
          onChange={(event) => onBlockFilterChange(event.target.value)}
        >
          <MenuItem value="all">Todos</MenuItem>
          {blocks.map((block) => (
            <MenuItem key={block.id} value={block.id}>
              {block.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="terminal-owner-filter">Empresa</InputLabel>
        <Select
          labelId="terminal-owner-filter"
          value={ownerFilter}
          label="Empresa"
          onChange={(event) => onOwnerFilterChange(event.target.value)}
        >
          <MenuItem value="all">Todas</MenuItem>
          {companies.map((company) => (
            <MenuItem key={company.id} value={company.id}>
              {company.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="terminal-status-filter">Estado</InputLabel>
        <Select
          labelId="terminal-status-filter"
          value={statusFilter}
          label="Estado"
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          {TERMINAL_STATUS_FILTER_OPTIONS.map((option) => (
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
        sx={{ borderColor: 'rgba(227, 28, 121, 0.4)', color: '#001871', height: 40 }}
      >
        Limpiar filtros
      </Button>
      <Chip
        label={`${filteredCount} resultados`}
        size="small"
        sx={{ backgroundColor: '#fdf0f6', color: '#E31C79', fontWeight: 600 }}
      />
    </Box>
  )
}

export { TerminalsFilters }
