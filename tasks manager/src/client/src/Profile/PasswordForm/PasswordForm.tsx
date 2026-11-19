import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { useChangePassword } from '@/api/account'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'

export function PasswordForm() {
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && confirm !== next
  const valid = current !== '' && next.length >= 8 && confirm === next

  async function submit(event: FormEvent) {
    event.preventDefault()
    setDone(false)
    await change.mutateAsync({ currentPassword: current, newPassword: next })
    setCurrent('')
    setNext('')
    setConfirm('')
    setDone(true)
  }

  return (
    <Surface sx={{ flex: '1 1 320px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 2 }}>
        Change password
      </Typography>
      <Stack component="form" onSubmit={submit} spacing={2} noValidate>
        {change.error && <Alert severity="error">{messageOf(change.error)}</Alert>}
        {done && <Alert severity="success">Password changed.</Alert>}
        <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          error={tooShort}
          helperText="At least 8 characters"
        />
        <TextField
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={mismatch}
          helperText={mismatch ? 'The two passwords differ' : ' '}
        />
        <div>
          <Button type="submit" variant="contained" disabled={!valid || change.isPending}>
            Change password
          </Button>
        </div>
      </Stack>
    </Surface>
  )
}
