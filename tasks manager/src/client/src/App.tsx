import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '@/api/http'
import { AuthProvider } from '@/auth/AuthProvider/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth/RequireAuth'
import { AppShell } from '@/common/AppShell/AppShell'
import { PageLoading } from '@/common/PageLoading/PageLoading'
import { HomeRedirect } from '@/routes/HomeRedirect/HomeRedirect'
import { NotFound } from '@/routes/NotFound/NotFound'
import { useAppearance } from '@/theme/appearance'
import { darkTheme, lightTheme } from '@/theme/theme'

// Every screen is its own chunk: signing in does not download the dashboard, and the dashboard does not drag in the board.
const Login = lazy(() => import('@/Login/Login').then((m) => ({ default: m.Login })))
const Projects = lazy(() => import('@/Projects/Projects').then((m) => ({ default: m.Projects })))
const Board = lazy(() => import('@/Board/Board').then((m) => ({ default: m.Board })))
const Dashboard = lazy(() => import('@/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const MyTasks = lazy(() => import('@/MyTasks/MyTasks').then((m) => ({ default: m.MyTasks })))
const ProjectOverview = lazy(() => import('@/ProjectOverview/ProjectOverview').then((m) => ({ default: m.ProjectOverview })))
const TaskDetail = lazy(() => import('@/TaskDetail/TaskDetail').then((m) => ({ default: m.TaskDetail })))
const Team = lazy(() => import('@/Team/Team').then((m) => ({ default: m.Team })))
const Reports = lazy(() => import('@/Reports/Reports').then((m) => ({ default: m.Reports })))
const Profile = lazy(() => import('@/Profile/Profile').then((m) => ({ default: m.Profile })))
const SprintPlanning = lazy(() => import('@/SprintPlanning/SprintPlanning').then((m) => ({ default: m.SprintPlanning })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      // Retrying a 403 or 404 never helps; only retry when the server or network might recover.
      retry: (count, error) => count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

export function App() {
  const appearance = useAppearance()
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appearance === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        {/* reducedMotion="user": people who ask their OS for less motion get cross-fades instead of travelling transforms. */}
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    element={
                      <RequireAuth>
                        <AppShell />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<HomeRedirect />} />
                    <Route path="projects" element={<Projects />} />
                    {/* Every member of a project sees every screen; only the editing controls on them are for managers. */}
                    <Route path="p/:projectId" element={<ProjectOverview />} />
                    <Route path="p/:projectId/planning/:sprintId?" element={<SprintPlanning />} />
                    <Route path="p/:projectId/dashboard/:sprintId?" element={<Dashboard />} />
                    <Route path="p/:projectId/team" element={<Team />} />
                    <Route path="p/:projectId/reports" element={<Reports />} />
                    <Route path="p/:projectId/board/:sprintId?" element={<Board />} />
                    <Route path="p/:projectId/tasks/:taskId" element={<TaskDetail />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="me/tasks" element={<MyTasks />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </MotionConfig>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
