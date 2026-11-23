import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { motion } from 'motion/react'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileTopBar } from '@/common/AppShell/MobileTopBar/MobileTopBar'
import { Sidebar } from '@/common/AppShell/Sidebar/Sidebar'
import { useNavState } from '@/common/AppShell/Sidebar/navStore'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { springs } from '@/theme/motion'
import { tokens } from '@/theme/tokens'

/** The frame around every signed-in screen: a collapsible sidebar on a desktop, a top bar and a drawer below 900px. */
export function AppShell() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const { collapsed } = useNavState()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Box sx={{ minHeight: '100dvh', display: { md: 'flex' }, bgcolor: tokens.color.canvas }}>
      {isDesktop ? (
        // The column's width is a spring, not a timed transition: toggling twice quickly reverses smoothly from wherever it
        // is. MotionConfig at the root turns the movement off for reduced-motion users.
        <motion.div
          initial={false}
          animate={{ width: collapsed ? tokens.layout.sidebarCollapsedWidth : tokens.layout.sidebarWidth }}
          transition={springs.settle}
          style={{ flex: '0 0 auto', position: 'sticky', top: 0, height: '100dvh', alignSelf: 'flex-start', overflow: 'hidden' }}
        >
          <Sidebar />
        </motion.div>
      ) : (
        <>
          <MobileTopBar onMenu={() => setMenuOpen(true)} />
          <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: tokens.layout.sidebarWidth + 24, maxWidth: '86vw', backgroundImage: 'none' } } }}>
            <Sidebar collapsible={false} onNavigate={() => setMenuOpen(false)} />
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, px: 2, pt: 2, pb: 6 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Pages load on demand; the sidebar stays put while a page's code arrives. */}
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  )
}
