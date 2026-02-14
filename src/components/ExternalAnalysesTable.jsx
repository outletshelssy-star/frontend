import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material'
import { FilterAltOff } from '@mui/icons-material'
import {
  createExternalAnalysisRecord,
  fetchExternalAnalysesByTerminal,
  fetchExternalAnalysisRecords,
  uploadExternalAnalysisReport,
} from '../services/api'

const ExternalAnalysesTable = ({ terminals, tokenType, accessToken }) => {
  const [selectedTerminalId, setSelectedTerminalId] = useState('')
  const [analyses, setAnalyses] = useState([])
  const [records, setRecords] = useState([])
  const [analysisFilter, setAnalysisFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    terminal_id: '',
    analysis_type_id: '',
    performed_at: '',
    report_number: '',
    result_value: '',
    result_unit: '',
    result_uncertainty: '',
    method: '',
    notes: '',
  })
  const [reportFile, setReportFile] = useState(null)
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const terminalOptions = useMemo(
    () => (Array.isArray(terminals) ? terminals : []),
    [terminals]
  )

  const activeAnalyses = useMemo(
    () => analyses.filter((item) => item.is_active),
    [analyses]
  )

  useEffect(() => {
    if (selectedTerminalId || terminalOptions.length === 0) return
    const storedId = localStorage.getItem('external_analyses_terminal_id')
    if (storedId && terminalOptions.some((t) => String(t.id) === String(storedId))) {
      setSelectedTerminalId(String(storedId))
      return
    }
    setSelectedTerminalId(String(terminalOptions[0]?.id || ''))
  }, [selectedTerminalId, terminalOptions])

  useEffect(() => {
    if (!selectedTerminalId) return
    localStorage.setItem('external_analyses_terminal_id', String(selectedTerminalId))
  }, [selectedTerminalId])

  const loadAnalyses = async (terminalId, filter = analysisFilter) => {
    if (!terminalId || !accessToken) return
    setIsLoading(true)
    setRecordsError('')
    try {
      const [analysesData, recordsData] = await Promise.all([
        fetchExternalAnalysesByTerminal({
          tokenType,
          accessToken,
          terminalId,
        }),
        fetchExternalAnalysisRecords({
          tokenType,
          accessToken,
          terminalId,
          analysisTypeId: filter !== 'all' ? Number(filter) : undefined,
        }),
      ])
      setAnalyses(Array.isArray(analysesData?.items) ? analysesData.items : [])
      setRecords(Array.isArray(recordsData?.items) ? recordsData.items : [])
    } catch (err) {
      setRecordsError(err?.detail || 'No se pudieron cargar los analisis externos.')
      setAnalyses([])
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedTerminalId) return
    loadAnalyses(selectedTerminalId)
  }, [selectedTerminalId])

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString()
  }

  const openCreate = () => {
    const defaultType = activeAnalyses[0]?.analysis_type_id
    setForm({
      terminal_id: selectedTerminalId ? String(selectedTerminalId) : '',
      analysis_type_id: defaultType ? String(defaultType) : '',
      performed_at: '',
      report_number: '',
      result_value: '',
      result_unit: '',
      result_uncertainty: '',
      method: '',
      notes: '',
    })
    setReportFile(null)
    setIsCreateOpen(true)
  }

  const handleSaveRecord = async () => {
    const targetTerminalId = form.terminal_id || selectedTerminalId
    if (!targetTerminalId) return
    if (!form.analysis_type_id) {
      setToast({
        open: true,
        message: 'Selecciona un analisis.',
        severity: 'error',
      })
      return
    }
    setIsSaving(true)
    try {
      const created = await createExternalAnalysisRecord({
        tokenType,
        accessToken,
        terminalId: Number(targetTerminalId),
        payload: {
          analysis_type_id: Number(form.analysis_type_id),
          performed_at: form.performed_at || null,
          report_number: form.report_number?.trim() || null,
          result_value: form.result_value === '' ? null : Number(form.result_value),
          result_unit: form.result_unit?.trim() || null,
          result_uncertainty:
            form.result_uncertainty === '' ? null : Number(form.result_uncertainty),
          method: form.method?.trim() || null,
          notes: form.notes?.trim() || null,
        },
      })
      if (reportFile && created?.id) {
        await uploadExternalAnalysisReport({
          tokenType,
          accessToken,
          recordId: created.id,
          file: reportFile,
        })
      }
      setToast({
        open: true,
        message: 'Analisis registrado correctamente.',
        severity: 'success',
      })
      setIsCreateOpen(false)
      await loadAnalyses(String(targetTerminalId))
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo registrar el analisis.',
        severity: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!form.analysis_type_id) return
    const selected = analyses.find(
      (item) => String(item.analysis_type_id) === String(form.analysis_type_id)
    )
    if (!selected) return
    const name = String(selected.analysis_type_name || '').toLowerCase()
    if (name === 'sedimentos') {
      setForm((prev) => ({
        ...prev,
        result_unit: prev.result_unit || '% masa',
        method: prev.method || 'ASTM D473-22',
      }))
    }
  }, [form.analysis_type_id, analyses])

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
          Analisis externos
        </Typography>
        <Button
          variant="contained"
          onClick={openCreate}
          disabled={!selectedTerminalId || activeAnalyses.length === 0}
        >
          Registrar analisis
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="external-terminal-label">Terminal</InputLabel>
          <Select
            labelId="external-terminal-label"
            label="Terminal"
            value={selectedTerminalId}
            onChange={(event) => setSelectedTerminalId(String(event.target.value || ''))}
          >
            {terminalOptions.map((terminal) => (
              <MenuItem key={terminal.id} value={String(terminal.id)}>
                {terminal.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="external-filter-label">Analisis</InputLabel>
          <Select
            labelId="external-filter-label"
            label="Analisis"
            value={analysisFilter}
            onChange={(event) => {
              const value = String(event.target.value)
              setAnalysisFilter(value)
              if (selectedTerminalId) {
                loadAnalyses(String(selectedTerminalId), value)
              }
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {analyses.map((analysis) => (
              <MenuItem
                key={analysis.analysis_type_id}
                value={String(analysis.analysis_type_id)}
              >
                {analysis.analysis_type_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<FilterAltOff fontSize="small" />}
          onClick={() => {
            setAnalysisFilter('all')
            if (selectedTerminalId) {
              loadAnalyses(String(selectedTerminalId), 'all')
            }
          }}
          disabled={analysisFilter === 'all'}
          sx={{ borderColor: '#c7d2fe', color: '#4338ca', height: 40 }}
        >
          Limpiar filtros
        </Button>
        <Chip
          label={`${records.length} registros`}
          size="small"
          sx={{ backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: 600 }}
        />
      </Box>

      {recordsError ? <Typography color="error">{recordsError}</Typography> : null}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Configuracion por terminal
            </Typography>
            {analyses.length === 0 ? (
              <Typography color="text.secondary">
                Sin analisis configurados para este terminal.
              </Typography>
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
                    {analyses.map((analysis) => (
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
          </Box>
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Historial de registros
            </Typography>
            {records.length === 0 ? (
              <Typography color="text.secondary">Sin registros.</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Analisis</TableCell>
                      <TableCell>Fecha</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>No. informe</TableCell>
                  <TableCell>PDF</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Incertidumbre</TableCell>
                  <TableCell>Metodo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.analysis_type_name}</TableCell>
                    <TableCell>{formatDate(record.performed_at)}</TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                    <TableCell>{record.report_number || '-'}</TableCell>
                    <TableCell>
                      {record.report_pdf_url ? (
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={record.report_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver PDF
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {record.result_value ?? '-'}
                    </TableCell>
                    <TableCell>{record.result_unit || '-'}</TableCell>
                    <TableCell>
                      {record.result_uncertainty ?? '-'}
                    </TableCell>
                    <TableCell>{record.method || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}

      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Registrar analisis externo</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <FormControl>
            <InputLabel id="external-modal-terminal-label">Terminal</InputLabel>
            <Select
              labelId="external-modal-terminal-label"
              label="Terminal"
              value={form.terminal_id}
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
          <FormControl>
            <InputLabel id="external-analysis-label">Analisis</InputLabel>
            <Select
              labelId="external-analysis-label"
              label="Analisis"
              value={form.analysis_type_id}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  analysis_type_id: String(event.target.value || ''),
                }))
              }
            >
              {activeAnalyses.map((analysis) => (
                <MenuItem
                  key={analysis.analysis_type_id}
                  value={String(analysis.analysis_type_id)}
                >
                  {analysis.analysis_type_name}
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
          <TextField
            label="Numero de informe"
            value={form.report_number}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, report_number: event.target.value }))
            }
          />
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: '1fr 140px' }}>
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
          </Box>
          <TextField
            label="Incertidumbre"
            type="number"
            value={form.result_uncertainty}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, result_uncertainty: event.target.value }))
            }
          />
          <TextField
            label="Metodo"
            value={form.method}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, method: event.target.value }))
            }
          />
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
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveRecord} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ExternalAnalysesTable
