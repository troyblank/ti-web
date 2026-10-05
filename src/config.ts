const DEFAULT_TI_API_URL = 'http://localhost:3000'

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '')

// The localhost default only applies in development. A production bundle without a
// configured URL would silently point every user's browser at their own machine.
export const getTiApiUrl = (env: ImportMetaEnv = import.meta.env): string => {
  const configured = env.VITE_TI_API_URL?.trim()

  if (configured) return stripTrailingSlash(configured)
  if (env.DEV) return DEFAULT_TI_API_URL

  throw new Error('VITE_TI_API_URL must be set for production builds.')
}

export const TI_API_URL = getTiApiUrl()
