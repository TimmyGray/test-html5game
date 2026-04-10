// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { openArchitectNotesInNewTab } from "./open-architect-notes.js";

describe("openArchitectNotesInNewTab", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns opened when window.open succeeds", async () => {
    const fakeWin = {} as Window;
    vi.spyOn(window, "open").mockReturnValue(fakeWin);
    const r = await openArchitectNotesInNewTab("https://example.com/a");
    expect(r).toEqual({ opened: true });
  });

  it("copies URL and returns hint when popup is blocked", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: write } });
    const r = await openArchitectNotesInNewTab("https://example.com/b");
    expect(r.opened).toBe(false);
    if (!r.opened) {
      expect(r.hint).toContain("blocked");
      expect(write).toHaveBeenCalledWith("https://example.com/b");
    }
  });
});
