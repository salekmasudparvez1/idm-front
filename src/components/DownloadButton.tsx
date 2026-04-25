interface DownloadButtonProps {
  disabled: boolean;
  busy: boolean;
  merge: boolean;
  progress: number;
  jobId: string | null;
  jobStatus: string | null;
  selectedFormatLabel: string | null;
  onDownload: () => void;
  onStream: () => void;
  onToggleMerge: () => void;
  onCancel: () => void;
}

export default function DownloadButton({
  disabled,
  busy,
  merge,
  progress,
  jobId,
  jobStatus,
  selectedFormatLabel,
  onDownload,
  onStream,
  onToggleMerge,
  onCancel,
}: DownloadButtonProps) {
  return (
    <section className="panel download-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>Download or stream</h2>
          <p className="lede">
            The browser talks only to your backend stream endpoint.
          </p>
        </div>
      </div>

      <div className="download-actions">
        <label className="merge-toggle">
          <input type="checkbox" checked={merge} onChange={onToggleMerge} />
          Merge audio and video when needed
        </label>
        <div className="action-row">
          <button
            type="button"
            disabled={disabled || busy || !selectedFormatLabel}
            onClick={onDownload}
          >
            {busy ? "Working…" : "Download"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={disabled || !selectedFormatLabel}
            onClick={onStream}
          >
            Stream
          </button>
          <button
            type="button"
            className="ghost"
            disabled={!busy}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="progress-shell" aria-live="polite">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
          />
        </div>
        <div className="progress-meta">
          <span>{selectedFormatLabel || "No format selected"}</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="job-meta">
          <span>{jobId ? `Job ${jobId.slice(0, 8)}` : "No active job"}</span>
          <span>{jobStatus || "idle"}</span>
        </div>
      </div>
    </section>
  );
}
