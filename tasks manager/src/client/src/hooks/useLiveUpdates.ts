import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getSession } from '@/auth/session'

/** The server pings "changed" after any write; a burst of pings becomes one refetch of whatever is on screen. */
const DEBOUNCE_MS = 250

/** Keeps every open window in step: when anyone changes something, the queries on screen refetch. */
export function useLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void queryClient.invalidateQueries(), DEBOUNCE_MS)
    }

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/changes', { accessTokenFactory: () => getSession()?.token ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on('changed', refresh)
    // Anything that happened while the socket was down is picked up when it comes back.
    connection.onreconnected(refresh)
    connection.start().catch(() => {
      // The app works without live updates (every page still refetches on focus); stay quiet.
    })

    return () => {
      clearTimeout(timer)
      void connection.stop()
    }
  }, [queryClient])
}
