import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

/** Turns anything thrown into a sentence a person can act on, with a retry when one makes sense. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      {messageOf(error)}
    </Alert>
  )
}
