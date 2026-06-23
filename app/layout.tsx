import type { ReactNode } from 'react';
import './styles.css';

export const metadata = {
  title: 'timber-mdx-example',
  description: 'Built with timber.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
