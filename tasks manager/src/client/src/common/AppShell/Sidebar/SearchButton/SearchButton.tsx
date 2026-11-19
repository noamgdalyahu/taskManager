import SearchRounded from '@mui/icons-material/SearchRounded'
import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'
import { GlobalSearch } from '@/common/AppShell/Sidebar/SearchButton/GlobalSearch/GlobalSearch'
import { Kbd } from '@/common/Kbd/Kbd'
import { tokens } from '@/theme/tokens'

/** The id of the sprint board's own search box; "/" focuses it. */
export const BOARD_SEARCH_ID = 'board-search'

interface SearchButtonProps {
  projectId: string
  collapsed: boolean
  onNavigate?: () => void
}

/** "Search  Ctrl+K": opens the global search over the project's work items. */
export function SearchButton({ projectId, collapsed, onNavigate }: SearchButtonProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const button = (
    <ButtonBase
      onClick={() => setOpen(true)}
      aria-label="Search work items"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K"
      sx={{
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        height: 32,
        px: collapsed ? 0 : 1.25,
        boxSizing: 'border-box',
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius.control}px`,
        color: tokens.color.faint,
        fontSize: '0.8125rem',
        '&:hover': { borderColor: tokens.color.borderHover, bgcolor: tokens.color.wash },
        '& svg': { fontSize: 16 },
      }}
    >
      <SearchRounded aria-hidden />
      {!collapsed && (
        <>
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <Kbd>Ctrl+K</Kbd>
        </>
      )}
    </ButtonBase>
  )

  return (
    <>
      {collapsed ? (
        <Tooltip title="Search (Ctrl+K)" placement="right">
          {button}
        </Tooltip>
      ) : (
        button
      )}
      {open && (
        <GlobalSearch
          projectId={projectId}
          onClose={() => {
            setOpen(false)
            onNavigate?.()
          }}
        />
      )}
    </>
  )
}
