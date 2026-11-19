import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { CommentDto, TeamMemberDto } from '@/api/types'
import { MemberAvatar } from '@/common/MemberAvatar/MemberAvatar'
import { formatDateTime } from '@/lib/format'

export function CommentItem({ comment, author }: { comment: CommentDto; author?: TeamMemberDto }) {
  const name = author?.name ?? 'Former member'
  return (
    <Box sx={{ display: 'flex', gap: 1.5, py: 1.5 }}>
      <MemberAvatar id={comment.authorId} name={name} size={32} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2">
          <strong>{name}</strong>{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            {formatDateTime(comment.createdAt)}
          </Typography>
        </Typography>
        {/* Rendered as text, never as HTML: a comment can contain anything and must not run as markup. */}
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.text}</Typography>
      </Box>
    </Box>
  )
}
