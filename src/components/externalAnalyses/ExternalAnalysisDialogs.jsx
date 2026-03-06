import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material'

const ExternalAnalysisViewDialog = ({ open, selectedRecord, formatDate, onClose }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
      Detalle de analisis externo
    </DialogTitle>
    <DialogContent sx={{ display: 'grid', gap: 2, pt: '16px !important' }}>
      <TextField label="Fecha" value={formatDate(selectedRecord?.performed_at)} disabled />
      <TextField label="Analisis" value={selectedRecord?.analysis_type_name || '-'} disabled />
      <TextField label="Empresa" value={selectedRecord?.analysis_company_name || '-'} disabled />
      <TextField label="Metodo" value={selectedRecord?.method || '-'} disabled />
      <TextField label="Numero de informe" value={selectedRecord?.report_number || '-'} disabled />
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: '2fr 1fr 1fr' }}>
        <TextField
          label="Resultado"
          value={
            selectedRecord?.result_value === null || selectedRecord?.result_value === undefined
              ? '-'
              : String(selectedRecord.result_value)
          }
          disabled
        />
        <TextField label="Unidad" value={selectedRecord?.result_unit || '-'} disabled />
        <TextField
          label="Incertidumbre"
          value={
            selectedRecord?.result_uncertainty === null ||
            selectedRecord?.result_uncertainty === undefined
              ? '-'
              : String(selectedRecord.result_uncertainty)
          }
          disabled
        />
      </Box>
      <TextField
        label="Observaciones"
        value={selectedRecord?.notes || '-'}
        disabled
        multiline
        minRows={2}
      />
      {selectedRecord?.report_pdf_url ? (
        <Button
          variant="outlined"
          component="a"
          href={selectedRecord.report_pdf_url}
          target="_blank"
          rel="noreferrer"
        >
          Ver PDF
        </Button>
      ) : null}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
      <Button onClick={onClose}>Cerrar</Button>
    </DialogActions>
  </Dialog>
)

const ExternalAnalysisDeleteDialog = ({
  open,
  selectedRecord,
  isDeleting,
  onClose,
  onConfirmDelete,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
      Eliminar registro
    </DialogTitle>
    <DialogContent sx={{ pt: '16px !important' }}>
      <Typography>
        {selectedRecord
          ? `Vas a eliminar el registro de ${selectedRecord.analysis_type_name}.`
          : 'Vas a eliminar este registro.'}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
      <Button onClick={onClose}>Cancelar</Button>
      <Button variant="contained" color="error" disabled={isDeleting} onClick={onConfirmDelete}>
        {isDeleting ? 'Eliminando...' : 'Eliminar'}
      </Button>
    </DialogActions>
  </Dialog>
)

const ExternalAnalysisToast = ({ toast, onCloseToast }) => (
  <Snackbar
    open={toast.open}
    autoHideDuration={3500}
    onClose={onCloseToast}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  >
    <Alert onClose={onCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
      {toast.message}
    </Alert>
  </Snackbar>
)

export { ExternalAnalysisDeleteDialog, ExternalAnalysisToast, ExternalAnalysisViewDialog }
