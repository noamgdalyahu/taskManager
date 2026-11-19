import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useInvite } from '@/api/projects'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { formatDay } from '@/lib/format'
import { tokens } from '@/theme/tokens'

export function InvitePanel({ projectId }: { projectId: string }) {
  const invite = useInvite(projectId)
  const [days, setDays] = useState(7)
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const code = invite.data

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the code is on screen to read out or select.
    }
  }

  return (
    <Surface sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h2" component="h2">
          Invite someone
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share the code. They enter it under Projects, Join with code. Each code works once.
        </Typography>
      </Box>
      {invite.error && <Alert severity="error">{messageOf(invite.error)}</Alert>}
      <Stack spacing={2}>
        <TextField label="Restrict to one email (optional)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField select label="Code expires in" value={days} onChange={(event) => setDays(Number(event.target.value))}>
          {[1, 7, 14, 30].map((option) => (
            <MenuItem key={option} value={option}>
              {option} {option === 1 ? 'day' : 'days'}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" disabled={invite.isPending} onClick={() => invite.mutate({ email: email || undefined, expiresInDays: days })}>
          Create invitation code
        </Button>
      </Stack>
      {code && (
        <Box sx={{ bgcolor: tokens.color.primarySoft, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            aria-label={`Invitation code ${code.code.split('').join(' ')}`}
            sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.18em', color: tokens.color.primaryHover }}
          >
            {code.code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Valid until {formatDay(code.expiresAt.slice(0, 10))}
            {code.email ? `, only for ${code.email}` : ''}
          </Typography>
          <Box>
            <Button size="small" variant="outlined" startIcon={<ContentCopyOutlined />} onClick={copy}>
              {copied ? 'Copied' : 'Copy code'}
            </Button>
          </Box>
        </Box>
      )}
    </Surface>
  )
}
