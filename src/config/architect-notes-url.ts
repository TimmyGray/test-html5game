/**
 * Purpose: Resolve and validate the Story 4.4 “Architect's Notes” external URL (http/https only).
 * Inputs: optional raw string from build-time env (`TRP_ARCHITECT_NOTES_URL`); default when empty/invalid.
 * Outputs: Normalized absolute URL string safe for `window.open`.
 * Side effects: none (pure).
 * Failure modes: malformed or non-http(s) schemes fall back to `DEFAULT_ARCHITECT_NOTES_URL`.
 * Security notes: rejects `javascript:` and other schemes; only http/https pass.
 */
export const DEFAULT_ARCHITECT_NOTES_URL =
  "https://github.com/TimmyGray/test-html5game";

export function resolveArchitectNotesUrl(raw: string | undefined): string {
  const candidate = raw?.trim() || DEFAULT_ARCHITECT_NOTES_URL;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return new URL(DEFAULT_ARCHITECT_NOTES_URL).href;
    }
    return u.href;
  } catch {
    return new URL(DEFAULT_ARCHITECT_NOTES_URL).href;
  }
}

/**
 * Purpose: Read validated URL from webpack-injected `process.env` (see `webpack.config.mjs`).
 * Inputs: `process.env.TRP_ARCHITECT_NOTES_URL` when defined at build time.
 * Outputs: Same contract as `resolveArchitectNotesUrl`.
 * Side effects: none.
 */
export function readArchitectNotesUrlFromEnv(): string {
  const v =
    typeof process !== "undefined"
      ? process.env.TRP_ARCHITECT_NOTES_URL
      : undefined;
  return resolveArchitectNotesUrl(typeof v === "string" ? v : undefined);
}
