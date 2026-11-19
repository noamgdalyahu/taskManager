import ButtonBase, { type ButtonBaseProps } from '@mui/material/ButtonBase'
import type { ElementType } from 'react'
import { tokens } from '@/theme/tokens'

interface HairlineButtonProps extends ButtonBaseProps {
  /** Render as another element, for example a router Link (then pass its props such as `to`). */
  component?: ElementType
  to?: string
  /** The one filled button of a screen: text colour on the background colour, no border. */
  primary?: boolean
}

/** A 32px button with a 1px hairline border and a 4px radius. Icon children are 16px. */
export function HairlineButton({ primary = false, sx, ...rest }: HairlineButtonProps) {
  return (
    <ButtonBase
      {...rest}
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          height: 32,
          px: 1.25,
          boxSizing: 'border-box',
          borderRadius: `${tokens.radius.control}px`,
          border: `1px solid ${primary ? tokens.color.btn : tokens.color.borderStrong}`,
          bgcolor: primary ? tokens.color.btn : 'transparent',
          color: primary ? tokens.color.btnText : tokens.color.text,
          fontSize: '0.8125rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          '& svg': { fontSize: 16 },
          '&:hover': primary ? { opacity: 0.88 } : { bgcolor: tokens.color.wash, borderColor: tokens.color.borderHover },
          '&:disabled': { opacity: 0.5 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  )
}
