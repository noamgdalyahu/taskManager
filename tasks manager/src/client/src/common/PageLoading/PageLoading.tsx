import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import { SkeletonBlock } from '@/common/PageLoading/SkeletonBlock/SkeletonBlock'
import { tokens } from '@/theme/tokens'

/** Which screen's shape the placeholder takes, so the page does not jump when the real content arrives. */
export type LoadingShape = 'page' | 'board' | 'list' | 'detail' | 'cards' | 'panel'

const bordered = { border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, bgcolor: tokens.color.surface, boxSizing: 'border-box' } as const

function header() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, minHeight: 64 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <SkeletonBlock width={72} height={10} />
        <SkeletonBlock width={220} height={24} radius={4} />
        <SkeletonBlock width={320} height={12} />
      </Box>
      <SkeletonBlock width={104} height={32} radius={4} />
    </Box>
  )
}

function stats(count = 4) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${count}, minmax(0, 1fr))` } }}>
      {Array.from({ length: count }, (_, index) => (
        <Box key={index} sx={{ ...bordered, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 112 }}>
          <SkeletonBlock width={88} height={10} />
          <SkeletonBlock width={72} height={28} radius={4} />
          <SkeletonBlock width={120} height={10} />
        </Box>
      ))}
    </Box>
  )
}

function panel(rows = 4, minHeight = 0) {
  return (
    <Box sx={{ ...bordered, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, minHeight }}>
      <SkeletonBlock width={160} height={14} />
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <SkeletonBlock width={`${90 - index * 9}%`} height={12} />
          <SkeletonBlock width={`${55 - index * 5}%`} height={10} />
        </Box>
      ))}
    </Box>
  )
}

function twoColumns(left: ReactNode, right: ReactNode) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' }, alignItems: 'start' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>{left}</Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>{right}</Box>
    </Box>
  )
}

function layout(shape: LoadingShape, withHeader: boolean): ReactNode {
  switch (shape) {
    case 'board':
      return (
        <>
          {withHeader && header()}
          {withHeader && <SkeletonBlock width={96} height={28} radius={4} />}
          {stats()}
          {twoColumns(
            <Box sx={{ ...bordered, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <SkeletonBlock height={36} radius={4} />
              {[0, 1, 2].map((lane) => (
                <Box key={lane} sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <SkeletonBlock width={180} height={14} />
                  <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                    {[0, 1, 2, 3].map((column) => (
                      <SkeletonBlock key={column} height={column % 2 === 0 ? 88 : 56} radius={5} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>,
            panel(5, 360),
          )}
        </>
      )
    case 'list':
      return (
        <>
          {withHeader && header()}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <SkeletonBlock width={220} height={32} radius={4} />
            {[0, 1, 2, 3].map((chip) => (
              <SkeletonBlock key={chip} width={120} height={32} radius={4} />
            ))}
          </Box>
          <Box sx={{ ...bordered, overflow: 'hidden' }}>
            {Array.from({ length: 10 }, (_, row) => (
              <Box key={row} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, height: 44, borderTop: row === 0 ? 0 : `1px solid ${tokens.color.border}` }}>
                <SkeletonBlock width={44} height={10} />
                <SkeletonBlock width={`${38 - (row % 4) * 4}%`} height={12} />
                <Box sx={{ flex: 1 }} />
                <SkeletonBlock width={64} height={18} radius={3} />
                <SkeletonBlock width={56} height={18} radius={3} />
              </Box>
            ))}
          </Box>
        </>
      )
    case 'detail':
      return (
        <>
          {withHeader && header()}
          {twoColumns(
            <>
              {panel(3)}
              {panel(2)}
            </>,
            <>
              {panel(4)}
              {panel(2)}
            </>,
          )}
        </>
      )
    case 'cards':
      return (
        <>
          {withHeader && header()}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[0, 1, 2].map((card) => (
              <Box key={card} sx={{ ...bordered, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 148 }}>
                <SkeletonBlock width={160} height={16} radius={4} />
                <SkeletonBlock height={10} />
                <SkeletonBlock width="70%" height={10} />
                <Box sx={{ flex: 1 }} />
                <SkeletonBlock width={140} height={10} />
              </Box>
            ))}
          </Box>
        </>
      )
    case 'panel':
      return panel(4)
    default:
      return (
        <>
          {withHeader && header()}
          {stats()}
          {twoColumns(panel(4, 220), panel(3, 220))}
        </>
      )
  }
}

/**
 * The placeholder shown while a page's data arrives: grey shapes laid out like the real page, instead of a spinner.
 * `panel` is for one section that loads inside a page that is already on screen; `header={false}` does the same for a
 * whole body, when the page's own title and buttons are already shown.
 */
export function PageLoading({ shape = 'page', header: withHeader = true }: { shape?: LoadingShape; header?: boolean }) {
  return (
    <Box role="status" aria-busy="true" aria-label="Loading" sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {layout(shape, withHeader)}
    </Box>
  )
}
