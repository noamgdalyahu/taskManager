import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { useUpdateProfile } from '@/api/account'
import { useCurrentUser, useAuth } from '@/auth/useAuth'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { SkillsEditor, type SkillRow } from '@/Profile/ProfileForm/SkillsEditor/SkillsEditor'

export function ProfileForm() {
  const user = useCurrentUser()
  const { updateUser } = useAuth()
  const update = useUpdateProfile()
  const [name, setName] = useState(user.name)
  const [capacity, setCapacity] = useState(String(user.weeklyCapacityHours))
  const [rows, setRows] = useState<SkillRow[]>(() => Object.entries(user.skills).map(([skill, level], index) => ({ key: index + 1, name: skill, level })))
  const [saved, setSaved] = useState(false)

  const capacityValue = Number(capacity)
  const capacityValid = capacity !== '' && capacityValue >= 0 && capacityValue <= 80

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaved(false)
    // Blank rows are the editor's scratch space, not skills.
    const skills = Object.fromEntries(rows.filter((row) => row.name.trim()).map((row) => [row.name.trim(), row.level]))
    const updated = await update.mutateAsync({ name, weeklyCapacityHours: capacityValue, skills })
    updateUser(updated)
    setSaved(true)
  }

  return (
    <Surface sx={{ flex: '999 1 480px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 2 }}>
        About you
      </Typography>
      <Stack component="form" onSubmit={submit} spacing={2.5} noValidate>
        {update.error && <Alert severity="error">{messageOf(update.error)}</Alert>}
        {saved && <Alert severity="success">Saved. Your next plan uses these skills and hours.</Alert>}
        <TextField label="Full name" required value={name} onChange={(event) => setName(event.target.value)} />
        <TextField label="Email" value={user.email} disabled helperText="Your email is your login and cannot be changed here" />
        <TextField
          label="Weekly capacity (hours)"
          type="number"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          error={capacity !== '' && !capacityValid}
          helperText="Hours you can give to sprint work in a full working week (0 to 80)"
          slotProps={{ htmlInput: { min: 0, max: 80, step: 1 } }}
        />
        <SkillsEditor rows={rows} onChange={setRows} />
        <div>
          <Button type="submit" variant="contained" disabled={!name.trim() || !capacityValid || update.isPending}>
            Save changes
          </Button>
        </div>
      </Stack>
    </Surface>
  )
}
