import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type FormEvent } from 'react'
import { useAddComment } from '@/api/tasks'
import type { CommentDto, TeamMemberDto } from '@/api/types'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { Surface } from '@/common/Surface/Surface'
import { CommentItem } from '@/TaskDetail/CommentThread/CommentItem/CommentItem'

interface CommentThreadProps {
  taskId: string
  comments: CommentDto[]
  members: Map<string, TeamMemberDto>
}

export function CommentThread({ taskId, comments, members }: CommentThreadProps) {
  const add = useAddComment(taskId)
  const [text, setText] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    await add.mutateAsync(text)
    setText('')
  }

  return (
    <Surface>
      <Typography variant="h2" component="h2">
        Comments
      </Typography>
      {comments.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 1.5 }}>
          No comments yet.
        </Typography>
      )}
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} author={members.get(comment.authorId)} />
      ))}
      <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
        {add.error && <Alert severity="error">{messageOf(add.error)}</Alert>}
        <TextField label="Add a comment" multiline minRows={2} value={text} onChange={(event) => setText(event.target.value)} />
        <Box>
          <Button type="submit" variant="contained" disabled={!text.trim() || add.isPending}>
            Comment
          </Button>
        </Box>
      </Box>
    </Surface>
  )
}
