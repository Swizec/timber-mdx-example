import { nitro } from '@timber-js/app/adapters/nitro';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { remarkSwizecEmbeds } from './mdx-plugins.mjs';

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
    remarkPlugins: [remarkSwizecEmbeds],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
  },
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
};
