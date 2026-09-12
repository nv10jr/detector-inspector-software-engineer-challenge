"use client";

import { useState } from "react";
import styles from "./page.module.css";

const EXAMPLE_URL =
  "https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression";

interface ChartMeta {
  tableColumns: string;
  chartColumn: string;
  pointCount: string;
}

export default function Home() {
  const [url, setUrl] = useState(EXAMPLE_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ChartMeta | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setImageUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setMeta(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${res.status}`);
      }

      setMeta({
        tableColumns: decodeURIComponent(res.headers.get("X-Table-Columns") ?? ""),
        chartColumn: decodeURIComponent(res.headers.get("X-Chart-Column") ?? ""),
        pointCount: res.headers.get("X-Point-Count") ?? "",
      });

      const blob = await res.blob();
      setImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Wikipedia Table Chart</h1>
        <p className={styles.subtitle}>
          Paste a Wikipedia page URL. We&apos;ll find a table, detect its
          numeric column, and plot it as a chart image.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/..."
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Generating…" : "Generate chart"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {imageUrl && meta && (
          <div className={styles.result}>
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic client-side blob: URL, not a static/remote asset next/image can optimize */}
            <img className={styles.chart} src={imageUrl} alt={`Chart of ${meta.chartColumn}`} />
            <p className={styles.meta}>
              Table columns: {meta.tableColumns} — charted &quot;{meta.chartColumn}&quot; (
              {meta.pointCount} points)
            </p>
            <a href={imageUrl} download="chart.png">
              Download chart.png
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
