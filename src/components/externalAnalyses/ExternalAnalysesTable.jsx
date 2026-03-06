import { useEffect, useMemo, useState } from 'react'
import { todayColombiaStr, formatDateCO, utcToColombiaDateStr } from '../../utils/dateUtils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getStoredFilterValue } from '../../utils/storage'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { FilterAltOff } from '@mui/icons-material'
import {
  createExternalAnalysisRecord,
  deleteExternalAnalysisRecord,
  fetchExternalAnalysesByTerminal,
  fetchExternalAnalysisRecords,
  updateExternalAnalysisRecord,
  uploadExternalAnalysisReport,
} from '../../services/api'
import { useAuthStore } from '../../store/useAuthStore'
import { ExternalAnalysisFormDialog } from './ExternalAnalysisFormDialog'
import {
  ExternalAnalysisDeleteDialog,
  ExternalAnalysisToast,
  ExternalAnalysisViewDialog,
} from './ExternalAnalysisDialogs'
import { ExternalAnalysesTables } from './ExternalAnalysesTables'

const ExternalAnalysesTable = ({ terminals, companies, currentUser }) => {
  const { tokenType, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedTerminalId, setSelectedTerminalId] = useState(() =>
    getStoredFilterValue('externalAnalyses.filters.terminal', ''),
  )
  const [analysisFilter, setAnalysisFilter] = useState(() =>
    getStoredFilterValue('externalAnalyses.filters.analysis', 'all'),
  )
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reportFile, setReportFile] = useState(null)
  const [form, setForm] = useState({
    terminal_id: '',
    analysis_type_id: '',
    analysis_company_id: '',
    performed_at: todayColombiaStr(),
    report_number: '',
    result_value: '',
    result_unit: '',
    result_uncertainty: '',
    method: '',
    notes: '',
  })
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const analysesEnabled = Boolean(selectedTerminalId)
  const {
    data: analyses = [],
    isLoading: isLoadingAnalyses,
    error: analysesError,
  } = useQuery({
    queryKey: ['external-analyses', String(selectedTerminalId || '')],
    queryFn: async () => {
      const data = await fetchExternalAnalysesByTerminal({
        tokenType,
        accessToken,
        terminalId: String(selectedTerminalId || ''),
      })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && analysesEnabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const {
    data: records = [],
    isLoading: isLoadingRecords,
    error: recordsError,
  } = useQuery({
    queryKey: ['external-analysis-records', String(selectedTerminalId || ''), analysisFilter],
    queryFn: async () => {
      const data = await fetchExternalAnalysisRecords({
        tokenType,
        accessToken,
        terminalId: String(selectedTerminalId || ''),
        query: analysisFilter === 'all' ? '' : analysisFilter,
      })
      return Array.isArray(data?.items) ? data.items : []
    },
    enabled: Boolean(accessToken) && analysesEnabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const isLoading = isLoadingAnalyses || isLoadingRecords
  const terminalOptions = useMemo(() => {
    const items = Array.isArray(terminals) ? [...terminals] : []
    return items.sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'es', {
        sensitivity: 'base',
      }),
    )
  }, [terminals])
  const companyOptions = useMemo(() => (Array.isArray(companies) ? companies : []), [companies])
  const activeAnalyses = useMemo(() => analyses.filter((item) => item.is_active), [analyses])
  const filteredAnalyses = useMemo(() => {
    if (analysisFilter === 'all') return analyses
    return analyses.filter((a) => String(a.analysis_type_id) === analysisFilter)
  }, [analyses, analysisFilter])
  const isVisitor = String(currentUser?.user_type || '').toLowerCase() === 'visitor'
  const isCreateMode = formMode === 'create'

  const analysesErrorMessage = analysesError
    ? analysesError?.detail ||
      analysesError?.message ||
      String(analysesError || '') ||
      'No se pudieron cargar los analisis configurados.'
    : ''

  const recordsErrorMessage = recordsError
    ? recordsError?.detail ||
      recordsError?.message ||
      String(recordsError || '') ||
      'No se pudieron cargar los analisis externos.'
    : ''

  const createRecordMutation = useMutation({
    mutationFn: (args) => createExternalAnalysisRecord(args),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      }),
  })

  const updateRecordMutation = useMutation({
    mutationFn: (args) => updateExternalAnalysisRecord(args),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      }),
  })

  const deleteRecordMutation = useMutation({
    mutationFn: (args) => deleteExternalAnalysisRecord(args),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      }),
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'externalAnalyses.filters.terminal',
      JSON.stringify(selectedTerminalId),
    )
  }, [selectedTerminalId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('externalAnalyses.filters.analysis', JSON.stringify(analysisFilter))
  }, [analysisFilter])

  useEffect(() => {
    if (selectedTerminalId || terminalOptions.length === 0) return
    const storedId = localStorage.getItem('external_analyses_terminal_id')
    if (storedId && terminalOptions.some((terminal) => String(terminal.id) === String(storedId))) {
      setSelectedTerminalId(String(storedId))
      return
    }
    setSelectedTerminalId(String(terminalOptions[0]?.id || ''))
  }, [selectedTerminalId, terminalOptions])

  useEffect(() => {
    if (!selectedTerminalId) return
    localStorage.setItem('external_analyses_terminal_id', String(selectedTerminalId))
  }, [selectedTerminalId])

  useEffect(() => {
    if (!form.analysis_type_id) return
    const selected = analyses.find(
      (item) => String(item.analysis_type_id) === String(form.analysis_type_id),
    )
    if (!selected) return

    const name = String(selected.analysis_type_name || '').toLowerCase()
    const defaultMethods = {
      sedimentos: 'ASTM D473-22',
      azufre: 'ASTM D4294-21',
    }
    const defaultResults = {
      assay: { result_value: 1, result_uncertainty: 1 },
      cromatografia: { result_value: 1, result_uncertainty: 1 },
    }
    const nextDefaultMethod = defaultMethods[name]
    const nextDefaultResult = defaultResults[name]

    setForm((prev) => {
      const shouldClearMethod =
        !nextDefaultMethod && Object.values(defaultMethods).includes(prev.method || '')

      return {
        ...prev,
        result_unit:
          name === 'sedimentos' || name === 'azufre'
            ? prev.result_unit || '% masa'
            : prev.result_unit,
        method: nextDefaultMethod || (shouldClearMethod ? '' : prev.method),
        result_value:
          nextDefaultResult && (prev.result_value === '' || prev.result_value === null)
            ? nextDefaultResult.result_value
            : prev.result_value,
        result_uncertainty:
          nextDefaultResult &&
          (prev.result_uncertainty === '' || prev.result_uncertainty === null)
            ? nextDefaultResult.result_uncertainty
            : prev.result_uncertainty,
      }
    })
  }, [form.analysis_type_id, analyses])

  const getDueStatus = (analysis) => {
    const nextDate = analysis?.next_due_at ? new Date(analysis.next_due_at) : null
    if (!nextDate || Number.isNaN(nextDate.getTime())) {
      return { label: '-', color: 'text.secondary', status: 'none' }
    }

    const due = nextDate.getTime()
    const nowMs = Date.now()

    if (due < nowMs) {
      return { label: formatDateCO(nextDate), color: '#dc2626', status: 'overdue' }
    }

    const frequencyDays =
      analysis?.frequency_days && analysis.frequency_days > 0 ? analysis.frequency_days : null
    if (!frequencyDays) {
      return { label: formatDateCO(nextDate), color: '#16a34a', status: 'ok' }
    }

    const msToDue = due - nowMs
    const warnThresholdMs = frequencyDays * 0.15 * 24 * 60 * 60 * 1000
    if (msToDue <= warnThresholdMs) {
      return { label: formatDateCO(nextDate), color: '#ca8a04', status: 'warning' }
    }

    return { label: formatDateCO(nextDate), color: '#16a34a', status: 'ok' }
  }

  const openCreate = () => {
    setFormMode('create')
    setSelectedRecord(null)
    const defaultType = activeAnalyses[0]?.analysis_type_id
    setForm({
      terminal_id: selectedTerminalId ? String(selectedTerminalId) : '',
      analysis_type_id: defaultType ? String(defaultType) : '',
      analysis_company_id: '',
      performed_at: todayColombiaStr(),
      report_number: '',
      result_value: '',
      result_unit: '',
      result_uncertainty: '',
      method: '',
      notes: '',
    })
    setReportFile(null)
    setIsFormOpen(true)
  }

  const openEdit = (record) => {
    if (!record) return
    setFormMode('edit')
    setSelectedRecord(record)
    setForm({
      terminal_id: String(record.terminal_id || ''),
      analysis_type_id: String(record.analysis_type_id || ''),
      analysis_company_id: record.analysis_company_id ? String(record.analysis_company_id) : '',
      performed_at: utcToColombiaDateStr(record.performed_at),
      report_number: record.report_number || '',
      result_value:
        record.result_value === null || record.result_value === undefined
          ? ''
          : String(record.result_value),
      result_unit: record.result_unit || '',
      result_uncertainty:
        record.result_uncertainty === null || record.result_uncertainty === undefined
          ? ''
          : String(record.result_uncertainty),
      method: record.method || '',
      notes: record.notes || '',
    })
    setReportFile(null)
    setIsFormOpen(true)
  }

  const openView = (record) => {
    setSelectedRecord(record)
    setIsViewOpen(true)
  }

  const openDelete = (record) => {
    setSelectedRecord(record)
    setIsDeleteOpen(true)
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
      const created = await createRecordMutation.mutateAsync({
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
          analysis_company_id:
            form.analysis_company_id === '' ? null : Number(form.analysis_company_id),
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
      setIsFormOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      })
      await queryClient.invalidateQueries({
        queryKey: ['external-analysis-records', String(selectedTerminalId || ''), analysisFilter],
      })
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

  const handleUpdateRecord = async () => {
    if (!selectedRecord?.id) return
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
      await updateRecordMutation.mutateAsync({
        tokenType,
        accessToken,
        recordId: selectedRecord.id,
        payload: {
          analysis_type_id: Number(form.analysis_type_id),
          performed_at: form.performed_at || null,
          report_number: form.report_number?.trim() || null,
          result_value: form.result_value === '' ? null : Number(form.result_value),
          result_unit: form.result_unit?.trim() || null,
          result_uncertainty:
            form.result_uncertainty === '' ? null : Number(form.result_uncertainty),
          method: form.method?.trim() || null,
          analysis_company_id:
            form.analysis_company_id === '' ? null : Number(form.analysis_company_id),
          notes: form.notes?.trim() || null,
        },
      })

      if (reportFile) {
        await uploadExternalAnalysisReport({
          tokenType,
          accessToken,
          recordId: selectedRecord.id,
          file: reportFile,
        })
      }

      setToast({
        open: true,
        message: 'Analisis actualizado correctamente.',
        severity: 'success',
      })
      setIsFormOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      })
      await queryClient.invalidateQueries({
        queryKey: ['external-analysis-records', String(selectedTerminalId || ''), analysisFilter],
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo actualizar el analisis.',
        severity: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRecord = async () => {
    if (!selectedRecord?.id) return
    setIsDeleting(true)
    try {
      await deleteRecordMutation.mutateAsync({
        tokenType,
        accessToken,
        recordId: selectedRecord.id,
      })
      setToast({
        open: true,
        message: 'Registro eliminado correctamente.',
        severity: 'success',
      })
      setIsDeleteOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['external-analyses', String(selectedTerminalId || '')],
      })
      await queryClient.invalidateQueries({
        queryKey: ['external-analysis-records', String(selectedTerminalId || ''), analysisFilter],
      })
    } catch (err) {
      setToast({
        open: true,
        message: err?.detail || 'No se pudo eliminar el registro.',
        severity: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          pb: 1.5,
          borderBottom: '2px solid rgba(227, 28, 121, 0.15)',
        }}
      >
        <Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{ fontWeight: 700, color: 'secondary.dark', lineHeight: 1.2 }}
          >
            Analisis externos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Registro de analisis externos por terminal
          </Typography>
        </Box>
        {isVisitor ? null : (
          <Button
            variant="contained"
            onClick={openCreate}
            disabled={!selectedTerminalId || activeAnalyses.length === 0}
          >
            Registrar analisis
          </Button>
        )}
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
                queryClient.invalidateQueries({
                  queryKey: ['external-analysis-records', String(selectedTerminalId || ''), value],
                })
              }
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {analyses.map((analysis) => (
              <MenuItem key={analysis.analysis_type_id} value={String(analysis.analysis_type_id)}>
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
              queryClient.invalidateQueries({
                queryKey: ['external-analysis-records', String(selectedTerminalId || ''), 'all'],
              })
            }
          }}
          disabled={analysisFilter === 'all'}
          sx={{ borderColor: 'rgba(227, 28, 121, 0.4)', color: 'secondary.main', height: 40 }}
        >
          Limpiar filtros
        </Button>

        <Chip
          label={`${records.length} registros`}
          size="small"
          sx={{ backgroundColor: 'primary.light', color: 'primary.main', fontWeight: 600 }}
        />
      </Box>

      {recordsError ? <Typography color="error">{recordsErrorMessage}</Typography> : null}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <ExternalAnalysesTables
          analyses={filteredAnalyses}
          analysesError={analysesError}
          analysesErrorMessage={analysesErrorMessage}
          records={records}
          formatDate={formatDateCO}
          getDueStatus={getDueStatus}
          isVisitor={isVisitor}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      <ExternalAnalysisFormDialog
        open={isFormOpen}
        mode={formMode}
        form={form}
        setForm={setForm}
        terminalOptions={terminalOptions}
        analysisOptions={isCreateMode ? activeAnalyses : analyses}
        companyOptions={companyOptions}
        reportFile={reportFile}
        setReportFile={setReportFile}
        isSaving={isSaving}
        onClose={() => setIsFormOpen(false)}
        onSubmit={isCreateMode ? handleSaveRecord : handleUpdateRecord}
      />

      <ExternalAnalysisViewDialog
        open={isViewOpen}
        selectedRecord={selectedRecord}
        formatDate={formatDateCO}
        onClose={() => setIsViewOpen(false)}
      />

      <ExternalAnalysisDeleteDialog
        open={isDeleteOpen}
        selectedRecord={selectedRecord}
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirmDelete={handleDeleteRecord}
      />

      <ExternalAnalysisToast
        toast={toast}
        onCloseToast={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  )
}

export default ExternalAnalysesTable
