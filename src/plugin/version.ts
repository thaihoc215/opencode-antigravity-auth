/**
 * Remote Antigravity version fetcher.
 *
 * Mirrors the Antigravity-Manager's version resolution strategy:
 *   1. Auto-updater API (plain text with semver)
 *   2. Changelog page scrape (first 5000 chars)
 *   3. Hardcoded fallback in constants.ts
 *
 * Called once at plugin startup to ensure headers use the latest
 * supported version, avoiding "version no longer supported" errors.
 *
 * @see https://github.com/lbjlaq/Antigravity-Manager (src-tauri/src/constants.rs)
 */

import { getAntigravityVersion, setAntigravityVersion } from "../constants";
import { createLogger } from "./logger";

const VERSION_URL = "https://antigravity-auto-updater-974169037036.us-central1.run.app";
const CHANGELOG_URL = "https://antigravity.google/changelog";
const FETCH_TIMEOUT_MS = 5000;
const CHANGELOG_SCAN_CHARS = 5000;
const VERSION_REGEX = /\d+\.\d+\.\d+/;

type VersionSource = "api" | "changelog" | "fallback";

function parseVersion(text: string): string | null {
  const match = text.match(VERSION_REGEX);
  return match ? match[0] : null;
}

/** Numeric semver compare: negative if a < b, positive if a > b, 0 if equal. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function tryFetchVersion(url: string, maxChars?: number): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    let text = await response.text();
    if (maxChars) text = text.slice(0, maxChars);
    return parseVersion(text);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch the latest Antigravity version and update the global constant.
 * Safe to call before logger is initialized (will silently skip logging).
 */
export async function initAntigravityVersion(): Promise<void> {
  const log = createLogger("version");
  const fallback = getAntigravityVersion();
  let version: string | null;
  let source: VersionSource;

  // 1. Try auto-updater API
  version = await tryFetchVersion(VERSION_URL);
  if (version) {
    source = "api";
  } else {
    // 2. Try changelog page scrape
    version = await tryFetchVersion(CHANGELOG_URL, CHANGELOG_SCAN_CHARS);
    if (version) {
      source = "changelog";
    } else {
      // 3. Fall back to hardcoded
      source = "fallback";
      setAntigravityVersion(fallback);
      log.info("version-fetch-failed", { fallback });
      return;
    }
  }

  // Never report older than the hardcoded floor. The auto-updater endpoint
  // serves a pinned "Fixed Version" that trails the real releases, and the
  // backend gates its model catalog on the reported version — taking a stale
  // value verbatim silently hides models the account is entitled to.
  if (compareVersions(version, fallback) < 0) {
    log.info("version-floored", { reported: version, source, using: fallback });
    setAntigravityVersion(fallback);
    return;
  }

  if (version !== fallback) {
    log.info("version-updated", { version, source, previous: fallback });
  } else {
    log.debug("version-unchanged", { version, source });
  }
  setAntigravityVersion(version);
}
