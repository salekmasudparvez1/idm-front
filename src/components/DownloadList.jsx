import DownloadRow from './DownloadRow'

export default function DownloadList({ downloads, onPause, onResume, onCancel, onRemove }) {
  if (!downloads.length) {
    return (
      <section className="empty-state">
        <h3>Queue is empty</h3>
        <p>Start a new download to see live progress, speed, and controls.</p>
      </section>
    )
  }

  return (
    <section className="download-list">
      {downloads.map((item) => (
        <DownloadRow
          key={item.id}
          item={item}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onRemove={onRemove}
        />
      ))}
    </section>
  )
}
