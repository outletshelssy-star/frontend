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
import { BlockStatusBadge } from './BlockBadges'
import { BLOCK_ROWS_PER_PAGE_OPTIONS } from './blockUtils'

const BlocksDataTable = ({
  blocksError,
  blocksErrorMessage,
  isBlocksLoading,
  filteredCount,
  pagedBlocks,
  sortBy,
  sortDir,
  onSort,
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
  if (blocksError) {
    return (
      <Typography className="error" component="p">
        {blocksErrorMessage}
      </Typography>
    )
  }

  if (isBlocksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (filteredCount === 0) {
    return (
      <Typography className="meta" component="p">
        No hay bloques para mostrar.
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
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell align="left">
                <TableSortLabel
                  active={sortBy === 'company'}
                  direction={sortBy === 'company' ? sortDir : 'asc'}
                  onClick={() => onSort('company')}
                >
                  Empresa
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
            {pagedBlocks.map((block, index) => (
              <TableRow
                key={block.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdfafe',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <TableCell>{block.name}</TableCell>
                <TableCell>{block.company?.name || '-'}</TableCell>
                <TableCell align="center">
                  <BlockStatusBadge isActive={block.is_active} />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Ver bloque"
                      onClick={() => onView(block)}
                      sx={{ color: '#64748b', '&:hover': { color: 'primary.main' } }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Editar bloque"
                      onClick={() => onEdit(block)}
                      sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Eliminar bloque"
                      onClick={() => onDelete(block)}
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
            <InputLabel id="blocks-rows-per-page">Filas</InputLabel>
            <Select
              labelId="blocks-rows-per-page"
              value={rowsPerPage}
              label="Filas"
              onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            >
              {BLOCK_ROWS_PER_PAGE_OPTIONS.map((size) => (
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

export { BlocksDataTable }
