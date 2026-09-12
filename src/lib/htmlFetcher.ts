// Generic, non-identifying contact string. Wikipedia's fetch etiquette asks
// for a descriptive User-Agent (some generic/default ones get throttled) —
// this deliberately carries no personal information, just a project label.
const USER_AGENT = "DetectorInspectorChallenge/1.0 (educational take-home demo)";

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchHtml(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: "${url}"`);
  }

  // This URL is fetched server-side on the caller's behalf, so an
  // unrestricted fetch would let a visitor make this server issue requests
  // to arbitrary/internal hosts (SSRF). Scoping to wikipedia.org over https
  // matches the challenge's stated input (a Wikipedia page) and closes that
  // off.
  const isWikipediaHost =
    parsed.hostname === "wikipedia.org" || parsed.hostname.endsWith(".wikipedia.org");
  if (parsed.protocol !== "https:" || !isWikipediaHost) {
    throw new Error(`Only https://*.wikipedia.org URLs are supported, got: "${url}"`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(parsed.toString(), {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch "${url}": ${message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch "${url}": HTTP ${response.status} ${response.statusText}`);
  }

  return response.text();
}
