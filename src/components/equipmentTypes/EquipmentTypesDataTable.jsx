import { DeleteOutline, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import {
  EquipmentTypeDaysBadge,
  EquipmentTypeLabBadge,
  EquipmentTypeRoleBadge,
  EquipmentTypeStatusBadge,
  EquipmentTypeVerificationSummary,
} from './EquipmentTypeBadges'
import { ROWS_PER_PAGE_OPTIONS } from './equipmentTypeUtils'

const EquipmentTypesDataTable = ({
  equipmentTypesError,
  equipmentTypesErrorMessage,
  isEquipmentTypesLoading,
  filteredCount,
  pagedEquipmentTypes,
  sortBy,
  sortDir,
  onSort,
  canEdit,
  onView,
  onEdit,
  onDelete,
  safePage,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPrevPage,
  onNextPage,
}) => {
  if (equipmentTypesError) {
    return (
      <Typography className="error" component="p">
        {equipmentTypesErrorMessage}
      </Typography>
    )
  }

  if (isEquipmentTypesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (filteredCount === 0) {
    return (
      <Typography className="meta" component="p">
        No hay tipos de equipo para mostrar.
      </Typography>
    )
  }

  return (
    <>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  backgroundColor: 'primary.light',
                  color: 'secondary.dark',
                  fontWeight: 700,
                  borderBottom: '2px solid rgba(227,28,121,0.2)',
                },
              }}
            >
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortDir : 'asc'}
                  onClick={() => onSort('name')}
                >
                  Tipo de equipo
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'lab'}
                  direction={sortBy === 'lab' ? sortDir : 'asc'}
                  onClick={() => onSort('lab')}
                >
                  Ubicacion
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'calibration'}
                  direction={sortBy === 'calibration' ? sortDir : 'asc'}
                  onClick={() => onSort('calibration')}
                >
                  Calibracion
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'maintenance'}
                  direction={sortBy === 'maintenance' ? sortDir : 'asc'}
                  onClick={() => onSort('maintenance')}
                >
                  Mantenimiento
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'inspection'}
                  direction={sortBy === 'inspection' ? sortDir : 'asc'}
                  onClick={() => onSort('inspection')}
                >
                  Inspeccion
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Verificaciones</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'status'}
                  direction={sortBy === 'status' ? sortDir : 'asc'}
                  onClick={() => onSort('status')}
                >
                  Estado
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedEquipmentTypes.map((item, index) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdfafe',
                  '&:hover': { backgroundColor: 'primary.light' },
                }}
              >
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    <EquipmentTypeRoleBadge role={item.role} />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeLabBadge isLab={item.is_lab} />
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeDaysBadge value={item.calibration_days} />
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeDaysBadge value={item.maintenance_days} />
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeDaysBadge value={item.inspection_days} />
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeVerificationSummary verificationTypes={item.verification_types} />
                </TableCell>
                <TableCell align="center">
                  <EquipmentTypeStatusBadge isActive={item.is_active} />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Ver tipo de equipo"
                      onClick={() => onView(item)}
                      sx={{ color: '#64748b', '&:hover': { color: 'primary.main' } }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                    {canEdit ? (
                      <IconButton
                        size="small"
                        aria-label="Editar tipo de equipo"
                        onClick={() => onEdit(item)}
                        sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    ) : null}
                    {canEdit ? (
                      <IconButton
                        size="small"
                        aria-label="Eliminar tipo de equipo"
                        onClick={() => onDelete(item)}
                        sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mt: 0.5,
          pt: 1,
          borderTop: '1px solid #f0f0f5',
        }}
      >
        <Typography className="meta" component="p">
          Pagina {safePage} de {totalPages}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="equipment-rows-per-page">Filas</InputLabel>
            <Select
              labelId="equipment-rows-per-page"
              value={rowsPerPage}
              label="Filas"
              onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            >
              {ROWS_PER_PAGE_OPTIONS.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" sx={{ height: 40 }} disabled={safePage <= 1} onClick={onPrevPage}>
            Anterior
          </Button>
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 40 }}
            disabled={safePage >= totalPages}
            onClick={onNextPage}
          >
            Siguiente
          </Button>
        </Box>
      </Box>
    </>
  )
}

export { EquipmentTypesDataTable }
