import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useDeleteTask } from '@/api/tasks'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface DeleteTaskDialogProps {
  task: { id: string; title: string }
  onClose: () => void
  /** Called after the task is gone, for example to leave its page. */
  onDeleted?: () => void
}

/** Asks before deleting a work item. The delete takes its comments, time logs and history with it and cannot be undone. */
export function DeleteTaskDialog({ task, onClose, onDeleted }: DeleteTaskDialogProps) {
  const remove = useDeleteTask()

  async function confirm() {
    await remove.mutateAsync(task.id)
    onClose()
    onDeleted?.()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete this work item?</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <strong dir="auto">{task.title}</strong> will be deleted, with its comments, time logs and history. Work items that were waiting for it stop waiting. This cannot be undone.
        </DialogContentText>
        {remove.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {messageOf(remove.error)}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" variant="contained" autoFocus disabled={remove.isPending} onClick={confirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
