/**
 * Purpose: Open technical documentation in a new tab with popup-block fallback (Story 4.4).
 * Inputs: validated http(s) URL string.
 * Outputs: `{ opened: true }` when `window.open` succeeds; `{ opened: false, hint }` when blocked (clipboard attempted).
 * Side effects: may open a tab; may write to clipboard; never navigates the current game window.
 * Failure modes: clipboard API rejects silently; caller still shows `hint`.
 * Security notes: URL must be pre-validated (http/https only); uses `noopener,noreferrer`.
 */
export async function openArchitectNotesInNewTab(
  url: string,
): Promise<{ opened: true } | { opened: false; hint: string }> {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (w) {
    return { opened: true };
  }
  const hint =
    "New tab was blocked. Link copied — paste into your browser, or allow popups for this site.";
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    /* clipboard may be denied; hint still guides the user */
  }
  return { opened: false, hint };
}
