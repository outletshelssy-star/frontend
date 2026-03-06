import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material'

const EquipmentFeedbackDialogs = ({
  isControlChartAlertOpen,
  onCloseControlChartAlert,
  controlChartAlertCount,
  isDeleteOpen,
  onCloseDelete,
  deletingEquipment,
  isDeleteLoading,
  onCancelDelete,
  onConfirmDelete,
  isCreateLoading,
  isUpdateLoading,
  toast,
  onCloseToast,
}) => {
  return (
    <>
      <Snackbar
        open={isControlChartAlertOpen}
        autoHideDuration={4000}
        onClose={onCloseControlChartAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={onCloseControlChartAlert}
          severity="warning"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {`Fuera de control: ${controlChartAlertCount}`}
        </Alert>
      </Snackbar>

      <Dialog open={isDeleteOpen} onClose={onCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Confirmar eliminacion
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography>
            {deletingEquipment
              ? `Vas a eliminar el equipo ${deletingEquipment.serial}.`
              : 'Vas a eliminar este equipo.'}
          </Typography>
          <Typography sx={{ mt: 1 }} color="text.secondary">
            Si el equipo tiene operaciones, se marcara como inactivo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onCancelDelete}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={onConfirmDelete} disabled={isDeleteLoading}>
            {isDeleteLoading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isCreateLoading} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Guardando equipo...
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: '16px !important', pb: 3 }}>
          <CircularProgress size={24} />
          <Typography>Esto puede tardar unos segundos.</Typography>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateLoading} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
          Actualizando equipo...
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: '16px !important', pb: 3 }}>
          <CircularProgress size={24} />
          <Typography>Esto puede tardar unos segundos.</Typography>
        </DialogContent>
      </Dialog>

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
    </>
  )
}

export { EquipmentFeedbackDialogs }
