import { FilterAltOff } from '@mui/icons-material'
import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { COMPANY_FILTER_TYPE_OPTIONS } from './companyUtils'

const CompaniesFilters = ({
  query,
  typeFilter,
  hasActiveFilters,
  filteredCount,
  onQueryChange,
  onTypeFilterChange,
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
        placeholder="Buscar por nombre o tipo"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        sx={{ minWidth: 280, flex: '1 1 280px' }}
      />
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel id="companies-type-filter">Tipo</InputLabel>
        <Select
          labelId="companies-type-filter"
          value={typeFilter}
          label="Tipo"
          onChange={(event) => onTypeFilterChange(event.target.value)}
        >
          {COMPANY_FILTER_TYPE_OPTIONS.map((option) => (
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

export { CompaniesFilters }
