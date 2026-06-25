import { allPages } from "content-collections";
import { deny, getSegmentParams } from "@timber-js/app/server";
import type { Metadata } from "@timber-js/app/server";
import type React from "react";
import { metadataFromFrontmatter } from "../mdx-metadata";

// Vite glob import: all MDX files under pages/ compiled as proper ES modules
// by @mdx-js/rollup (the same pipeline as app/ pages). This is compatible with
// React Server Components, unlike mdx-bundler's eval-based approach.
const mdxModules = import.meta.glob("/pages/**/*.{mdx,md}");

type MDXModule = { default: React.FC };

function resolvedPath(): string {
    const { slug } = getSegmentParams();
    return Array.isArray(slug) ? slug.join("/") : (slug ?? "");
}

export async function metadata(): Promise<Metadata> {
    const path = resolvedPath();
    const page = allPages.find((p) => p._meta.path === path);
    if (!page) return {};
    return metadataFromFrontmatter(page, `/${path}`);
}

export default async function Page() {
    const path = resolvedPath();
    const page = allPages.find((p) => p._meta.path === path);

    if (!page) {
        deny(404);
        return null;
    }

    const loadModule =
        mdxModules[`/pages/${path}.mdx`] ?? mdxModules[`/pages/${path}.md`];
    if (!loadModule) {
        deny(404);
        return null;
    }

    const { default: MDXContent } = (await loadModule()) as MDXModule;

    return (
        <article>
            <h1>{page.title}</h1>
            <MDXContent />
        </article>
    );
}
