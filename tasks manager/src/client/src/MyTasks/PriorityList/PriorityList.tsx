import Typography from '@mui/material/Typography'
import type { MyTaskDto } from '@/api/types'
import { Surface } from '@/common/Surface/Surface'
import { PriorityRow } from '@/MyTasks/PriorityList/PriorityRow/PriorityRow'

export function PriorityList({ items }: { items: MyTaskDto[] }) {
  return (
    <Surface sx={{ flex: '999 1 520px' }}>
      <Typography variant="h2" component="h2" sx={{ mb: 0.25 }}>
        Assigned to me
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {items.length} open {items.length === 1 ? 'task' : 'tasks'}
      </Typography>
      {items.map((item) => (
        <PriorityRow key={item.task.id} item={item} />
      ))}
    </Surface>
  )
}
