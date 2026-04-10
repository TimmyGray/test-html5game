import { describe, expect, it } from "vitest";
import {
  DEFAULT_ARCHITECT_NOTES_URL,
  resolveArchitectNotesUrl,
} from "./architect-notes-url.js";

describe("resolveArchitectNotesUrl", () => {
  it("uses default when raw is empty", () => {
    expect(resolveArchitectNotesUrl(undefined)).toBe(
      new URL(DEFAULT_ARCHITECT_NOTES_URL).href,
    );
    expect(resolveArchitectNotesUrl("")).toBe(
      new URL(DEFAULT_ARCHITECT_NOTES_URL).href,
    );
  });

  it("normalizes valid https URLs", () => {
    expect(resolveArchitectNotesUrl("https://example.com/docs")).toBe(
      "https://example.com/docs",
    );
  });

  it("rejects non-http(s) schemes", () => {
    expect(resolveArchitectNotesUrl("javascript:alert(1)")).toBe(
      new URL(DEFAULT_ARCHITECT_NOTES_URL).href,
    );
  });

  it("falls back on parse errors", () => {
    expect(resolveArchitectNotesUrl("not a url")).toBe(
      new URL(DEFAULT_ARCHITECT_NOTES_URL).href,
    );
  });
});
