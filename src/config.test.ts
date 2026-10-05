import { describe, expect, it } from 'vitest'
import { getTiApiUrl, TI_API_URL } from './config'

const env = (VITE_TI_API_URL?: string, DEV = true) => ({ VITE_TI_API_URL, DEV }) as ImportMetaEnv

describe('TI API URL configuration', () => {
  it('Uses the local development API when nothing is configured in development.', () => {
    expect(getTiApiUrl(env())).toBe('http://localhost:3000')
    expect(getTiApiUrl(env('   '))).toBe('http://localhost:3000')
  })

  it('Refuses to fall back to localhost outside of development.', () => {
    expect(() => getTiApiUrl(env(undefined, false))).toThrow(
      'VITE_TI_API_URL must be set for production builds.',
    )
    expect(() => getTiApiUrl(env('   ', false))).toThrow()
  })

  it('Uses the configured API URL.', () => {
    expect(getTiApiUrl(env('https://ti.example.com'))).toBe('https://ti.example.com')
    expect(getTiApiUrl(env('https://ti.example.com', false))).toBe('https://ti.example.com')
  })

  it('Removes trailing slashes so paths can be appended safely.', () => {
    expect(getTiApiUrl(env('https://ti.example.com///'))).toBe('https://ti.example.com')
  })

  it('Reads from import.meta.env by default.', () => {
    expect(TI_API_URL).toBe(getTiApiUrl(import.meta.env))
  })
})
