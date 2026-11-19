import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import { HairlineButton } from '@/common/HairlineButton/HairlineButton'
import { setAppearance, useAppearance } from '@/theme/appearance'

/** Switches between the dark and the light theme. Shows a sun in dark mode and a moon in light mode, and says what it will switch to. */
export function ThemeToggle() {
  const appearance = useAppearance()
  const next = appearance === 'dark' ? 'light' : 'dark'
  return (
    <HairlineButton onClick={() => setAppearance(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} sx={{ width: 32, px: 0 }}>
      {appearance === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
    </HairlineButton>
  )
}
