import Button from '@mui/material/Button'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/common/EmptyState/EmptyState'

export function NotFound() {
  return (
    <EmptyState
      title="This page doesn't exist"
      description="The link may be old, or you may not have access to it"
      action={
        <Button component={Link} to="/" variant="contained">
          Go to my start page
        </Button>
      }
    />
  )
}
