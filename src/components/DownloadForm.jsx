import { useState } from 'react'

export default function DownloadForm({ onStart, busy }) {
  const [url, setUrl] = useState('')
  const [chunkCount, setChunkCount] = useState(8)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!url.trim()) return
    await onStart(url.trim(), Number(chunkCount))
    setUrl('')
  }

  return (
    <form className="download-form" onSubmit={handleSubmit}>
      <div className="form-title-wrap">
        <h2>New Download</h2>
        <p>Paste a direct URL and stream it with parallel chunks.</p>
      </div>
      <div className="input-grid">
        <input
          type="url"
          placeholder="https://example.com/file.iso"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          max="32"
          value={chunkCount}
          onChange={(event) => setChunkCount(event.target.value)}
          title="Chunk count"
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Adding...' : 'Start'}
        </button>
      </div>
    </form>
  )
}
