import { DeleteOutline, EditOutlined, VisibilityOutlined } from '@mui/icons-material'
import {
  Avatar,
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import { ROWS_PER_PAGE_OPTIONS } from './userUtils'
import { brand } from '../../theme'

const UsersDataTable = ({
  usersError,
  isUsersLoading,
  filteredCount,
  pagedUsers,
  sortBy,
  sortDir,
  onSort,
  formatUserType,
  getTerminalChipStyle,
  onOpenView,
  onOpenEdit,
  onOpenDelete,
  safePage,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPrevPage,
  onNextPage,
}) => {
  if (usersError) {
    return (
      <Typography className="error" component="p">
        {usersError}
      </Typography>
    )
  }

  if (isUsersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (filteredCount === 0) {
    return (
      <Typography className="meta" component="p">
        No hay usuarios para mostrar.
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
          border: `1px solid ${brand.magentaA20}`,
          background: '#ffffff',
          maxHeight: 'calc(100vh - 280px)',
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
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
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortDir : 'asc'}
                  onClick={() => onSort('email')}
                >
                  Correo
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
              <TableCell align="left">Terminales</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === 'role'}
                  direction={sortBy === 'role' ? sortDir : 'asc'}
                  onClick={() => onSort('role')}
                >
                  Rol
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
            {pagedUsers.map((user, index) => (
              <TableRow
                key={user.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : brand.magentaLight,
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={user.photo_url || ''}
                      alt={`${user.name} ${user.last_name}`}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {user.name} {user.last_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.company?.name || 'Sin empresa'}</TableCell>
                <TableCell>
                  {user.user_type === 'superadmin' ? (
                    <Chip
                      label="Todos"
                      size="small"
                      sx={{
                        backgroundColor: '#1e3a8a',
                        color: '#e0f2fe',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  ) : Array.isArray(user.terminals) && user.terminals.length ? (
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                      {user.terminals.map((terminal) => (
                        <Chip
                          key={terminal.id}
                          label={terminal.name}
                          size="small"
                          sx={getTerminalChipStyle(terminal.name)}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin terminales
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color:
                        user.user_type === 'superadmin'
                          ? '#5b21b6'
                          : user.user_type === 'admin'
                            ? '#1d4ed8'
                            : '#0f766e',
                      backgroundColor:
                        user.user_type === 'superadmin'
                          ? '#ede9fe'
                          : user.user_type === 'admin'
                            ? '#dbeafe'
                            : '#ccfbf1',
                    }}
                  >
                    {formatUserType(user.user_type)}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: user.is_active ? '#166534' : '#991b1b',
                      backgroundColor: user.is_active ? '#dcfce7' : '#fee2e2',
                    }}
                  >
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Ver usuario"
                      onClick={() => onOpenView(user)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Editar usuario"
                      onClick={() => onOpenEdit(user)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: '#0f766e' },
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Eliminar usuario"
                      onClick={() => onOpenDelete(user)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: '#b91c1c' },
                      }}
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
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
          mt: 0.5,
          pt: 1,
          borderTop: `1px solid ${brand.magentaA15}`,
        }}
      >
        <Typography className="meta" component="p">
          Pagina {safePage} de {totalPages}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel id="users-rows-per-page">Filas</InputLabel>
            <Select
              labelId="users-rows-per-page"
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
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 40, width: { xs: '100%', sm: 'auto' } }}
            disabled={safePage <= 1}
            onClick={onPrevPage}
          >
            Anterior
          </Button>
          <Button
            size="small"
            variant="outlined"
            sx={{ height: 40, width: { xs: '100%', sm: 'auto' } }}
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

export { UsersDataTable }
