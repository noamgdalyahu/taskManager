import Box from '@mui/material/Box'
import { TASK_TYPES, TASK_TYPE_PURPOSE, type TaskDto } from '@/api/types'
import { TypeChip } from '@/common/TypeChip/TypeChip'
import { SettingsSection } from '@/ProjectSettings/SettingsSection/SettingsSection'
import { tokens } from '@/theme/tokens'

/** The work item types and the colour each one wears. The list is fixed by the product, so it is shown with how many work items use each. */
export function TypeSettings({ tasks }: { tasks: TaskDto[] }) {
  const counts = new Map<string, number>()
  for (const task of tasks) if (task.type) counts.set(task.type, (counts.get(task.type) ?? 0) + 1)
  return (
    <SettingsSection id="types" title="Types" description="Every work item has one type, which also sets the colour of its tag. The set of types is fixed.">
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {TASK_TYPES.map((type) => (
          <Box component="li" key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: `1px solid ${tokens.color.border}`, '&:first-of-type': { borderTop: 0 } }}>
            <Box sx={{ flex: '0 0 170px' }}>
              <TypeChip type={type} />
            </Box>
            <Box sx={{ flex: 1, fontSize: '0.8125rem', color: tokens.color.muted }}>{TASK_TYPE_PURPOSE[type]}</Box>
            <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: '0.75rem', color: tokens.color.faint }}>
              {counts.get(type) ?? 0}
            </Box>
          </Box>
        ))}
      </Box>
    </SettingsSection>
  )
}
