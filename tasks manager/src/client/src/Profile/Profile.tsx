import Box from '@mui/material/Box'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PasswordForm } from '@/Profile/PasswordForm/PasswordForm'
import { ProfileForm } from '@/Profile/ProfileForm/ProfileForm'
import { useCurrentUser } from '@/auth/useAuth'

export function Profile() {
  const user = useCurrentUser()
  return (
    <>
      <PageHeader eyebrow={user.role} title="Profile" subtitle="Your skills and hours decide which tasks the planner can give you" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'flex-start' }}>
        <ProfileForm />
        <PasswordForm />
      </Box>
    </>
  )
}
