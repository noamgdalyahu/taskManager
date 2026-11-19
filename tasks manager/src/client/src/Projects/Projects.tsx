import AddRounded from '@mui/icons-material/AddRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@/api/projects'
import { useAuth } from '@/auth/useAuth'
import { EmptyState } from '@/common/EmptyState/EmptyState'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { JoinProjectDialog } from '@/Projects/JoinProjectDialog/JoinProjectDialog'
import { NewProjectDialog } from '@/common/NewProjectDialog/NewProjectDialog'
import { ProjectCard } from '@/Projects/ProjectCard/ProjectCard'

export function Projects() {
  const { isManager } = useAuth()
  const navigate = useNavigate()
  const projects = useProjects()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  // Managers work in the backlog; members go straight to the board, which is where their work lives.
  const open = (projectId: string) => navigate(isManager ? `/p/${projectId}` : `/p/${projectId}/board`)

  const actions = (
    <>
      <Button variant="outlined" onClick={() => setJoining(true)}>
        Join with code
      </Button>
      {isManager && (
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreating(true)}>
          New project
        </Button>
      )}
    </>
  )

  return (
    <>
      <PageHeader title="Projects" subtitle="Every project you belong to." actions={actions} />

      {projects.isLoading && <PageLoading />}
      {projects.error && <ErrorState error={projects.error} onRetry={() => projects.refetch()} />}
      {projects.data?.length === 0 && (
        <EmptyState
          title="No projects yet"
          description={isManager ? 'Create the first project, then invite your team with a code.' : 'Ask your manager for an invitation code and join their project.'}
          action={
            isManager ? (
              <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreating(true)}>
                New project
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setJoining(true)}>
                Join with code
              </Button>
            )
          }
        />
      )}
      {!!projects.data?.length && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {projects.data.map((project) => (
            <ProjectCard key={project.id} project={project} to={isManager ? `/p/${project.id}` : `/p/${project.id}/board`} />
          ))}
        </Box>
      )}

      <NewProjectDialog open={creating} onClose={() => setCreating(false)} onCreated={open} />
      <JoinProjectDialog open={joining} onClose={() => setJoining(false)} onJoined={open} />
    </>
  )
}
