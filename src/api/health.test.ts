import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth, HEALTH_URL } from './health'

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

// Behaves like fetch with respect to aborting: rejects with the signal's reason.
const abortableFetch = (response: Response) =>
  vi.fn((_url: string, init?: RequestInit) =>
    init?.signal?.aborted ? Promise.reject(init.signal.reason) : Promise.resolve(response),
  )

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Calls the /health endpoint of the configured TI API.', async () => {
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({ status: 'ok' })))
    vi.stubGlobal('fetch', fetchMock)

    await fetchHealth()

    expect(fetchMock).toHaveBeenCalledWith(HEALTH_URL, { signal: expect.any(AbortSignal) })
    expect(HEALTH_URL).toMatch(/\/health$/)
  })

  it('Returns the health payload when the API is healthy.', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ status: 'ok' }))))

    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' })
  })

  it('Throws a descriptive error when the API responds with a failure status.', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({ error: 'nope' }, 503))))

    await expect(fetchHealth()).rejects.toThrow('TI API responded with HTTP 503.')
  })

  it('Explains network failures.', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    await expect(fetchHealth()).rejects.toThrow('Could not reach the TI API (Failed to fetch).')
  })

  it('Explains network failures that are not Error instances.', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject('offline')))

    await expect(fetchHealth()).rejects.toThrow('Could not reach the TI API (offline).')
  })

  it('Rejects a successful response that is not JSON.', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<!doctype html>', { status: 200 }))),
    )

    await expect(fetchHealth()).rejects.toThrow(
      `${HEALTH_URL} did not return a TI health response. Check VITE_TI_API_URL.`,
    )
  })

  it('Rejects a successful JSON response that is not a health payload.', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({}))))
    await expect(fetchHealth()).rejects.toThrow('did not return a TI health response')

    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(null))))
    await expect(fetchHealth()).rejects.toThrow('did not return a TI health response')
  })

  it('Gives up with a clear message when the API does not respond in time.', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
      AbortSignal.abort(new DOMException('The operation timed out.', 'TimeoutError')),
    )
    vi.stubGlobal('fetch', abortableFetch(jsonResponse({ status: 'ok' })))

    await expect(fetchHealth(new AbortController().signal)).rejects.toThrow(
      'TI API did not respond within 5 seconds.',
    )
  })

  it('Stops the request when the caller aborts.', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', abortableFetch(jsonResponse({ status: 'ok' })))

    await expect(fetchHealth(controller.signal)).rejects.toThrow('Could not reach the TI API')
  })
})
