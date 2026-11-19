import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import type { Role } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { useAuth } from '@/auth/useAuth'

export function RegisterForm({ onSignedIn }: { onSignedIn: () => void }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('Member')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Validate as the person types, not only on submit: the rule is visible before it can fail.
  const passwordTooShort = password.length > 0 && password.length < 8

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register({ name, email, password, role })
      onSignedIn()
    } catch (failure) {
      setError(messageOf(failure))
      setBusy(false)
    }
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2} noValidate>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Full name" autoComplete="name" autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordTooShort}
        helperText="At least 8 characters"
      />
      <TextField select label="I am a" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        <MenuItem value="Member">Team member</MenuItem>
        <MenuItem value="Manager">Manager</MenuItem>
      </TextField>
      <Button type="submit" variant="contained" disabled={busy || !name || !email || password.length < 8}>
        {busy ? 'Creating account…' : 'Create account'}
      </Button>
    </Stack>
  )
}
