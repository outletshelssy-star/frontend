import { DeleteOutline } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

const TerminalFormDialog = ({
  open,
  isEditOpen,
  formData,
  blocks,
  companies,
  labTerminalOptions,
  analysisTypes,
  isAnalysesLoading,
  selectedAnalysisIds,
  onFormDataChange,
  onAnalysisToggle,
  onClose,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {isEditOpen ? 'Editar terminal' : 'Nuevo terminal'}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Identificacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            mb: 3,
          }}
        >
          <TextField
            label="Nombre"
            size="small"
            value={formData.name}
            onChange={(event) => onFormDataChange({ name: event.target.value })}
            required
            sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}
          />
          <TextField
            label="Codigo del terminal"
            size="small"
            placeholder="Ej: ABC"
            value={formData.terminal_code}
            required
            onChange={(event) =>
              onFormDataChange({
                terminal_code: event.target.value,
              })
            }
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Ubicacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            mb: 3,
          }}
        >
          <FormControl size="small">
            <InputLabel id="terminal-block-label">Bloque</InputLabel>
            <Select
              labelId="terminal-block-label"
              label="Bloque"
              value={formData.block_id}
              onChange={(event) => onFormDataChange({ block_id: event.target.value })}
            >
              {blocks.map((block) => (
                <MenuItem key={block.id} value={block.id}>
                  {block.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="terminal-owner-label">Empresa Propietaria</InputLabel>
            <Select
              labelId="terminal-owner-label"
              label="Empresa Propietaria"
              value={formData.owner_company_id}
              onChange={(event) =>
                onFormDataChange({
                  owner_company_id: event.target.value,
                })
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="terminal-admin-label">Empresa Admin</InputLabel>
            <Select
              labelId="terminal-admin-label"
              label="Empresa Admin"
              value={formData.admin_company_id}
              onChange={(event) =>
                onFormDataChange({
                  admin_company_id: event.target.value,
                })
              }
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="overline" color="text.secondary">
          Laboratorio
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(formData.has_lab)}
                onChange={(event) =>
                  onFormDataChange({
                    has_lab: event.target.checked,
                    lab_terminal_id: event.target.checked ? '' : formData.lab_terminal_id,
                  })
                }
              />
            }
            label="Tiene laboratorio propio"
          />
          <FormControl size="small" disabled={formData.has_lab}>
            <InputLabel id="terminal-lab-label">Terminal laboratorio</InputLabel>
            <Select
              labelId="terminal-lab-label"
              label="Terminal laboratorio"
              value={formData.lab_terminal_id}
              onChange={(event) => onFormDataChange({ lab_terminal_id: event.target.value })}
            >
              {labTerminalOptions.map((terminal) => (
                <MenuItem key={terminal.id} value={String(terminal.id)}>
                  {terminal.name}
                </MenuItem>
              ))}
            </Select>
            {!formData.has_lab && labTerminalOptions.length === 0 ? (
              <FormHelperText>No hay terminales con laboratorio disponibles.</FormHelperText>
            ) : null}
          </FormControl>
        </Box>
        <Typography variant="overline" color="text.secondary">
          Analisis externos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: isEditOpen ? 3 : 0 }}>
          {analysisTypes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {isAnalysesLoading ? 'Cargando analisis...' : 'No hay analisis externos disponibles.'}
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 0.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              {analysisTypes.map((item) => {
                const value = String(item.id)
                const checked = selectedAnalysisIds.includes(value)
                return (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox checked={checked} onChange={(event) => onAnalysisToggle(value, event.target.checked)} />
                    }
                    label={item.name}
                  />
                )
              })}
            </Box>
          )}
        </Box>
        {isEditOpen ? (
          <>
            <Typography variant="overline" color="text.secondary">
              Estado
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(event) => onFormDataChange({ is_active: event.target.checked })}
                />
              }
              label={formData.is_active ? 'Activo' : 'Inactivo'}
            />
          </>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit}>
          {isEditOpen ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalViewDialog = ({
  open,
  viewTerminal,
  terminalsById,
  isAnalysesLoading,
  terminalAnalyses,
  formatDate,
  onClose,
  onEdit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Detalle de terminal
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Identificacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="Nombre"
            size="small"
            value={viewTerminal?.name || ''}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Codigo del terminal"
            size="small"
            value={viewTerminal?.terminal_code || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Ubicacion
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            label="Bloque"
            size="small"
            value={viewTerminal?.block?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Empresa Propietaria"
            size="small"
            value={viewTerminal?.owner_company?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            label="Empresa Admin"
            size="small"
            value={viewTerminal?.admin_company?.name || '-'}
            disabled
            slotProps={{ input: { readOnly: true } }}
          />
        </Box>
        <Typography variant="overline" color="text.secondary">
          Laboratorio y Estado
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <FormControlLabel
            control={<Switch checked={Boolean(viewTerminal?.has_lab)} disabled />}
            label="Tiene laboratorio propio"
          />
          <FormControlLabel
            control={<Switch checked={Boolean(viewTerminal?.is_active)} disabled />}
            label={viewTerminal?.is_active ? 'Activo' : 'Inactivo'}
          />
          {!viewTerminal?.has_lab ? (
            <TextField
              label="Terminal laboratorio"
              size="small"
              value={
                viewTerminal?.lab_terminal_id
                  ? terminalsById.get(String(viewTerminal.lab_terminal_id))?.name ||
                    String(viewTerminal.lab_terminal_id)
                  : 'Sin laboratorio'
              }
              disabled
              slotProps={{ input: { readOnly: true } }}
              sx={{ gridColumn: '1 / -1' }}
            />
          ) : null}
        </Box>
        <Typography variant="overline" color="text.secondary">
          Analisis externos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {isAnalysesLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Cargando analisis...</Typography>
          </Box>
        ) : terminalAnalyses.length === 0 ? (
          <Typography color="text.secondary">Sin analisis configurados.</Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Analisis</TableCell>
                  <TableCell>Frecuencia (dias)</TableCell>
                  <TableCell>Ultimo</TableCell>
                  <TableCell>Proximo</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terminalAnalyses.map((analysis) => (
                  <TableRow key={analysis.analysis_type_id}>
                    <TableCell>{analysis.analysis_type_name}</TableCell>
                    <TableCell>{analysis.frequency_days ?? '-'}</TableCell>
                    <TableCell>{formatDate(analysis.last_performed_at)}</TableCell>
                    <TableCell>{formatDate(analysis.next_due_at)}</TableCell>
                    <TableCell>{analysis.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="outlined" onClick={onEdit} disabled={!viewTerminal}>
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalDeleteDialog = ({ open, viewTerminal, isSaving, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Confirmar eliminacion
      </DialogTitle>
      <DialogContent>
        <Typography>
          {viewTerminal ? `Vas a eliminar ${viewTerminal.name}.` : 'Vas a eliminar este terminal.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isSaving}
          startIcon={<DeleteOutline fontSize="small" />}
        >
          {isSaving ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const TerminalProgressDialog = ({ open, title }) => {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {title}
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3,
        }}
      >
        <CircularProgress size={24} />
        <Typography>Esto puede tardar unos segundos.</Typography>
      </DialogContent>
    </Dialog>
  )
}

export { TerminalDeleteDialog, TerminalFormDialog, TerminalProgressDialog, TerminalViewDialog }
