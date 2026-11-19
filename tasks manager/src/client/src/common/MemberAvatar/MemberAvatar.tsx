import Avatar from '@mui/material/Avatar'
import { initials } from '@/lib/format'
import { toneFor } from '@/lib/tone'

interface MemberAvatarProps {
  id: string
  name: string
  size?: number
}

export function MemberAvatar({ id, name, size = 26 }: MemberAvatarProps) {
  const tone = toneFor(id)
  return (
    <Avatar
      title={name}
      alt={name}
      sx={{ width: size, height: size, fontSize: size * 0.42, fontWeight: 600, bgcolor: tone.bg, color: tone.fg, flex: '0 0 auto' }}
    >
      {initials(name)}
    </Avatar>
  )
}
