import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AnalyzeForm from "./components/AnalyzeForm";
import DownloadButton from "./components/DownloadButton";
import FormatList from "./components/FormatList";
import {
  api,
  prettyDuration,
  type AnalyzeResponse,
  type FormatResponse,
  type JobResponse,
} from "./api";

function pickInitialFormat(formats: AnalyzeResponse["formats"]): string | null {
  const preferred =
    formats.find((item) => item.type === "combined") ||
    formats.find((item) => item.type === "video") ||
    formats[0];
  return preferred?.format_id || null;
}

function formatBadge(type: string): string {
  if (type === "video") return "Video";
  if (type === "audio") return "Audio";
  return "Combined";
}

export default function App() {
  const queryClient = useQueryClient();
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [merge, setMerge] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const formatsQuery = useQuery<FormatResponse>({
    queryKey: ["formats", analysis?.id],
    queryFn: () => api.formats(analysis!.id),
    enabled: Boolean(analysis?.id),
    initialData: analysis
      ? { video_id: analysis.id, formats: analysis.formats }
      : undefined,
  });

  const jobQuery = useQuery<JobResponse>({
    queryKey: ["job", activeJobId],
    queryFn: () => api.job(activeJobId!),
    enabled: Boolean(activeJobId),
    refetchInterval: activeJobId ? 1000 : false,
  });

  useEffect(() => {
    if (!jobQuery.data) return;
    setJobStatus(jobQuery.data.status);
    if (
      jobQuery.data.status === "completed" ||
      jobQuery.data.status === "failed" ||
      jobQuery.data.status === "cancelled"
    ) {
      setBusy(false);
      setActiveJobId(null);
    }
  }, [jobQuery.data]);

  const selectedFormat = useMemo(
    () =>
      formatsQuery.data?.formats.find(
        (item) => item.format_id === selectedFormatId,
      ) || null,
    [formatsQuery.data, selectedFormatId],
  );

  async function handleAnalyze(url: string, signal: AbortSignal) {
    setBusy(true);
    setError("");
    try {
      const result = await api.analyze(url, signal);
      setAnalysis(result);
      setSelectedFormatId(
        (current) => current || pickInitialFormat(result.formats),
      );
      queryClient.setQueryData(["formats", result.id], {
        video_id: result.id,
        formats: result.formats,
      });
      setProgress(0);
      setActiveJobId(null);
      setJobStatus(null);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    if (!analysis || !selectedFormatId) return;
    const nextController = new AbortController();
    setController(nextController);
    setBusy(true);
    setError("");
    setProgress(0);

    try {
      const result = await api.streamDownload({
        videoId: analysis.id,
        formatId: selectedFormatId,
        merge,
        signal: nextController.signal,
        onProgress: (received, total) => {
          if (!total || total <= 0) return;
          setProgress((received / total) * 100);
        },
      });
      setActiveJobId(result.jobId || null);
      setJobStatus("running");
      setProgress(100);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
      setController(null);
    }
  }

  function handleStream() {
    if (!analysis || !selectedFormatId) return;
    api.openStream(analysis.id, selectedFormatId, merge);
  }

  function handleCancel() {
    controller?.abort();
    setBusy(false);
    setActiveJobId(null);
    setJobStatus("cancelled");
  }

  const analysisHeader = analysis ? (
    <section className="panel summary-panel">
      <div className="summary-media">
        {analysis.thumbnail ? (
          <img src={analysis.thumbnail} alt={analysis.title} />
        ) : (
          <div className="thumbnail-placeholder">No thumbnail</div>
        )}
      </div>
      <div className="summary-copy">
        <p className="eyebrow">Step 0</p>
        <h1>{analysis.title}</h1>
        <div className="summary-metadata">
          <span className="meta-pill">ID {analysis.id}</span>
          <span className="meta-pill">{prettyDuration(analysis.duration)}</span>
          <span className="meta-pill">{analysis.formats.length} formats</span>
          {selectedFormat && (
            <span className="meta-pill">
              {formatBadge(selectedFormat.type)} ·{" "}
              {selectedFormat.resolution || selectedFormat.bitrate || "best"}
            </span>
          )}
        </div>
        <p className="lede">
          Inspect the available encodes, select the target quality, and send the
          file through your backend stream or proxy.
        </p>
      </div>
    </section>
  ) : (
    <section className="panel summary-panel empty-summary">
      <div>
        <p className="eyebrow">Media Forge</p>
        <h1>Analyze, inspect, and stream without exposing signed URLs.</h1>
        <p className="lede">
          Paste a video URL to fetch normalized metadata from the backend,
          choose a quality, then stream or download through your own
          infrastructure.
        </p>
      </div>
    </section>
  );

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Production media pipeline</p>
          <h1>Server-side media analysis for secure playback and downloads.</h1>
          <p className="hero-text">
            FastAPI handles extraction, caching, job tracking, and streamed
            delivery. The browser only sees normalized metadata and your own
            backend endpoints.
          </p>
          <div className="hero-stats">
            <div>
              <strong>{analysis ? analysis.formats.length : "0"}</strong>
              <span>Formats</span>
            </div>
            <div>
              <strong>
                {analysis ? prettyDuration(analysis.duration) : "0:00"}
              </strong>
              <span>Duration</span>
            </div>
            <div>
              <strong>
                {analysis
                  ? formatBadge(selectedFormat?.type || "combined")
                  : "Ready"}
              </strong>
              <span>Status</span>
            </div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-card accent">
            <span>Analyze</span>
            <strong>POST /analyze</strong>
          </div>
          <div className="hero-panel-card">
            <span>Formats</span>
            <strong>GET /formats/{"{video_id}"}</strong>
          </div>
          <div className="hero-panel-card">
            <span>Download</span>
            <strong>GET /download</strong>
          </div>
          <div className="hero-panel-card">
            <span>Jobs</span>
            <strong>GET /jobs/{"{id}"}</strong>
          </div>
        </div>
      </section>

      <AnalyzeForm
        loading={busy}
        onAnalyze={handleAnalyze}
        onCancel={handleCancel}
      />

      {error && <div className="error-banner">{error}</div>}

      {analysisHeader}

      {formatsQuery.data && (
        <FormatList
          formats={formatsQuery.data.formats}
          selectedFormatId={selectedFormatId}
          onSelect={setSelectedFormatId}
        />
      )}

      <DownloadButton
        disabled={!analysis || !selectedFormatId}
        busy={busy}
        merge={merge}
        progress={progress}
        jobId={activeJobId}
        jobStatus={jobStatus}
        selectedFormatLabel={
          selectedFormat
            ? `${selectedFormat.resolution || selectedFormat.bitrate || selectedFormat.container || "format"} · ${selectedFormat.type}`
            : null
        }
        onDownload={handleDownload}
        onStream={handleStream}
        onToggleMerge={() => setMerge((current) => !current)}
        onCancel={handleCancel}
      />
    </main>
  );
}
