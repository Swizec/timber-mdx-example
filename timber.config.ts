import { nitro } from '@timber-js/app/adapters/nitro';

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
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
};
