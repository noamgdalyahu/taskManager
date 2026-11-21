import Box from '@mui/material/Box'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useReports } from '@/api/insight'
import { useProject } from '@/api/projects'
import { useSprints } from '@/api/sprints'
import { useProjectTasks } from '@/api/tasks'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageHeader } from '@/common/PageHeader/PageHeader'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { useProjectParams } from '@/hooks/useProjectParams'
import { BurndownReport } from '@/Reports/BurndownReport/BurndownReport'
import { CapacityReport } from '@/Reports/CapacityReport/CapacityReport'
import { FlowReport } from '@/Reports/FlowReport/FlowReport'
import { VelocityReport } from '@/Reports/VelocityReport/VelocityReport'
import { tokens } from '@/theme/tokens'

const REPORTS = [
  { key: 'burndown', label: 'Burndown', hint: 'Hours left, day by day' },
  { key: 'velocity', label: 'Velocity', hint: 'Hours done per day, per sprint' },
  { key: 'flow', label: 'Cumulative flow', hint: 'Created and done over time' },
  { key: 'capacity', label: 'Capacity utilization', hint: 'Planned hours against capacity' },
] as const

type ReportKey = (typeof REPORTS)[number]['key']

/** A list of report types on the left; the chosen one opens in full on the right. The choice is in the address, so a report can be linked. */
export function Reports() {
  const { projectId } = useProjectParams()
  const [params, setParams] = useSearchParams()
  const project = useProject(projectId)
  const reports = useReports(projectId)
  const sprints = useSprints(projectId)
  const tasks = useProjectTasks(projectId)
  const [range, setRange] = useState<[string, string] | null>(null)

  if (project.isLoading || reports.isLoading || sprints.isLoading || tasks.isLoading) return <PageLoading shape="detail" />
  const error = project.error ?? reports.error ?? sprints.error ?? tasks.error
  if (error) return <ErrorState error={error} onRetry={() => void reports.refetch()} />
  if (!reports.data) return null

  const requested = params.get('report')
  const current: ReportKey = REPORTS.some((report) => report.key === requested) ? (requested as ReportKey) : 'burndown'
  const starts = [...(sprints.data ?? [])].map((sprint) => sprint.startDate).sort()
  const bounds: [string, string] = range ?? [starts[0] ?? '', starts[starts.length - 1] ?? '']

  return (
    <>
      <PageHeader eyebrow={project.data?.name} title="Reports" subtitle="Choose a report, pick its range, and export it as CSV" />
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start', '@media (min-width: 900px)': { gridTemplateColumns: '240px minmax(0, 1fr)' } }}>
        <Box component="nav" aria-label="Report types" sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 0.5, overflowX: 'auto' }}>
          {REPORTS.map((report) => {
            const selected = report.key === current
            return (
              <Box
                key={report.key}
                component="button"
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => setParams({ report: report.key }, { replace: true })}
                sx={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: tokens.color.text, flex: '0 0 auto', px: 1.5, py: 1, borderRadius: `${tokens.radius.control}px`, border: `1px solid ${selected ? tokens.color.borderStrong : 'transparent'}`, bgcolor: selected ? tokens.color.wash : 'transparent', '&:hover': { bgcolor: tokens.color.wash } }}
              >
                <Box sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{report.label}</Box>
                <Box sx={{ fontSize: '0.75rem', color: tokens.color.faint, display: { xs: 'none', md: 'block' } }}>{report.hint}</Box>
              </Box>
            )
          })}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {current === 'burndown' && <BurndownReport sprints={sprints.data ?? []} />}
          {current === 'velocity' && <VelocityReport data={reports.data} range={bounds} onRange={setRange} />}
          {current === 'flow' && <FlowReport tasks={tasks.data ?? []} />}
          {current === 'capacity' && <CapacityReport sprints={sprints.data ?? []} range={bounds} onRange={setRange} />}
        </Box>
      </Box>
    </>
  )
}
