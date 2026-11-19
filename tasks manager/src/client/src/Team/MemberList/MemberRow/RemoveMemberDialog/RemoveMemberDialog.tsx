import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useRemoveMember } from '@/api/projects'
import { messageOf } from '@/common/ErrorState/ErrorState'

interface RemoveMemberDialogProps {
  projectId: string
  memberId: string
  memberName: string
  onClose: () => void
}

/** Removing someone is the one action here that cannot be undone with a click, so it asks first (and says what happens). */
export function RemoveMemberDialog({ projectId, memberId, memberName, onClose }: RemoveMemberDialogProps) {
  const remove = useRemoveMember(projectId)

  async function confirm() {
    await remove.mutateAsync(memberId)
    onClose()
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Remove {memberName}?</DialogTitle>
      <DialogContent>
        {remove.error && <Alert severity="error" sx={{ mb: 2 }}>{messageOf(remove.error)}</Alert>}
        <DialogContentText>
          {memberName} loses access to this project immediately. Tasks assigned to them stay assigned until you reassign them. They can rejoin later with a new invitation code.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Keep {memberName}
        </Button>
        <Button variant="contained" color="error" onClick={confirm} disabled={remove.isPending}>
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  )
}
