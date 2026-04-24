import { useState } from 'react'
import { api } from '../api'

function ResultList({ title, links }) {
  return (
    <div className="extract-results-block">
      <h3>{title} ({links.length})</h3>
      {links.length === 0 && <p className="muted">No links found.</p>}
      {links.length > 0 && (
        <ul className="extract-list">
          {links.map((link) => (
            <li key={link}>
              <a href={link} target="_blank" rel="noreferrer" title={link}>{link}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MediaExtractor() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoLinks, setVideoLinks] = useState([])
  const [imageLinks, setImageLinks] = useState([])

  async function handleExtract(event) {
    event.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    try {
      const data = await api.extractMedia(url.trim())
      setVideoLinks(data.video_links || [])
      setImageLinks(data.image_links || [])
    } catch (err) {
      setError(err.message)
      setVideoLinks([])
      setImageLinks([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="extract-panel">
      <div className="form-title-wrap">
        <h2>Media Link Extractor Pro</h2>
        <p>Paste any webpage URL to extract direct video and image links.</p>
      </div>

      <form className="extract-form" onSubmit={handleExtract}>
        <input
          type="url"
          placeholder="https://example.com/article-with-media"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Extracting...' : 'Extract'}</button>
      </form>

      {error && <p className="banner-error">{error}</p>}

      <div className="extract-results-grid">
        <ResultList title="Video Links" links={videoLinks} />
        <ResultList title="Image Links" links={imageLinks} />
      </div>
    </section>
  )
}
