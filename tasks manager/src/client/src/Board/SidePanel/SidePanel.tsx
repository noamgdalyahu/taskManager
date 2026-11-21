import SearchRounded from '@mui/icons-material/SearchRounded'
import Box from '@mui/material/Box'
import InputBase from '@mui/material/InputBase'
import { useEffect, useRef, useState } from 'react'
import { TASK_TYPE_LABEL, type SprintDto, type TaskDto, type TaskType, type TeamMemberDto } from '@/api/types'
import { FilterChip } from '@/Board/SidePanel/FilterChip/FilterChip'
import { NextSprint } from '@/Board/SidePanel/NextSprint/NextSprint'
import { TeamCapacity } from '@/Board/SidePanel/TeamCapacity/TeamCapacity'
import { TypesSection } from '@/Board/SidePanel/TypesSection/TypesSection'
import { UNASSIGNED, type BoardFilter } from '@/Board/useBoardFilter'
import { Kbd } from '@/common/Kbd/Kbd'
import { tokens } from '@/theme/tokens'

/** The id of the sprint board's search box; "/" focuses it. */
const BOARD_SEARCH_ID = 'board-search'

interface SidePanelProps {
  projectId: string
  projectName: string
  sprint: SprintDto
  sprints: SprintDto[]
  allTasks: TaskDto[]
  members: TeamMemberDto[]
  filter: BoardFilter
  onFilter: (filter: BoardFilter) => void
  onTogglePerson: (memberId: string) => void
  onToggleType: (type: TaskType) => void
}

/** The right-hand column: where you are, search, the active filters, who has what, the next sprint, and the types in use. */
export function SidePanel({ projectId, projectName, sprint, sprints, allTasks, members, filter, onFilter, onTogglePerson, onToggleType }: SidePanelProps) {
  // "/" jumps to the search box, as long as you are not already typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      event.preventDefault()
      document.getElementById(BOARD_SEARCH_ID)?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // The keyword lives in the URL, which updates a beat after each keystroke. The box keeps its own text so typing is never
  // overwritten by a stale URL, and the filter follows 200 ms after the last keystroke.
  const [text, setText] = useState(filter.keyword)
  const pending = useRef<number | null>(null)
  const latest = useRef({ filter, onFilter })
  latest.current = { filter, onFilter }
  useEffect(() => {
    // The keyword changed from elsewhere (for example the chip was removed): show it, unless we are mid-typing.
    if (pending.current === null) setText(filter.keyword)
  }, [filter.keyword])
  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current)
    },
    [],
  )
  const onText = (value: string) => {
    setText(value)
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = window.setTimeout(() => {
      pending.current = null
      latest.current.onFilter({ ...latest.current.filter, keyword: value })
    }, 200)
  }

  const personName = (id: string) => (id === UNASSIGNED ? 'Unassigned' : (members.find((member) => member.id === id)?.name ?? 'Unknown'))

  return (
    <Box
      component="aside"
      aria-label="Sprint details"
      sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface, p: 1.5, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, alignSelf: 'start' }}
    >
      <Box sx={{ fontSize: '0.8125rem', color: tokens.color.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {projectName} <span aria-hidden>/</span>{' '}
        <Box component="span" dir="auto" sx={{ color: tokens.color.text, fontWeight: 500 }}>
          {sprint.name}
        </Box>
      </Box>

      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, height: 34, boxSizing: 'border-box', border: `1px solid ${tokens.color.borderStrong}`, borderRadius: `${tokens.radius.control}px`, color: tokens.color.faint, '&:focus-within': { outline: `2px solid ${tokens.color.focus}`, outlineOffset: 1 } }}
      >
        <SearchRounded aria-hidden sx={{ fontSize: 16 }} />
        <InputBase
          id={BOARD_SEARCH_ID}
          type="search"
          value={text}
          onChange={(event) => onText(event.target.value)}
          placeholder="Search by name, type or task"
          inputProps={{ 'aria-label': 'Search by name, type or task', 'aria-keyshortcuts': '/' }}
          sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', color: tokens.color.text, '& input': { p: 0 }, '& input:focus-visible': { outline: 'none' } }}
        />
        <Kbd>/</Kbd>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
        <Box component="span" sx={{ fontSize: '0.75rem', color: tokens.color.faint }}>
          Filters:
        </Box>
        {filter.assignees.map((id) => (
          <FilterChip key={id} kind="person" value={personName(id)} onRemove={() => onFilter({ ...filter, assignees: filter.assignees.filter((other) => other !== id) })} />
        ))}
        {filter.types.map((type) => (
          <FilterChip key={type} kind="type" value={TASK_TYPE_LABEL[type]} onRemove={() => onFilter({ ...filter, types: filter.types.filter((other) => other !== type) })} />
        ))}
        {filter.keyword && <FilterChip kind="text" value={filter.keyword} onRemove={() => onFilter({ ...filter, keyword: '' })} />}
        <FilterChip kind="sprint" value={sprint.status.toLowerCase()} />
      </Box>

      <TeamCapacity sprint={sprint} allTasks={allTasks} members={members} selected={filter.assignees} onTogglePerson={onTogglePerson} />
      <NextSprint projectId={projectId} current={sprint} sprints={sprints} />
      <TypesSection allTasks={allTasks} selected={filter.types} onToggleType={onToggleType} />
    </Box>
  )
}
