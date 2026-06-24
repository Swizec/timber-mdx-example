import type { ReactNode } from 'react';
import './styles.css';

export const metadata = {
  metadataBase: new URL('https://timber-mdx-example.vercel.app'),
  title: {
    default: 'timber-mdx-example',
    template: '%s | timber-mdx-example',
  },
  description: 'Built with timber.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
