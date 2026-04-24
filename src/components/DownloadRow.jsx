import { api, humanBytes, humanSpeed } from '../api'

function actionLabel(status) {
  if (status === 'downloading' || status === 'queued') return 'Pause'
  if (status === 'paused') return 'Resume'
  return null
}

export default function DownloadRow({ item, onPause, onResume, onCancel, onRemove }) {
  const pct = Number(item.progress_pct || 0).toFixed(2)
  const action = actionLabel(item.status)
  const canSave = item.status === 'completed'
  const canRemove = ['completed', 'cancelled', 'error'].includes(item.status)

  async function handleAction() {
    if (action === 'Pause') await onPause(item.id)
    if (action === 'Resume') await onResume(item.id)
  }

  return (
    <article className="download-row">
      <div className="row-head">
        <div>
          <h3 title={item.filename}>{item.filename}</h3>
          <p className="muted" title={item.url}>{item.url}</p>
        </div>
        <span className={`status ${item.status}`}>{item.status}</span>
      </div>

      <div className="meta-grid">
        <span>{humanBytes(item.downloaded_bytes)} / {humanBytes(item.total_size)}</span>
        <span>{humanSpeed(item.speed_bps)}</span>
        <span>{pct}%</span>
      </div>

      <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="row-actions">
        {canSave && (
          <button onClick={() => window.open(api.fileUrl(item.id), '_blank')}>
            Save
          </button>
        )}
        {action && <button onClick={handleAction}>{action}</button>}
        {item.status !== 'completed' && item.status !== 'cancelled' && (
          <button className="danger" onClick={() => onCancel(item.id)}>
            Cancel
          </button>
        )}
        {canRemove && (
          <button className="danger" onClick={() => onRemove(item.id)}>
            Remove
          </button>
        )}
      </div>

      {item.error_message && <p className="error-text">{item.error_message}</p>}
    </article>
  )
}
