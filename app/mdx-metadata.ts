import type { Metadata } from '@timber-js/app';

const siteUrl = 'https://timber-mdx-example.vercel.app';
const siteName = 'Swizec.com';
const twitterHandle = '@swizec';
const authorName = 'Swizec Teller';

type FrontmatterValue = string | number | Date | undefined | null;

export type MdxFrontmatter = {
  title?: FrontmatterValue;
  description?: FrontmatterValue;
  published?: FrontmatterValue;
  publishedAt?: FrontmatterValue;
  hero?: FrontmatterValue;
  image?: FrontmatterValue;
};

function stringValue(value: FrontmatterValue): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function dateValue(value: FrontmatterValue): string | undefined {
  const raw = stringValue(value);
  if (!raw) return undefined;

  const normalized = raw.match(/[zZ]|[+-]\d{2}:?\d{2}$|\d{4}-\d{2}-\d{2}$/)
    ? raw
    : raw.replace(' ', 'T') + 'Z';
  const date = new Date(normalized);
  if (Number.isNaN(date.valueOf())) return undefined;

  return date.toISOString();
}

function absoluteUrl(path: string, routePath = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = new URL(siteUrl);
  if (path.startsWith('./') || path.startsWith('../')) {
    const routeBase = routePath.endsWith('/') ? routePath : `${routePath}/`;
    return new URL(path, new URL(routeBase, base)).toString();
  }

  return new URL(path.startsWith('/') ? path : `/${path}`, base).toString();
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[*+~.()[\]{}'"!?/:@,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function socialCardUrl(title: string, imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const extension = imagePath.split(/[?#]/)[0]?.split('.').pop() ?? 'png';
  return absoluteUrl(`/social-cards/${slugifyTitle(title)}.${extension}`);
}

export function metadataFromFrontmatter(
  frontmatter: MdxFrontmatter,
  routePath: string
): Metadata {
  const title = stringValue(frontmatter.title) ?? siteName;
  const description = stringValue(frontmatter.description);
  const pageUrl = absoluteUrl(routePath);
  const hero = stringValue(frontmatter.hero ?? frontmatter.image);
  const image = hero ? socialCardUrl(title, hero) : undefined;
  const publishedTime = dateValue(frontmatter.publishedAt ?? frontmatter.published);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    authors: [{ name: authorName, url: 'https://swizec.com' }],
    creator: authorName,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName,
      type: 'article',
      publishedTime,
      authors: [authorName],
      images: image
        ? {
            url: image,
            alt: title,
          }
        : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      site: twitterHandle,
      creator: twitterHandle,
      title,
      description,
      images: image
        ? {
            url: image,
            alt: title,
          }
        : undefined,
    },
  };
}
