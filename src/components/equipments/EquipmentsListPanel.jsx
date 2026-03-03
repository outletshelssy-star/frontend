import {
  Cancel,
  CheckCircle,
  DeleteOutline,
  EditOutlined,
  FactCheck,
  FilterAltOff,
  VerifiedOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

const EquipmentsListPanel = ({
  query,
  statusFilter,
  activeFilter,
  statusOptions,
  canFilterActive,
  hasActiveFilters,
  filteredCount,
  onQueryChange,
  onStatusFilterChange,
  onActiveFilterChange,
  onClearFilters,
  equipmentsError,
  equipmentsErrorMessage,
  isEquipmentsLoading,
  pagedEquipments,
  sortBy,
  sortDir,
  onSort,
  renderRoleBadge,
  canSeeAdminStatus,
  renderAdminStatusBadge,
  renderStatusBadge,
  getCalibrationTooltip,
  renderCalibrationBadge,
  isReadOnly,
  onOpenCalibration,
  shouldSkipInspection,
  getInspectionTooltip,
  renderInspectionBadge,
  isCalibrationVigente,
  onOpenInspection,
  getVerificationTypesForEquipment,
  getVerificationStatusForType,
  getVerificationTypeTooltip,
  onOpenVerification,
  onOpenView,
  onOpenEdit,
  onOpenDelete,
  canDeleteEquipment,
  safePage,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPrevPage,
  onNextPage,
}) => {
  return (
    <>
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
          placeholder="Buscar por serial, modelo, marca, tipo o terminal"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          sx={{ minWidth: 260, flex: '1 1 260px' }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="equipment-status-filter">Estado</InputLabel>
          <Select
            labelId="equipment-status-filter"
            value={statusFilter}
            label="Estado"
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            <MenuItem value="all">Todos</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {canFilterActive ? (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="equipment-active-filter">Activo</InputLabel>
            <Select
              labelId="equipment-active-filter"
              value={activeFilter}
              label="Activo"
              onChange={(event) => onActiveFilterChange(event.target.value)}
            >
              <MenuItem value="active">Activos</MenuItem>
              <MenuItem value="inactive">Inactivos</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
            </Select>
          </FormControl>
        ) : null}
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

      {equipmentsError ? (
        <Typography className="error" component="p">
          {equipmentsErrorMessage}
        </Typography>
      ) : null}

      {isEquipmentsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!equipmentsError && !isEquipmentsLoading && filteredCount === 0 ? (
        <Typography className="meta" component="p">
          No hay equipos para mostrar.
        </Typography>
      ) : null}

      {!equipmentsError && !isEquipmentsLoading && filteredCount > 0 ? (
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
                    active={sortBy === 'type'}
                    direction={sortBy === 'type' ? sortDir : 'asc'}
                    onClick={() => onSort('type')}
                  >
                    Tipo de equipo
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'serial'}
                    direction={sortBy === 'serial' ? sortDir : 'asc'}
                    onClick={() => onSort('serial')}
                  >
                    Serial
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'brand'}
                    direction={sortBy === 'brand' ? sortDir : 'asc'}
                    onClick={() => onSort('brand')}
                  >
                    Marca
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'model'}
                    direction={sortBy === 'model' ? sortDir : 'asc'}
                    onClick={() => onSort('model')}
                  >
                    Modelo
                  </TableSortLabel>
                </TableCell>
                <TableCell align="left">
                  <TableSortLabel
                    active={sortBy === 'terminal'}
                    direction={sortBy === 'terminal' ? sortDir : 'asc'}
                    onClick={() => onSort('terminal')}
                  >
                    Terminal
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortDir : 'asc'}
                    onClick={() => onSort('status')}
                  >
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Calibracion</TableCell>
                <TableCell align="center">Inspeccion</TableCell>
                <TableCell align="center">Verificacion</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedEquipments.map((item, index) => (
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
                      <Typography sx={{ fontWeight: 600 }}>
                        {item.equipment_type?.name || '-'}
                      </Typography>
                      {renderRoleBadge(item.equipment_type?.role)}
                      {canSeeAdminStatus ? renderAdminStatusBadge(item.is_active) : null}
                    </Box>
                  </TableCell>
                  <TableCell>{item.serial}</TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.terminal?.name || '-'}</TableCell>
                  <TableCell align="center">{renderStatusBadge(item.status)}</TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={getCalibrationTooltip(item)} arrow placement="top">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          {renderCalibrationBadge(item)}
                        </Box>
                      </Tooltip>
                      {!isReadOnly ? (
                        <Tooltip title="Registrar calibracion" arrow>
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Registrar calibracion"
                              onClick={() => onOpenCalibration(item)}
                              disabled={item.status !== 'in_use'}
                              sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                            >
                              <FactCheck fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {shouldSkipInspection(item) ? (
                      <Typography variant="caption" color="text.secondary">
                        No aplica
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={getInspectionTooltip(item)} arrow placement="top">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            {renderInspectionBadge(item)}
                          </Box>
                        </Tooltip>
                        {!isReadOnly ? (
                          <Tooltip
                            title={
                              !isCalibrationVigente(item)
                                ? 'Se requiere calibracion vigente'
                                : 'Registrar inspeccion'
                            }
                            arrow
                          >
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Registrar inspeccion"
                                onClick={() => onOpenInspection(item)}
                                disabled={item.status !== 'in_use' || !isCalibrationVigente(item)}
                                sx={{ color: '#64748b', '&:hover': { color: '#2563eb' } }}
                              >
                                <FactCheck fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : null}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const equipmentRole = String(item?.equipment_type?.role || '').toLowerCase()
                      if (equipmentRole === 'reference') {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            No aplica
                          </Typography>
                        )
                      }
                      const verificationTypesForRow = getVerificationTypesForEquipment(item).filter(
                        (t) => Number(t?.frequency_days ?? 0) > 0,
                      )
                      if (verificationTypesForRow.length === 0) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            No aplica
                          </Typography>
                        )
                      }
                      return (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            flexWrap: 'nowrap',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {verificationTypesForRow.map((typeItem, index) => {
                            const { hasApproved } = getVerificationStatusForType(item, typeItem)
                            return (
                              <Box
                                key={typeItem.id}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  pr: index < verificationTypesForRow.length - 1 ? 0.75 : 0,
                                  mr: index < verificationTypesForRow.length - 1 ? 0.25 : 0,
                                  borderRight:
                                    index < verificationTypesForRow.length - 1
                                      ? '1px solid #e2e8f0'
                                      : 'none',
                                }}
                              >
                                <Tooltip
                                  title={getVerificationTypeTooltip(item, typeItem)}
                                  arrow
                                  placement="top"
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: hasApproved ? '#16a34a' : '#dc2626',
                                    }}
                                  >
                                    {hasApproved ? (
                                      <CheckCircle fontSize="small" />
                                    ) : (
                                      <Cancel fontSize="small" />
                                    )}
                                  </Box>
                                </Tooltip>
                                {!isReadOnly ? (
                                  <Tooltip
                                    title={
                                      !isCalibrationVigente(item)
                                        ? 'Se requiere calibracion vigente'
                                        : 'Registrar verificacion'
                                    }
                                    arrow
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        aria-label="Registrar verificacion"
                                        onClick={() => onOpenVerification(item, typeItem.id)}
                                        disabled={
                                          item.status !== 'in_use' || !isCalibrationVigente(item)
                                        }
                                        sx={{ color: '#64748b', '&:hover': { color: '#16a34a' } }}
                                      >
                                        <VerifiedOutlined fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : null}
                              </Box>
                            )
                          })}
                        </Box>
                      )
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        aria-label="Ver equipo"
                        onClick={() => onOpenView(item)}
                        sx={{ color: '#64748b', '&:hover': { color: 'primary.main' } }}
                      >
                        <VisibilityOutlined fontSize="small" />
                      </IconButton>
                      {!isReadOnly ? (
                        <IconButton
                          size="small"
                          aria-label="Editar equipo"
                          onClick={() => onOpenEdit(item)}
                          sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      ) : null}
                      {canDeleteEquipment && !isReadOnly ? (
                        <IconButton
                          size="small"
                          aria-label="Eliminar equipo"
                          onClick={() => onOpenDelete(item)}
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
      ) : null}

      {!equipmentsError && filteredCount > 0 ? (
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
              <InputLabel id="equipments-rows-per-page">Filas</InputLabel>
              <Select
                labelId="equipments-rows-per-page"
                value={rowsPerPage}
                label="Filas"
                onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={20}>20</MenuItem>
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
      ) : null}
    </>
  )
}

export { EquipmentsListPanel }
