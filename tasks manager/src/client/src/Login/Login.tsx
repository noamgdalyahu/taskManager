import ViewKanbanOutlined from '@mui/icons-material/ViewKanbanOutlined'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { LoginForm } from '@/Login/LoginForm/LoginForm'
import { RegisterForm } from '@/Login/RegisterForm/RegisterForm'
import { Surface } from '@/common/Surface/Surface'
import { tokens } from '@/theme/tokens'

export function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  if (user) return <Navigate to={from} replace />

  const goBack = () => navigate(from, { replace: true })

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box aria-hidden sx={{ width: 40, height: 40, borderRadius: '4px', border: `1px solid ${tokens.color.borderStrong}`, display: 'grid', placeItems: 'center' }}>
            <ViewKanbanOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h1" component="h1" sx={{ textAlign: 'center' }}>
            Team Sprint Manager
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            Plan sprints, balance the workload, see the finish date before it slips.
          </Typography>
        </Box>
        <Surface padding={3}>
          <Tabs value={mode} onChange={(_event, value: 'signin' | 'register') => setMode(value)} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab value="signin" label="Sign in" />
            <Tab value="register" label="Create account" />
          </Tabs>
          {mode === 'signin' ? <LoginForm onSignedIn={goBack} /> : <RegisterForm onSignedIn={goBack} />}
        </Surface>
      </Box>
    </Box>
  )
}
