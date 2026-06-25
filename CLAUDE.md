# timber-mdx-example

A TimberJS blog/content example using content collections, MDX, and embed components.

## TimberJS — key differences from Next.js

All components are **server components by default** — only add `'use client'` for browser APIs or hooks.

`fetch()` is **never patched** — use `cache()` from `@timber-js/app/cache` for caching.

`loading.tsx` **does not exist** — use `<Suspense>` explicitly.

`notFound()` does not exist — use `deny(404)` from `@timber-js/app/server`.

There is **no** `@timber-js/app` default import — always use subpath exports:

| What you need | Import from |
|---|---|
| `deny`, `redirect`, `getSegmentParams`, `getHeaders`, `getCookieJar`, `createActionClient` | `@timber-js/app/server` |
| `Link`, `useRouter`, `usePathname`, `useActionState` | `@timber-js/app/client` |
| `cache`, `CacheHandler` | `@timber-js/app/cache` |
| `defineSearchParams` | `@timber-js/app/search-params` |
| `defineSegmentParams`, `defineSchema` | `@timber-js/app/params` |
| Content collection data (e.g. `allPages`) | `content-collections` |
| `Metadata` type | `@timber-js/app/server` |

### Metadata

Static: `export const metadata: Metadata = { title: '...' }`

Dynamic (per-request via `getSegmentParams()`):
```ts
export async function metadata(): Promise<Metadata> {
  const { slug } = getSegmentParams();
  // ...
  return { title, openGraph: { ... } };
}
```

`generateMetadata` does **not** exist — name the export `metadata`.

### Dynamic segments

Directory syntax: `[param]` (dynamic), `[...slug]` (catch-all), `[[...slug]]` (optional catch-all).

`getSegmentParams()` returns `Record<string, string | string[]>` — catch-all params are `string[]`.

### Fetching these docs

Any docs page as markdown: `curl -H 'Accept: text/markdown' 'https://timberjs.com/docs/<page>?foo=pass'`

---

## This project

### Content collections

`content-collections.ts` — defines the `pages` collection (metadata only, no MDX compilation).
TimberJS auto-detects this file and activates `@content-collections/vite`.

`pages/**/*.mdx` — content source. Drop any `.mdx` file here at any depth; it gets a URL matching its path.

`app/[...slug]/page.tsx` — catch-all route. Uses `import.meta.glob('/pages/**/*.{mdx,md}')` to load MDX as proper ES modules via `@mdx-js/rollup` (RSC-compatible). Content-collections supplies typed metadata; Vite compiles the MDX.

> **Why not `@content-collections/mdx`?** It uses `mdx-bundler` (eval-based IIFE) which can't cross the RSC boundary. Keep content-collections for metadata only.

### OG metadata

`app/mdx-metadata.ts` — `metadataFromFrontmatter(page, routePath)` maps content-collection fields to the `Metadata` type. The `hero`/`image` field resolves to `/social-cards/<slug>.png`.

Frontmatter fields: `title`, `description`, `published`/`publishedAt`, `hero`/`image`.

### MDX plugins (`mdx-plugins/`)

`remark-swizec-embeds.mjs` — transforms giphy:/youtube/codesandbox/twitter URLs → JSX components, injects relative imports into each MDX file.

### Embed components (`components/`)

`GiphyEmbed`, `YouTubeEmbed`, `CodeSandboxEmbed`, `TweetEmbed`, `TwitterWidgetsScript`.
Imported directly by MDX files via the remark plugin. `YouTubeEmbed` uses `'use client'`.
