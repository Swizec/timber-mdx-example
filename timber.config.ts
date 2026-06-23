import { nitro } from '@timber-js/app/adapters/nitro';

export default {
  adapter: nitro(),
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
};
