import SearchRounded from '@mui/icons-material/SearchRounded'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import InputBase from '@mui/material/InputBase'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectTasks } from '@/api/tasks'
import { STATUS_LABEL, TASK_TYPE_LABEL } from '@/api/types'
import { Kbd } from '@/common/Kbd/Kbd'
import { tokens } from '@/theme/tokens'

interface GlobalSearchProps {
  projectId: string
  onClose: () => void
}

const MAX_RESULTS = 8

/** Search over every work item of the project: by title, short id, type or state. Arrow keys move, Enter opens, Esc closes. */
export function GlobalSearch({ projectId, onClose }: GlobalSearchProps) {
  const navigate = useNavigate()
  const tasks = useProjectTasks(projectId)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const all = tasks.data ?? []
    const found = needle
      ? all.filter((task) => `${task.title} ${task.id.slice(0, 4)} ${task.type ? TASK_TYPE_LABEL[task.type] : ''} ${STATUS_LABEL[task.status]}`.toLowerCase().includes(needle))
      : all
    return found.slice(0, MAX_RESULTS)
  }, [tasks.data, query])

  const open = (index: number) => {
    const task = results[index]
    if (!task) return
    onClose()
    navigate(`/p/${projectId}/tasks/${task.id}`)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((value) => Math.min(results.length - 1, value + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => Math.max(0, value - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      open(active)
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { alignSelf: 'flex-start', mt: '12vh', borderRadius: `${tokens.radius.card}px` } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, height: 48, borderBottom: `1px solid ${tokens.color.border}`, color: tokens.color.faint }}>
        <SearchRounded aria-hidden sx={{ fontSize: 18 }} />
        <InputBase
          autoFocus
          fullWidth
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search work items"
          inputProps={{ 'aria-label': 'Search work items', 'aria-controls': 'global-search-results', 'aria-activedescendant': results[active] ? `search-result-${results[active].id}` : undefined }}
          sx={{ color: tokens.color.text, fontSize: '0.875rem' }}
        />
        <Kbd>Esc</Kbd>
      </Box>
      <Box id="global-search-results" role="listbox" aria-label="Work items" sx={{ maxHeight: 360, overflowY: 'auto', p: 0.5 }}>
        {tasks.isLoading && <Box sx={{ p: 2, color: tokens.color.faint, fontSize: '0.8125rem' }}>Loading work items…</Box>}
        {!tasks.isLoading && results.length === 0 && <Box sx={{ p: 2, color: tokens.color.faint, fontSize: '0.8125rem' }}>No work items match “{query}”.</Box>}
        {results.map((task, index) => (
          <Box
            key={task.id}
            id={`search-result-${task.id}`}
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => setActive(index)}
            onClick={() => open(index)}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, borderRadius: `${tokens.radius.control}px`, cursor: 'pointer', bgcolor: index === active ? tokens.color.wash : 'transparent' }}
          >
            <Box component="span" sx={{ flex: '0 0 auto', fontFamily: tokens.font.mono, fontSize: '0.6875rem', color: tokens.color.faint }}>
              #{task.id.slice(0, 4).toUpperCase()}
            </Box>
            <Box component="span" dir="ltr" sx={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </Box>
            <Box component="span" sx={{ flex: '0 0 auto', fontSize: '0.75rem', color: tokens.color.faint }}>
              {STATUS_LABEL[task.status]}
            </Box>
          </Box>
        ))}
      </Box>
    </Dialog>
  )
}
