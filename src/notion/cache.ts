import { homedir } from "os";
import { join } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import type { SlimBlock } from "./block";
import type { SlimPage } from "./page";

export interface CachedPage {
  pageId: string;
  lastEditedTime: string;
  fetchedAt: number;
  page: SlimPage;
  blocks: SlimBlock[];
}

const CACHE_DIR = join(homedir(), ".cache", "noon", "pages");

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(pageId: string): string {
  const normalizedId = pageId.replace(/-/g, "");
  return join(CACHE_DIR, `${normalizedId}.json`);
}

export function getCache(pageId: string): CachedPage | null {
  ensureCacheDir();
  const cachePath = getCachePath(pageId);

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const data = readFileSync(cachePath, "utf-8");
    return JSON.parse(data) as CachedPage;
  } catch {
    return null;
  }
}

export function saveCache(cache: CachedPage): void {
  ensureCacheDir();
  const cachePath = getCachePath(cache.pageId);
  writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

export function invalidateCache(pageId: string): void {
  const cachePath = getCachePath(pageId);
  if (existsSync(cachePath)) {
    unlinkSync(cachePath);
  }
}

export function isCacheValid(cache: CachedPage, currentLastEditedTime: string): boolean {
  return cache.lastEditedTime === currentLastEditedTime;
}
