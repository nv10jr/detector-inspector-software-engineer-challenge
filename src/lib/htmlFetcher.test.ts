import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchHtml } from "./htmlFetcher";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Given a URL to fetch", () => {
  it("When the response is 200, Then it resolves with the response body text and sends a descriptive User-Agent", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("<html>ok</html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const html = await fetchHtml("https://en.wikipedia.org/wiki/Example");

    expect(html).toBe("<html>ok</html>");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe("https://en.wikipedia.org/wiki/Example");
    expect(options.headers["User-Agent"]).toBeTruthy();
  });

  it("When the response is a non-2xx status, Then it throws an error naming the status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve(""),
      })
    );

    await expect(fetchHtml("https://en.wikipedia.org/wiki/Missing")).rejects.toThrow(/404/);
  });

  it("When the network request itself fails, Then it throws a wrapped, readable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND")));

    await expect(fetchHtml("https://en.wikipedia.org/wiki/Example")).rejects.toThrow(
      /ENOTFOUND/
    );
  });

  it("When the URL is malformed, Then it throws before ever calling fetch", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchHtml("not-a-url")).rejects.toThrow(/invalid url/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("When the URL is not a wikipedia.org host, Then it throws before ever calling fetch (blocks SSRF to arbitrary/internal hosts)", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchHtml("https://example.com/wiki/Example")).rejects.toThrow(/wikipedia/i);
    await expect(fetchHtml("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      /wikipedia/i
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("When the URL is any wikipedia.org language subdomain over https, Then it is accepted", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: () => Promise.resolve("<html>ok</html>"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchHtml("https://fr.wikipedia.org/wiki/Exemple")).resolves.toBe(
      "<html>ok</html>"
    );
  });
});
