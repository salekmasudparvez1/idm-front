import { useEffect, useState } from "react";

interface AnalyzeFormProps {
  defaultValue?: string;
  loading: boolean;
  onAnalyze: (url: string, signal: AbortSignal) => Promise<void>;
  onCancel: () => void;
}

export default function AnalyzeForm({
  defaultValue = "",
  loading,
  onAnalyze,
  onCancel,
}: AnalyzeFormProps) {
  const [url, setUrl] = useState(defaultValue);
  const [controller, setController] = useState<AbortController | null>(null);

  useEffect(() => {
    setUrl(defaultValue);
  }, [defaultValue]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const nextController = new AbortController();
    setController(nextController);
    try {
      await onAnalyze(trimmed, nextController.signal);
    } finally {
      setController(null);
    }
  }

  function handleCancel() {
    controller?.abort();
    onCancel();
    setController(null);
  }

  return (
    <form className="panel analyze-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>Analyze a video URL</h2>
          <p className="lede">
            The backend inspects the media server-side and returns normalized
            formats.
          </p>
        </div>
      </div>

      <div className="input-row">
        <input
          type="url"
          autoComplete="off"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={handleCancel}
          disabled={!controller && !loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
