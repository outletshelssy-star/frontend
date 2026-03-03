import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Cancel,
  CheckCircle,
  DeleteOutline,
  EditOutlined,
  VisibilityOutlined,
  WarningAmber,
} from '@mui/icons-material'

const ExternalAnalysesTables = ({
  analyses,
  analysesError,
  analysesErrorMessage,
  records,
  formatDate,
  getDueStatus,
  isVisitor,
  onView,
  onEdit,
  onDelete,
}) => (
  <>
    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Configuracion por terminal
      </Typography>
      {analysesError ? (
        <Typography color="error">{analysesErrorMessage}</Typography>
      ) : analyses.length === 0 ? (
        <Typography color="text.secondary">Sin analisis configurados para este terminal.</Typography>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
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
                  {(() => {
                    const status = getDueStatus(analysis)
                    const iconMap = {
                      ok: <CheckCircle fontSize="small" />,
                      overdue: <Cancel fontSize="small" />,
                      warning: <WarningAmber fontSize="small" />,
                    }
                    const icon = iconMap[status.status] || null
                    return (
                      <TableCell
                        sx={{
                          color: status.color,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                        }}
                      >
                        {icon}
                        {status.label}
                      </TableCell>
                    )
                  })()}
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
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
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
                <TableCell>Fecha</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Analisis</TableCell>
                <TableCell>Metodo</TableCell>
                <TableCell>No. informe</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Incertidumbre</TableCell>
                <TableCell>PDF</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.performed_at)}</TableCell>
                  <TableCell>{record.analysis_company_name || '-'}</TableCell>
                  <TableCell>{record.analysis_type_name}</TableCell>
                  <TableCell>{record.method || '-'}</TableCell>
                  <TableCell>{record.report_number || '-'}</TableCell>
                  <TableCell>{record.result_value ?? '-'}</TableCell>
                  <TableCell>{record.result_unit || '-'}</TableCell>
                  <TableCell>{record.result_uncertainty ?? '-'}</TableCell>
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
                  <TableCell>{record.notes || '-'}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Ver analisis">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onView(record)}
                            sx={{ color: '#64748b', '&:hover': { color: 'primary.main' } }}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Editar analisis">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onEdit(record)}
                            disabled={isVisitor}
                            sx={{ color: '#64748b', '&:hover': { color: '#0f766e' } }}
                          >
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar analisis">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(record)}
                            disabled={isVisitor}
                            sx={{ color: '#64748b', '&:hover': { color: '#b91c1c' } }}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </>
)

export { ExternalAnalysesTables }
