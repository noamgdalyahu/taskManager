import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState, type FormEvent } from 'react'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { useAuth } from '@/auth/useAuth'

export function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      onSignedIn()
    } catch (failure) {
      setError(messageOf(failure))
      setBusy(false)
    }
  }

  return (
    <Stack component="form" onSubmit={submit} spacing={2} noValidate>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Email" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" variant="contained" disabled={busy || !email || !password}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </Stack>
  )
}
