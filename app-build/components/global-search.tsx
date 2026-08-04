"use client";
import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "@/lib/universal-search";
import { brand } from "@/lib/brand";
import {
  buildSearchResultHref,
  parseRecentSearches,
  rememberRecentSearch,
  searchQueryParam,
} from "@/lib/search-navigation";

const recentSearchStorageKey = "hojavia:recent-searches:v1";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [originHref, setOriginHref] = useState("/");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const palette = useRef<HTMLElement>(null);

  const closeSearch = () => {
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has(searchQueryParam)) {
      url.searchParams.delete(searchQueryParam);
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }
  };

  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    setOriginHref(current);
    try {
      setRecentSearches(
        parseRecentSearches(
          window.localStorage.getItem(recentSearchStorageKey),
        ),
      );
    } catch {
      setRecentSearches([]);
    }
    const restoredQuery = new URLSearchParams(window.location.search).get(
      searchQueryParam,
    );
    if (restoredQuery?.trim()) {
      setQuery(restoredQuery);
      setOpen(true);
    }
    const key = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOriginHref(
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
        setOpen(true);
      }
      if (event.key === "Escape") closeSearch();
    };
    const requestedOpen = () => {
      setOriginHref(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
      setOpen(true);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("hojavia:open-search", requestedOpen);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("hojavia:open-search", requestedOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => input.current?.focus(), 0);
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = [...(palette.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? [])];
      if (!controls.length) return;
      const first = controls[0], last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = priorOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchError("");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");
      setResults([]);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || "Search unavailable");
        setResults(value.data ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setSearchError("Search is temporarily unavailable. Your private Vault is unchanged.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retryKey]);

  const openSearch = () => {
    setOriginHref(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    setOpen(true);
  };

  const rememberQuery = (value: string) => {
    setRecentSearches((current) => {
      const next = rememberRecentSearch(current, value);
      try {
        window.localStorage.setItem(
          recentSearchStorageKey,
          JSON.stringify(next),
        );
      } catch {
        // Search remains fully usable when browser storage is unavailable.
      }
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      window.localStorage.removeItem(recentSearchStorageKey);
    } catch {
      // The visible list is still cleared for this session.
    }
    input.current?.focus();
  };

  return (
    <>
      <button
        className="globalSearchTrigger"
        onClick={openSearch}
        aria-label={`Search ${brand.name}`}
      >
        <span>⌕</span>
        <b>Search</b>
        <kbd>⌘ K</kbd>
      </button>
      {open && (
        <div
          className="commandOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Search ${brand.name}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeSearch();
          }}
        >
          <section ref={palette} className="commandPalette" aria-busy={loading}>
            <header>
              <span>⌕</span>
              <input
                ref={input}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search cigars, collections, markets, or tools"
                aria-describedby="search-privacy-note"
                placeholder="Search cigars, collections, markets, or tools…"
              />
              {query && <button type="button" className="commandClear" onClick={() => { setQuery(""); setResults([]); setSearchError(""); input.current?.focus(); }} aria-label="Clear search">Clear</button>}
              <button type="button" onClick={closeSearch} aria-label="Close search">
                ×
              </button>
            </header>
            <div className="commandResults">
              {results.map((result) => (
                <a
                  href={buildSearchResultHref(
                    result.href,
                    originHref,
                    query,
                  )}
                  key={result.id}
                  onClick={() => rememberQuery(query)}
                >
                  <span className="resultKind">{result.kind}</span>
                  <div>
                    <strong>{result.label}</strong>
                    <small>{result.detail}</small>
                  </div>
                  {result.signal && (
                    <b className="signalBadge">{result.signal}</b>
                  )}
                  <em>→</em>
                </a>
              ))}
              {loading && <p role="status">Searching your private Vault…</p>}
              {!loading && searchError && <div className="commandError" role="alert"><strong>Search could not finish.</strong><p>{searchError}</p><button type="button" className="button secondary" onClick={() => setRetryKey((value) => value + 1)}>Try search again</button></div>}
              {!loading && !searchError && query.length >= 2 && !results.length && (
                <div className="commandEmpty"><strong>No matching records or workspaces.</strong><p>Try a broader name, or choose where you want to continue.</p><div><a className="button secondary" href="/inventory#mobile-intake">Document a cigar</a><a className="button secondary" href="/inventory">Open Vault</a></div></div>
              )}
              {!query.trim() && recentSearches.length > 0 && (
                <section
                  className="recentSearches"
                  aria-label="Recent searches"
                >
                  <header>
                    <strong>Recent searches</strong>
                    <button type="button" onClick={clearRecentSearches}>
                      Clear
                    </button>
                  </header>
                  <div>
                    {recentSearches.map((recent) => (
                      <button
                        type="button"
                        onClick={() => setQuery(recent)}
                        key={recent.toLocaleLowerCase()}
                      >
                        <span aria-hidden="true">↺</span>
                        {recent}
                      </button>
                    ))}
                  </div>
                  <small>
                    Saved only in this browser profile—not to your account.
                  </small>
                </section>
              )}
              {query.trim().length < 2 &&
                (query.trim().length > 0 || !recentSearches.length) && (
                <p>
                  Type at least two characters. Try a brand, vitola, collection,
                  box code, or workspace.
                </p>
                )}
            </div>
            <footer>
              <span id="search-privacy-note">Private account search</span>
              <span>Esc to close</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
