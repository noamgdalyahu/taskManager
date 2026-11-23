import AddRounded from '@mui/icons-material/AddRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SprintDto } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { NewSprintDialog } from '@/common/NewSprintDialog/NewSprintDialog'
import { SprintCard } from '@/ProjectOverview/SprintList/SprintCard/SprintCard'

export function SprintList({ projectId, sprints }: { projectId: string; sprints: SprintDto[] }) {
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const [creating, setCreating] = useState(false)

  const newSprintButton = !isManager ? undefined : (
    <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreating(true)}>
      New sprint
    </Button>
  )

  return (
    <Box component="section" aria-labelledby="sprints-heading" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography id="sprints-heading" variant="h2" component="h2">
          Sprints
        </Typography>
        {sprints.length > 0 && newSprintButton}
      </Box>
      {sprints.length === 0 ? (
        <EmptyState title="No sprints yet" description="A sprint is a fixed period of work. Create one, then pick its tasks from the backlog below." action={newSprintButton} />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} />
          ))}
        </Box>
      )}
      {/* Remounted on each open so its fields start fresh with a sensible name and dates. */}
      {creating && (
        <NewSprintDialog
          open
          projectId={projectId}
          existingCount={sprints.length}
          onClose={() => setCreating(false)}
          onCreated={(sprint) => {
            setCreating(false)
            navigate(`/p/${projectId}/planning/${sprint.id}`)
          }}
        />
      )}
    </Box>
  )
}
