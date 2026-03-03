import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'

const ExternalAnalysisFormDialog = ({
  open,
  mode,
  form,
  setForm,
  terminalOptions,
  analysisOptions,
  companyOptions,
  reportFile,
  setReportFile,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const isEditMode = mode === 'edit'

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        {isEditMode ? 'Editar analisis externo' : 'Registrar analisis externo'}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 2, overflow: 'visible' }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <FormControl
            sx={{
              '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            }}
          >
            <InputLabel id={isEditMode ? 'external-modal-terminal-edit-label' : 'external-modal-terminal-label'}>
              Terminal
            </InputLabel>
            <Select
              labelId={isEditMode ? 'external-modal-terminal-edit-label' : 'external-modal-terminal-label'}
              label="Terminal"
              value={form.terminal_id}
              disabled={isEditMode}
              onChange={(event) =>
                setForm((prev) => ({
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
            label="Fecha"
            type="date"
            value={form.performed_at}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, performed_at: event.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <FormControl
            sx={{
              '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            }}
          >
            <InputLabel id={isEditMode ? 'external-analysis-edit-label' : 'external-analysis-label'}>
              Analisis
            </InputLabel>
            <Select
              labelId={isEditMode ? 'external-analysis-edit-label' : 'external-analysis-label'}
              label="Analisis"
              value={form.analysis_type_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  analysis_type_id: String(event.target.value || ''),
                }))
              }
            >
              {analysisOptions.map((analysis) => (
                <MenuItem key={analysis.analysis_type_id} value={String(analysis.analysis_type_id)}>
                  {analysis.analysis_type_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Metodo"
            value={form.method}
            onChange={(event) => setForm((prev) => ({ ...prev, method: event.target.value }))}
          />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          <FormControl
            sx={{
              '& .MuiInputLabel-root': { backgroundColor: '#fff', px: 0.5 },
            }}
          >
            <InputLabel id={isEditMode ? 'external-analysis-company-edit-label' : 'external-analysis-company-label'}>
              Empresa
            </InputLabel>
            <Select
              labelId={isEditMode ? 'external-analysis-company-edit-label' : 'external-analysis-company-label'}
              label="Empresa"
              value={form.analysis_company_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  analysis_company_id: String(event.target.value || ''),
                }))
              }
            >
              {companyOptions.map((company) => (
                <MenuItem key={company.id} value={String(company.id)}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Numero de informe"
            value={form.report_number}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, report_number: event.target.value }))
            }
          />
        </Box>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: '2fr 1fr 1fr' }}>
          <TextField
            label="Resultado"
            type="number"
            value={form.result_value}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, result_value: event.target.value }))
            }
          />
          <TextField
            label="Unidad"
            value={form.result_unit}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, result_unit: event.target.value }))
            }
          />
          <TextField
            label="Incertidumbre"
            type="number"
            value={form.result_uncertainty}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, result_uncertainty: event.target.value }))
            }
          />
        </Box>
        <Button variant="outlined" component="label">
          {reportFile ? `PDF: ${reportFile.name}` : 'Subir informe (PDF)'}
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0] || null
              setReportFile(file)
            }}
          />
        </Button>
        <TextField
          label="Observaciones"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          multiline
          minRows={3}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit} disabled={isSaving}>
          {isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export { ExternalAnalysisFormDialog }
