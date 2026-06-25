import { defineCollection, defineConfig } from '@content-collections/core';
import { z } from 'zod';

// Metadata-only collection: content-collections validates frontmatter and builds
// a typed index. Actual MDX rendering goes through Vite's @mdx-js/rollup pipeline
// via import.meta.glob in the catch-all page — that produces proper ES modules
// compatible with React Server Components.
const pages = defineCollection({
  name: 'pages',
  directory: 'pages',
  include: '**/*.{mdx,md}',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published: z.string().optional(),
    publishedAt: z.string().optional(),
    hero: z.string().optional(),
    image: z.string().optional(),
    content: z.string(),
  }),
});

export default defineConfig({
  content: [pages],
});
