import type { Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import { tokens } from './tokens'

/**
 * A translucent "material" (apple-design, section 12): chrome that floats above content, with the content scrolling
 * underneath. The top edge is brighter, like light catching the glass. Never stack one material on another.
 *
 * Accessibility fallbacks are part of the material, not an afterthought:
 *  - prefers-reduced-transparency: solid surface, no blur
 *  - prefers-contrast: more: solid surface with a defined border
 */
export function material(opacity = 0.72): SystemStyleObject<Theme> {
  return {
    backgroundColor: `color-mix(in srgb, var(--sm-surface) ${Math.round(opacity * 100)}%, transparent)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: '1px solid color-mix(in srgb, var(--sm-surface) 60%, transparent)',
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: tokens.color.surface,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
    },
    '@media (prefers-contrast: more)': {
      backgroundColor: tokens.color.surface,
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      border: `1px solid ${tokens.color.text}`,
    },
  }
}
