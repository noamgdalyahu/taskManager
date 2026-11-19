import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { useChangeStatus, useLogTime } from '@/api/tasks'
import { STATUS_LABEL, TASK_STATUSES, type MyTaskDto, type TaskStatus } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'

export function LogTimeForm({ items }: { items: MyTaskDto[] }) {
  const logTime = useLogTime()
  const changeStatus = useChangeStatus()
  const [taskId, setTaskId] = useState(items[0]?.task.id ?? '')
  const [hours, setHours] = useState('2')
  const [moveTo, setMoveTo] = useState<TaskStatus | 'keep'>('keep')
  const [message, setMessage] = useState<{ severity: 'success' | 'warning'; text: string } | null>(null)

  const hoursValue = Number(hours)
  const valid = !!taskId && hoursValue >= 0.25 && hoursValue <= 24

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    try {
      await logTime.mutateAsync({ taskId, hours: hoursValue })
    } catch (error) {
      setMessage({ severity: 'warning', text: messageOf(error) })
      return
    }
    // The time is saved either way. A refused status change (dependency not done) is reported, not hidden.
    if (moveTo !== 'keep') {
      try {
        await changeStatus.mutateAsync({ taskId, status: moveTo })
      } catch (error) {
        setMessage({ severity: 'warning', text: `Time saved, but the status did not change: ${messageOf(error)}` })
        return
      }
    }
    setMessage({ severity: 'success', text: 'Saved.' })
    setMoveTo('keep')
  }

  return (
    <Surface>
      <Typography variant="h2" component="h2" sx={{ mb: 1.75 }}>
        Log time
      </Typography>
      <Stack component="form" onSubmit={submit} spacing={2} noValidate>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <TextField select label="Task" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
          {items.map((item) => (
            <MenuItem key={item.task.id} value={item.task.id}>
              {item.task.title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Hours"
          type="number"
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          error={hours !== '' && !valid}
          helperText="Between 0.25 and 24"
          slotProps={{ htmlInput: { min: 0.25, max: 24, step: 0.25 } }}
        />
        <TextField select label="Move to" value={moveTo} onChange={(event) => setMoveTo(event.target.value as TaskStatus | 'keep')}>
          <MenuItem value="keep">Keep current status</MenuItem>
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABEL[status]}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" disabled={!valid || logTime.isPending || changeStatus.isPending}>
          Save
        </Button>
      </Stack>
    </Surface>
  )
}
