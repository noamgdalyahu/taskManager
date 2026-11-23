import Box from '@mui/material/Box'
import type { ReportsDto } from '@/api/types'
import { downloadCsv } from '@/lib/csv'
import { MemberAccuracy } from '@/Reports/MemberAccuracy/MemberAccuracy'
import { ReportToolbar } from '@/Reports/ReportToolbar/ReportToolbar'
import { SprintHistory } from '@/Reports/SprintHistory/SprintHistory'
import { SprintRange } from '@/Reports/SprintRange/SprintRange'
import { VelocityBars } from '@/Reports/VelocityBars/VelocityBars'

interface VelocityReportProps {
  data: ReportsDto
  range: [string, string]
  onRange: (range: [string, string]) => void
}

/** Hours finished per working day, sprint by sprint, with how well each sprint's estimates held up. */
export function VelocityReport({ data, range, onRange }: VelocityReportProps) {
  const sprints = data.sprints.filter((sprint) => sprint.startDate >= range[0] && sprint.startDate <= range[1])
  const average = sprints.length > 0 ? sprints.reduce((sum, sprint) => sum + sprint.velocityHoursPerDay, 0) / sprints.length : null

  const exportCsv = () =>
    downloadCsv(
      'velocity.csv',
      ['Sprint', 'Start', 'End', 'Status', 'Planned hours', 'Completed hours', 'Logged hours', 'Estimate accuracy %', 'Velocity h/day'],
      sprints.map((s) => [s.name, s.startDate, s.endDate, s.status, s.plannedHours, s.completedHours, s.loggedHours, Math.round(s.estimateAccuracyPercent), Math.round(s.velocityHoursPerDay * 100) / 100]),
    )

  return (
    <>
      <ReportToolbar title="Velocity" description="Hours completed per working day in each sprint, and how closely the estimates matched the logged time." onExport={exportCsv} canExport={sprints.length > 0}>
        <SprintRange sprints={data.sprints} range={range} onRange={onRange} />
      </ReportToolbar>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <VelocityBars sprints={sprints} average={average} />
        <MemberAccuracy members={data.members} />
      </Box>
      <SprintHistory sprints={sprints} />
    </>
  )
}
