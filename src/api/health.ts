import { TI_API_URL } from '../config'

export type HealthResponse = {
  status: 'ok'
}

export const HEALTH_URL = `${TI_API_URL}/health`

export const HEALTH_TIMEOUT_MS = 5000

const isHealthResponse = (body: unknown): body is HealthResponse =>
  typeof body === 'object' && body !== null && (body as { status?: unknown }).status === 'ok'

export const fetchHealth = async (signal?: AbortSignal): Promise<HealthResponse> => {
  const timeout = AbortSignal.timeout(HEALTH_TIMEOUT_MS)
  let response: Response

  try {
    response = await fetch(HEALTH_URL, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (timeout.aborted) {
      throw new Error(`TI API did not respond within ${HEALTH_TIMEOUT_MS / 1000} seconds.`, {
        cause: error,
      })
    }
    throw new Error(`Could not reach the TI API (${error instanceof Error ? error.message : error}).`, {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new Error(`TI API responded with HTTP ${response.status}.`)
  }

  // A wrong URL often still answers 200 (e.g. an SPA fallback serving index.html), so
  // check the body rather than trusting the status code.
  const body: unknown = await response.json().catch(() => undefined)

  if (!isHealthResponse(body)) {
    throw new Error(`${HEALTH_URL} did not return a TI health response. Check VITE_TI_API_URL.`)
  }

  return body
}
