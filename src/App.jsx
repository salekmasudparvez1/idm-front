import { useEffect, useMemo, useState } from 'react'
import DownloadForm from './components/DownloadForm'
import DownloadList from './components/DownloadList'
import { api } from './api'

function upsertDownload(list, item) {
  const idx = list.findIndex((d) => d.id === item.id)
  if (idx === -1) return [item, ...list]
  const next = [...list]
  next[idx] = { ...next[idx], ...item }
  return next
}

export default function App() {
  const [downloads, setDownloads] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const stats = useMemo(() => {
    const active = downloads.filter((d) => d.status === 'downloading').length
    const queued = downloads.filter((d) => d.status === 'queued').length
    const complete = downloads.filter((d) => d.status === 'completed').length
    return { active, queued, complete, total: downloads.length }
  }, [downloads])

  async function refreshDownloads() {
    try {
      const data = await api.listDownloads()
      setDownloads(data.downloads || [])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refreshDownloads()

    let pollingTimer
    let ws
    let wsOpened = false

    const startPolling = () => {
      if (pollingTimer) return
      pollingTimer = setInterval(() => {
        refreshDownloads()
      }, 2500)
      setNotice('Live socket unavailable. Using auto-refresh mode.')
    }

    try {
      ws = new WebSocket(api.wsUrl)

      ws.onopen = () => {
        wsOpened = true
        setNotice('')
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.event === 'progress' && payload.data) {
            setDownloads((prev) => upsertDownload(prev, payload.data))
          }
        } catch {
          // Ignore malformed websocket messages.
        }
      }

      ws.onerror = () => {
        if (!wsOpened) {
          startPolling()
        }
      }

      ws.onclose = () => {
        startPolling()
      }
    } catch {
      startPolling()
    }

    const ping = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 20000)

    return () => {
      clearInterval(ping)
      if (pollingTimer) {
        clearInterval(pollingTimer)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  async function handleStart(url, chunkCount) {
    setError('')
    setIsAdding(true)
    try {
      const created = await api.startDownload(url, chunkCount)
      setDownloads((prev) => upsertDownload(prev, created))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  async function onPause(id) {
    await api.pauseDownload(id)
    await refreshDownloads()
  }

  async function onResume(id) {
    await api.resumeDownload(id)
    await refreshDownloads()
  }

  async function onCancel(id) {
    await api.cancelDownload(id)
    await refreshDownloads()
  }

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Internet Download Manager Style</p>
          <h1>Turbo Downloader Console</h1>
          <p className="subtitle">Parallel chunks, queue orchestration, and live transfer telemetry.</p>
        </div>

        <div className="stats-grid">
          <div>
            <strong>{stats.total}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{stats.active}</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>{stats.queued}</strong>
            <span>Queued</span>
          </div>
          <div>
            <strong>{stats.complete}</strong>
            <span>Done</span>
          </div>
        </div>
      </header>

      <DownloadForm onStart={handleStart} busy={isAdding} />
      {notice && <p className="banner-info">{notice}</p>}
      {error && <p className="banner-error">{error}</p>}
      <DownloadList
        downloads={downloads}
        onPause={onPause}
        onResume={onResume}
        onCancel={onCancel}
      />
    </main>
  )
}
