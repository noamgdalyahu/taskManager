import Box from '@mui/material/Box'
import type { SprintDto } from '@/api/types'
import { CapacityBar } from '@/common/CapacityBar/CapacityBar'
import { Surface } from '@/common/Surface/Surface'
import { downloadCsv } from '@/lib/csv'
import { formatDay } from '@/lib/format'
import { ReportToolbar } from '@/Reports/ReportToolbar/ReportToolbar'
import { SprintRange } from '@/Reports/SprintRange/SprintRange'
import { tokens } from '@/theme/tokens'

interface CapacityReportProps {
  sprints: SprintDto[]
  range: [string, string]
  onRange: (range: [string, string]) => void
}

/** How much of each sprint's capacity was planned. Over 90% is amber, over 100% red, and the number is written either way. */
export function CapacityReport({ sprints, range, onRange }: CapacityReportProps) {
  const shown = sprints.filter((sprint) => sprint.startDate >= range[0] && sprint.startDate <= range[1]).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const utilization = (sprint: SprintDto) => (sprint.teamCapacityHours > 0 ? Math.round((sprint.totalEstimateHours / sprint.teamCapacityHours) * 100) : 0)

  const exportCsv = () =>
    downloadCsv('capacity-utilization.csv', ['Sprint', 'Start', 'End', 'Status', 'Tasks', 'Planned hours', 'Capacity hours', 'Utilization %'], shown.map((s) => [s.name, s.startDate, s.endDate, s.status, s.taskCount, s.totalEstimateHours, s.teamCapacityHours, utilization(s)]))

  return (
    <>
      <ReportToolbar title="Capacity utilization" description="Planned hours against what the team can do, sprint by sprint." onExport={exportCsv} canExport={shown.length > 0}>
        <SprintRange sprints={sprints} range={range} onRange={onRange} />
      </ReportToolbar>
      <Surface>
        {shown.length === 0 ? (
          <Box sx={{ color: tokens.color.faint, fontSize: '0.8125rem' }}>No sprints in this range.</Box>
        ) : (
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shown.map((sprint) => (
              <li key={sprint.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.75, fontSize: '0.8125rem' }}>
                  <Box>
                    <Box component="span" dir="auto" sx={{ fontWeight: 600 }}>
                      {sprint.name}
                    </Box>{' '}
                    <Box component="span" sx={{ color: tokens.color.faint }}>
                      {formatDay(sprint.startDate)} to {formatDay(sprint.endDate)}
                    </Box>
                  </Box>
                  <Box component="span" sx={{ fontFamily: tokens.font.mono }}>
                    {utilization(sprint)}%
                  </Box>
                </Box>
                <CapacityBar planned={sprint.totalEstimateHours} capacity={sprint.teamCapacityHours} label={sprint.name} />
              </li>
            ))}
          </Box>
        )}
      </Surface>
    </>
  )
}
