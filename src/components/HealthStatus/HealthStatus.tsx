import { useEffect, useState } from 'react'
import { fetchHealth, HEALTH_URL } from '../../api/health'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: string }
  | { kind: 'error'; message: string }

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error.'

export function HealthStatus() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetchHealth(controller.signal)
      .then((health) => {
        if (!controller.signal.aborted) setState({ kind: 'ok', status: health.status })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ kind: 'error', message: toErrorMessage(error) })
        }
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <section aria-labelledby="health-heading">
      <h2 id="health-heading">API health</h2>
      <p>
        Checking <code>{HEALTH_URL}</code>
      </p>
      {state.kind === 'loading' && <p role="status">Checking…</p>}
      {state.kind === 'ok' && (
        <p role="status">
          TI API status: <strong>{state.status}</strong>
        </p>
      )}
      {state.kind === 'error' && (
        <p role="alert">Health check failed: {state.message}</p>
      )}
    </section>
  )
}
