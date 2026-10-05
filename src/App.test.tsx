import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('./components/HealthStatus', () => ({
  HealthStatus: () => <div data-testid="health-status" />,
}))

describe('App', () => {
  it('Shows the application title and the API health check.', () => {
    const { getByRole, getByTestId } = render(<App />)

    expect(getByRole('heading', { level: 1 })).toHaveTextContent('TI')
    expect(getByTestId('health-status')).toBeInTheDocument()
  })
})
