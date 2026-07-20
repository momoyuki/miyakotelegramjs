# Domain-less X/Twitter status link support

## Problem

Users sometimes paste X/Twitter status links without a domain, e.g.:

- `(X) /username/status/0123456789`
- `(X) username/status/0123456789` (no leading slash)
- `username/status/0123456789` (no marker at all)

None of these were recognized by the existing link-repair pipeline, so the
bot never rewrote or forwarded them.

## Requirements

1. Recognize `(X)` or `(x)` (case-insensitive) as an explicit marker that the
   following path is an X/Twitter status link.
2. The marker is optional — a bare `username/status/0123456789` must also be
   recognized.
3. Any whitespace (space, tab, newline) is allowed between the marker and the
   path.
4. The leading `/` before `username` is optional.
5. Once recognized, the reference must be rewritten to a full `https://x.com/...`
   URL so it flows through the existing pipeline and ends up as both:
   - a `vxtwitter.com` link (via `repairLinks`)
   - a `fixupx.com` link (via `convertToFixupX`)
6. Must not re-match/mangle a status path that is already part of a complete
   URL (e.g. `https://twitter.com/user/status/123` must not become
   `https://twitter.com/https://x.com/user/status/123`).

## Non-goals

- Other platform markers (e.g. `(Twitter)`, `(FB)`, `(IG)`) are out of scope.
- Validating that `username` is a real X handle or that the status ID is a
  real tweet ID.

## Design

Add one replacement step at the end of `performCommonRepairs()` in
`src/index.ts`, after URL reconstruction/normalization has already run:

```js
cleaned = cleaned.replace(/(?<![\w./:])(?:\(\s*[xX]\s*\)\s*)?\/?(\w+\/status\/\d+\S*)/g, "https://x.com/$1");
```

- `(?<![\w./:])` — negative lookbehind so the match can't start in the
  middle of an existing URL/domain/path (protects requirement 6).
- `(?:\(\s*[xX]\s*\)\s*)?` — optional `(X)`/`(x)` marker with optional
  internal/trailing whitespace (requirements 1, 3, 2).
- `\/?` — optional leading slash (requirement 4).
- `(\w+\/status\/\d+\S*)` — captures `username/status/<digits><trailing>`,
  reused in the replacement to build the full URL (requirement 5).

Placing this after the existing URL-reconstruction step means any already-complete
URL exists in `cleaned` by the time this regex runs, so the lookbehind
correctly sees the domain/path characters that immediately precede a
status path inside a real URL and skips it.

## Testing

Added to `test/bot_logic.spec.ts`, covering both `repairLinks` and
`convertToFixupX`:

- `(X) /user/status/123` → rewritten
- `(X) user/status/123` (no leading slash) → rewritten
- `(x) user/status/123` (lowercase marker) → rewritten
- `user/status/123` (no marker) → rewritten
- `https://twitter.com/user/status/123` (already complete) → unchanged
  domain-wise (still goes through the normal x.com/twitter.com → vxtwitter.com
  rewrite, but is not double-prefixed)
