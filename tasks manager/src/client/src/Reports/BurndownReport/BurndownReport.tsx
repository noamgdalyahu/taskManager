import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useDashboard } from '@/api/insight'
import type { SprintDto } from '@/api/types'
import { BurndownChart } from '@/common/BurndownChart/BurndownChart'
import { ErrorState } from '@/common/ErrorState/ErrorState'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { downloadCsv } from '@/lib/csv'
import { ReportToolbar } from '@/Reports/ReportToolbar/ReportToolbar'

/** Remaining hours per day for one sprint, against the ideal line. */
export function BurndownReport({ sprints }: { sprints: SprintDto[] }) {
  const [sprintId, setSprintId] = useState(() => (sprints.find((sprint) => sprint.status === 'Active') ?? sprints[sprints.length - 1])?.id ?? '')
  const dashboard = useDashboard(sprintId || undefined)
  const sprint = sprints.find((candidate) => candidate.id === sprintId)
  const data = dashboard.data

  const exportCsv = () => {
    if (!data) return
    const dates = [...new Set([...data.ideal, ...data.actual, ...data.forecast].map((point) => point.date))].sort()
    const at = (series: typeof data.ideal, date: string) => series.find((point) => point.date === date)?.remainingHours ?? ''
    downloadCsv(`burndown-${sprint?.name ?? 'sprint'}.csv`, ['Date', 'Ideal', 'Actual', 'Forecast'], dates.map((date) => [date, at(data.ideal, date), at(data.actual, date), at(data.forecast, date)]))
  }

  return (
    <>
      <ReportToolbar title="Burndown" description="Hours still to do on each day of one sprint. The closer the actual line stays to the ideal one, the more the sprint is on track." onExport={exportCsv} canExport={!!data}>
        <TextField select size="small" label="Sprint" value={sprintId} onChange={(event) => setSprintId(event.target.value)} sx={{ minWidth: 160, '& .MuiInputBase-root': { minHeight: 32, fontSize: '0.8125rem' } }}>
          {sprints.map((candidate) => (
            <MenuItem key={candidate.id} value={candidate.id}>
              {candidate.name}
            </MenuItem>
          ))}
        </TextField>
      </ReportToolbar>
      {dashboard.isLoading && <PageLoading />}
      {dashboard.error && <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />}
      {data && <BurndownChart title={`${data.sprintName} burndown`} ideal={data.ideal} actual={data.actual} forecast={data.forecast} />}
    </>
  )
}
