import AddRounded from '@mui/icons-material/AddRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import InputBase from '@mui/material/InputBase'
import { useState, type KeyboardEvent } from 'react'
import { messageOf } from '@/common/ErrorState/ErrorState'
import { tokens } from '@/theme/tokens'

interface NewItemInputProps {
  onCreate: (title: string) => Promise<void>
  onError: (message: string) => void
}

/**
 * Azure Boards' "New item": click, type a title, press Enter. The box stays open and focused so several items can be
 * added in a row; Escape (or leaving it empty) closes it. Nothing else is asked for here, details come later.
 */
export function NewItemInput({ onCreate, onError }: NewItemInputProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function commit() {
    const text = title.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      await onCreate(text)
      setTitle('')
    } catch (error) {
      onError(messageOf(error))
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void commit()
    } else if (event.key === 'Escape') {
      setEditing(false)
      setTitle('')
    }
  }

  if (!editing) {
    return (
      <ButtonBase
        onClick={() => setEditing(true)}
        sx={{ justifyContent: 'flex-start', gap: 1, minHeight: 40, px: 1, borderRadius: 2, color: 'text.primary', fontWeight: 600, fontSize: '0.875rem', '&:hover': { bgcolor: tokens.color.hover } }}
      >
        <AddRounded sx={{ color: tokens.color.tealText }} />
        New item
      </ButtonBase>
    )
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${tokens.color.primary}`, borderRadius: 2, px: 1.5, py: 1 }}>
      <InputBase
        autoFocus
        fullWidth
        placeholder="Enter a title, then press Enter"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (!title.trim()) setEditing(false)
        }}
        disabled={busy}
        inputProps={{ 'aria-label': 'Title of the new item', maxLength: 200 }}
        sx={{ fontSize: '0.875rem' }}
      />
    </Box>
  )
}
