import { prettyBytes } from "../api";

interface FormatListProps {
  formats: Array<{
    format_id: string;
    type: "video" | "audio" | "combined";
    container?: string | null;
    resolution?: string | null;
    fps?: number | null;
    bitrate?: string | null;
    filesize_est?: number | null;
  }>;
  selectedFormatId: string | null;
  onSelect: (formatId: string) => void;
}

function groupLabel(type: string): string {
  if (type === "video") return "Video";
  if (type === "audio") return "Audio";
  return "Combined";
}

export default function FormatList({
  formats,
  selectedFormatId,
  onSelect,
}: FormatListProps) {
  const groups = formats.reduce<Record<string, typeof formats>>(
    (accumulator, format) => {
      const bucket = accumulator[format.type] || [];
      bucket.push(format);
      accumulator[format.type] = bucket;
      return accumulator;
    },
    {},
  );

  return (
    <section className="panel format-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Choose a format</h2>
          <p className="lede">
            Groupings stay local to the backend. Nothing third-party leaks to
            the browser.
          </p>
        </div>
      </div>

      <div className="format-groups">
        {(["combined", "video", "audio"] as const).map((group) => {
          const items = groups[group] || [];
          return (
            <article className="format-group" key={group}>
              <h3>
                {groupLabel(group)} <span>{items.length}</span>
              </h3>
              <div className="format-grid">
                {items.length === 0 && (
                  <p className="muted">No formats in this bucket.</p>
                )}
                {items.map((item) => {
                  const selected = selectedFormatId === item.format_id;
                  return (
                    <button
                      type="button"
                      key={item.format_id}
                      className={`format-card ${selected ? "is-selected" : ""}`}
                      onClick={() => onSelect(item.format_id)}
                    >
                      <div className="format-card-head">
                        <strong>
                          {item.resolution ||
                            item.bitrate ||
                            item.container ||
                            "Unknown"}
                        </strong>
                        <span>{item.format_id}</span>
                      </div>
                      <div className="format-card-meta">
                        <span>{item.container || "container n/a"}</span>
                        <span>{item.fps ? `${item.fps} fps` : item.type}</span>
                        <span>{prettyBytes(item.filesize_est)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
