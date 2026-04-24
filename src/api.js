const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const WS_BASE = import.meta.env.VITE_WS_BASE || API_BASE.replace(/^http/, 'ws')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE}. Check deployment/CORS/network.`)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body.detail || body.message || `HTTP ${response.status}`
    throw new Error(`API error (${response.status}): ${message}`)
  }

  return response.json()
}

export const api = {
  baseUrl: API_BASE,
  wsUrl: `${WS_BASE}/ws/progress`,
  listDownloads: () => request('/downloads'),
  startDownload: (url, chunkCount) =>
    request('/download/start', {
      method: 'POST',
      body: JSON.stringify({ url, chunk_count: chunkCount }),
    }),
  pauseDownload: (id) => request(`/download/pause/${id}`, { method: 'POST' }),
  resumeDownload: (id) => request(`/download/resume/${id}`, { method: 'POST' }),
  cancelDownload: (id) => request(`/download/cancel/${id}`, { method: 'POST' }),
}

export function humanBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

export function humanSpeed(bytesPerSec) {
  return `${humanBytes(Math.max(bytesPerSec, 0))}/s`
}
