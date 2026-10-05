import { act, render } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth } from '../../api/health'
import { HealthStatus, toErrorMessage } from './HealthStatus'

vi.mock('../../api/health', () => ({
  HEALTH_URL: 'http://ti.test/health',
  fetchHealth: vi.fn(),
}))

const mockFetchHealth = vi.mocked(fetchHealth)

// A promise whose settlement the test controls.
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('HealthStatus', () => {
  beforeEach(() => {
    mockFetchHealth.mockReset()
  })

  it('Shows which API URL is being checked.', () => {
    mockFetchHealth.mockReturnValue(deferred<{ status: 'ok' }>().promise)

    const { getByText } = render(<HealthStatus />)

    expect(getByText('http://ti.test/health')).toBeInTheDocument()
  })

  it('Tells the user it is checking while the request is in flight.', () => {
    mockFetchHealth.mockReturnValue(deferred<{ status: 'ok' }>().promise)

    const { getByRole } = render(<HealthStatus />)

    expect(getByRole('status')).toHaveTextContent('Checking…')
  })

  it('Displays the status returned by the API once the check succeeds.', async () => {
    mockFetchHealth.mockResolvedValue({ status: 'ok' })

    const { findByText, queryByText } = render(<HealthStatus />)

    expect(await findByText('TI API status:', { exact: false })).toHaveTextContent(
      'TI API status: ok',
    )
    expect(queryByText('Checking…')).not.toBeInTheDocument()
  })

  it('Shows an error message when the health check fails.', async () => {
    mockFetchHealth.mockRejectedValue(new Error('Could not reach the TI API (Failed to fetch).'))

    const { findByRole } = render(<HealthStatus />)

    expect(await findByRole('alert')).toHaveTextContent(
      'Health check failed: Could not reach the TI API (Failed to fetch).',
    )
  })

  it('Aborts the in-flight check when unmounted.', () => {
    mockFetchHealth.mockReturnValue(deferred<{ status: 'ok' }>().promise)

    const { unmount } = render(<HealthStatus />)
    const signal = mockFetchHealth.mock.calls[0][0]

    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
  })

  // StrictMode mounts, cleans up and re-runs the effect, so two checks are in flight.
  // The first belongs to the cleaned-up effect; its late result must not replace the
  // current one.
  it('Ignores a late success from a check that has been cleaned up.', async () => {
    const stale = deferred<{ status: 'ok' }>()
    mockFetchHealth
      .mockReturnValueOnce(stale.promise)
      .mockRejectedValueOnce(new Error('Failed to fetch'))

    const { findByRole, queryByRole } = render(
      <StrictMode>
        <HealthStatus />
      </StrictMode>,
    )

    expect(await findByRole('alert')).toHaveTextContent('Failed to fetch')

    await act(async () => {
      stale.resolve({ status: 'ok' })
      await stale.promise
    })

    expect(queryByRole('alert')).toHaveTextContent('Failed to fetch')
    expect(queryByRole('status')).not.toBeInTheDocument()
  })

  it('Ignores a late failure from a check that has been cleaned up.', async () => {
    const stale = deferred<{ status: 'ok' }>()
    mockFetchHealth.mockReturnValueOnce(stale.promise).mockResolvedValueOnce({ status: 'ok' })

    const { findByText, queryByRole } = render(
      <StrictMode>
        <HealthStatus />
      </StrictMode>,
    )

    expect(await findByText('TI API status:', { exact: false })).toHaveTextContent(
      'TI API status: ok',
    )

    await act(async () => {
      stale.reject(new Error('too late'))
      await stale.promise.catch(() => undefined)
    })

    expect(queryByRole('status')).toHaveTextContent('TI API status: ok')
    expect(queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('toErrorMessage', () => {
  it('Uses the message from an Error instance.', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('Falls back to a generic message for non-Error values.', () => {
    expect(toErrorMessage('boom')).toBe('Unknown error.')
  })
})
