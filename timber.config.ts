import { nitro } from '@timber-js/app/adapters/nitro';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';
import rehypeSlug from 'rehype-slug';
import { rehypeCodeWindow } from './mdx-plugins/rehype-code-window.mjs';
import { remarkSwizecEmbeds, remarkMdxStaticFiles } from './mdx-plugins/index.mjs';

const vercelOutputDirectory = new URL('./.vercel/output', import.meta.url).pathname;

export default {
  adapter: nitro({
    preset: 'vercel',
    compress: false,
    nitroConfig: {
      output: {
        dir: vercelOutputDirectory,
      },
    },
  }),
  mdx: {
    remarkPlugins: [remarkSwizecEmbeds, remarkMdxStaticFiles],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' } }],
      rehypeCodeWindow,
    ],
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
};
