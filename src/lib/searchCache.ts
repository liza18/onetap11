/**
 * LRU Search Cache with indexed lookup for frequent queries.
 * Provides O(1) get/set with automatic eviction of least recently used entries.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hitCount: number;
}

export class SearchCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = 50, ttlMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /** Normalize query for cache key consistency */
  private normalizeKey(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, " ");
  }

  /** Check if entry is still valid */
  private isValid(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.ttlMs;
  }

  /** Get cached result — returns null on miss */
  get(query: string): T | null {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);

    if (!entry) return null;
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    // LRU: move to end (most recent)
    entry.hitCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /** Store result in cache */
  set(query: string, data: T): void {
    const key = this.normalizeKey(query);

    // Evict LRU entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 1,
    });
  }

  /** Check if query is cached and valid */
  has(query: string): boolean {
    const key = this.normalizeKey(query);
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /** Get frequently searched queries (by hit count) */
  getFrequentQueries(limit = 5): string[] {
    const entries = Array.from(this.cache.entries())
      .filter(([, entry]) => this.isValid(entry))
      .sort((a, b) => b[1].hitCount - a[1].hitCount)
      .slice(0, limit)
      .map(([key]) => key);
    return entries;
  }

  /** Get recent queries in order */
  getRecentQueries(limit = 10): string[] {
    const entries = Array.from(this.cache.entries())
      .filter(([, entry]) => this.isValid(entry))
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, limit)
      .map(([key]) => key);
    return entries;
  }

  /** Clear entire cache */
  clear(): void {
    this.cache.clear();
  }

  /** Cache size */
  get size(): number {
    return this.cache.size;
  }
}

/** Singleton cache instance for product searches */
export const productSearchCache = new SearchCache<any[]>(50, 5 * 60 * 1000);

/** Track search history separately (persists query strings only) */
class SearchHistory {
  private history: { query: string; timestamp: number }[] = [];
  private readonly maxSize = 30;

  add(query: string): void {
    const normalized = query.toLowerCase().trim();
    // Remove duplicate if exists
    this.history = this.history.filter((h) => h.query !== normalized);
    this.history.unshift({ query: normalized, timestamp: Date.now() });
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
  }

  getRecent(limit = 8): string[] {
    return this.history.slice(0, limit).map((h) => h.query);
  }

  clear(): void {
    this.history = [];
  }
}

export const searchHistory = new SearchHistory();
