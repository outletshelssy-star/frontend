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
import { TerminalStatusBadge } from './TerminalBadges'
import { TERMINAL_ROWS_PER_PAGE_OPTIONS } from './terminalUtils'

const TerminalsDataTable = ({
  terminalsError,
  terminalsErrorMessage,
  isTerminalsLoading,
  filteredCount,
  pagedTerminals,
  sortBy,
  sortDir,
  onSort,
  getLabLabel,
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
  if (terminalsError) {
    return (
      <Typography className="error" component="p">
        {terminalsErrorMessage}
      </Typography>
    )
  }

  if (isTerminalsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (filteredCount === 0) {
    return (
      <Typography className="meta" component="p">
        No hay terminales para mostrar.
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
                  backgroundColor: '#fdf0f6',
                  color: '#201747',
                  fontWeight: 700,
                  borderBottom: '2px solid rgba(227, 28, 121, 0.2)',
                },
              }}
            >
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortDir : 'asc'}
                  onClick={() => onSort('name')}
                >
                  Nombre Terminal
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'code'}
                  direction={sortBy === 'code' ? sortDir : 'asc'}
                  onClick={() => onSort('code')}
                >
                  Codigo
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'block'}
                  direction={sortBy === 'block' ? sortDir : 'asc'}
                  onClick={() => onSort('block')}
                >
                  Bloque
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'owner'}
                  direction={sortBy === 'owner' ? sortDir : 'asc'}
                  onClick={() => onSort('owner')}
                >
                  Propietaria
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'admin'}
                  direction={sortBy === 'admin' ? sortDir : 'asc'}
                  onClick={() => onSort('admin')}
                >
                  Administradora
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'lab'}
                  direction={sortBy === 'lab' ? sortDir : 'asc'}
                  onClick={() => onSort('lab')}
                >
                  Laboratorio
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
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedTerminals.map((terminal, index) => (
              <TableRow
                key={terminal.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdfafe',
                  '&:hover': {
                    backgroundColor: '#fdf0f6',
                  },
                }}
              >
                <TableCell>{terminal.name}</TableCell>
                <TableCell>{terminal.terminal_code || '-'}</TableCell>
                <TableCell>{terminal.block?.name || '-'}</TableCell>
                <TableCell>{terminal.owner_company?.name || '-'}</TableCell>
                <TableCell>{terminal.admin_company?.name || '-'}</TableCell>
                <TableCell>{getLabLabel(terminal)}</TableCell>
                <TableCell align="center">
                  <TerminalStatusBadge isActive={terminal.is_active} />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Ver terminal"
                      onClick={() => onView(terminal)}
                      sx={{ color: '#64748b', '&:hover': { color: '#E31C79' } }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Editar terminal"
                      onClick={() => onEdit(terminal)}
                      sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Eliminar terminal"
                      onClick={() => onDelete(terminal)}
                      sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
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
            <InputLabel id="terminals-rows-per-page">Filas</InputLabel>
            <Select
              labelId="terminals-rows-per-page"
              value={rowsPerPage}
              label="Filas"
              onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            >
              {TERMINAL_ROWS_PER_PAGE_OPTIONS.map((size) => (
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

export { TerminalsDataTable }
