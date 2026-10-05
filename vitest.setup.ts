import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.reject(
        new Error(
          'global.fetch was not mocked in this test. Stub it in a beforeEach, or mock the api module instead.',
        ),
      ),
    ),
  )
})
