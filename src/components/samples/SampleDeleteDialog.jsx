import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

const SampleDeleteDialog = ({ deleteTarget, onClose, onConfirm }) => {
  return (
    <Dialog
      open={Boolean(deleteTarget)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(227, 28, 121, 0.15)', pb: 1.5 }}>
        Eliminar muestra
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
        <Typography color="text.secondary">
          Esta accion eliminara la ultima muestra si no tiene datos registrados.
        </Typography>
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            backgroundColor: '#fdfafe',
            border: '1px solid #e2e8f0',
            display: 'grid',
            gap: 0.5,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
            {deleteTarget?.code || 'Muestra'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {deleteTarget?.identifier
              ? `Identificador: ${deleteTarget.identifier}`
              : 'Sin identificador'}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Solo se permite eliminar la ultima muestra sin API 60F ni Agua.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: '#ef4444',
            '&:hover': { backgroundColor: '#dc2626' },
          }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SampleDeleteDialog
