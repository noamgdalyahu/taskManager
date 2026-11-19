import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { ProjectDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { formatDay } from '@/lib/format'
import { press } from '@/theme/motion'

/** A whole card is one link, so the target is large and the press feedback is felt on the card itself. */
export function ProjectCard({ project, to }: { project: ProjectDto; to: string }) {
  return (
    <motion.div whileTap={press} style={{ display: 'flex' }}>
      <Box
        component={Link}
        to={to}
        sx={{
          flex: 1,
          display: 'flex',
          textDecoration: 'none',
          color: 'inherit',
          borderRadius: '12px',
          '&:hover > .card': { borderColor: 'primary.main' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
      <Surface className="card" sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, transition: 'border-color 120ms ease-out' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h2" component="h2">
            {project.name}
          </Typography>
          {project.isArchived && <Chip size="small" label="Archived" />}
        </Box>
        <Typography color="text.secondary" sx={{ flex: 1, minHeight: 40 }}>
          {project.description || 'No description yet.'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary' }}>
          <Typography variant="body2">
            {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'} · created {formatDay(project.createdAt.slice(0, 10))}
          </Typography>
          <ArrowForwardRounded fontSize="small" />
        </Box>
      </Surface>
      </Box>
    </motion.div>
  )
}
