import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'

const SampleCreateDialog = ({ open, onClose, isCreating, createForm, setCreateForm, terminalOptions, onSave }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { maxWidth: 768 } }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Crear muestra
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'grid',
          gap: 1.5,
          pt: 2,
          overflow: 'visible',
          '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
          '& .MuiOutlinedInput-root': { backgroundColor: '#fff' },
          '& .MuiInputBase-root': { height: 40 },
        }}
      >
        <FormControl size="small" fullWidth>
          <InputLabel id="create-sample-terminal-label">Terminal</InputLabel>
          <Select
            labelId="create-sample-terminal-label"
            label="Terminal"
            value={createForm.terminal_id}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                terminal_id: String(event.target.value || ''),
              }))
            }
          >
            {terminalOptions.map((terminal) => (
              <MenuItem key={terminal.id} value={String(terminal.id)}>
                {terminal.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Identificador"
          size="small"
          value={createForm.identifier}
          onChange={(event) =>
            setCreateForm((prev) => ({
              ...prev,
              identifier: event.target.value,
            }))
          }
          required
        />
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Analisis
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.analyses.includes('api_astm_1298')}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      analyses: event.target.checked
                        ? Array.from(new Set([...prev.analyses, 'api_astm_1298']))
                        : prev.analyses.filter((item) => item !== 'api_astm_1298'),
                    }))
                  }
                />
              }
              label="API ASTM 1298"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.analyses.includes('water_astm_4377')}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      analyses: event.target.checked
                        ? Array.from(new Set([...prev.analyses, 'water_astm_4377']))
                        : prev.analyses.filter((item) => item !== 'water_astm_4377'),
                    }))
                  }
                />
              }
              label="Agua ASTM 4377"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={isCreating} onClick={onSave}>
          {isCreating ? 'Creando...' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleCreateDialog
