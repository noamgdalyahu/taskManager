import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getSession } from '@/auth/session'

/** Pings closer together than this are one refetch: the first goes out at once, the rest collapse into one trailing refetch. */
const MIN_GAP_MS = 400
/** While the live channel is down, the screen refetches on this interval so it still catches up. */
const FALLBACK_POLL_MS = 10_000

/** Keeps every open window in step: when anyone changes something, the queries on screen refetch. */
export function useLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let lastRefresh = 0
    let trailing: ReturnType<typeof setTimeout> | undefined

    const refresh = () => {
      const wait = lastRefresh + MIN_GAP_MS - Date.now()
      if (wait <= 0) {
        // No timer on the first ping: browsers slow timers down in background windows, and this is the one that matters.
        lastRefresh = Date.now()
        void queryClient.invalidateQueries()
      } else if (trailing === undefined) {
        trailing = setTimeout(() => {
          trailing = undefined
          lastRefresh = Date.now()
          void queryClient.invalidateQueries()
        }, wait)
      }
    }

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/changes', { accessTokenFactory: () => getSession()?.token ?? '' })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('changed', refresh)
    // Anything that happened while the channel was down is picked up when it comes back.
    connection.onreconnected(refresh)

    let stopped = false
    connection.start().catch((error: unknown) => {
      if (!stopped) console.warn('Live updates are unavailable; falling back to polling.', error)
    })

    // Safety net: if the channel is not connected (blocked WebSocket, server restart, proxy without upgrade), poll.
    const fallback = setInterval(() => {
      if (connection.state !== HubConnectionState.Connected) void queryClient.invalidateQueries()
    }, FALLBACK_POLL_MS)

    return () => {
      stopped = true
      clearTimeout(trailing)
      clearInterval(fallback)
      void connection.stop()
    }
  }, [queryClient])
}
