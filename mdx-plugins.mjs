import path from 'node:path';

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const YOUTUBE_SHORT_HOSTS = new Set(['youtu.be', 'www.youtu.be']);
const CODESANDBOX_HOSTS = new Set(['codesandbox.io', 'www.codesandbox.io']);
const TWITTER_HOSTS = new Set(['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com']);

const DEFAULT_COMPONENTS = {
  CodeSandboxEmbed: './components/codesandbox-embed.tsx',
  GiphyEmbed: './components/giphy-embed.tsx',
  TweetEmbed: './components/tweet-embed.tsx',
  TwitterWidgetsScript: './components/twitter-widgets-script.tsx',
  YouTubeEmbed: './components/youtube-embed.tsx',
};

function toPosix(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function withoutExtension(filePath) {
  return filePath.replace(/\.[cm]?[jt]sx?$/, '');
}

function importSource(fromFile, targetFile) {
  const fromDir = path.posix.dirname(toPosix(fromFile));
  let relativePath = path.posix.relative(fromDir, toPosix(targetFile));
  if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
  return withoutExtension(relativePath);
}

function componentPath(componentName, options = {}) {
  const componentFile = options.components?.[componentName] ?? DEFAULT_COMPONENTS[componentName];
  return new URL(componentFile, import.meta.url).pathname;
}

function mdxAttribute(name, value = null) {
  return { type: 'mdxJsxAttribute', name, value };
}

function mdxElement(name, attributes = {}, children = []) {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: Object.entries(attributes)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => mdxAttribute(key, value)),
    children,
  };
}

function text(value) {
  return { type: 'text', value };
}

function paragraph(children) {
  return { type: 'paragraph', children };
}

function link(url, children) {
  return { type: 'link', url, children };
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseTime(value) {
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const total = hours * 3600 + minutes * 60 + seconds;

  return total > 0 ? String(total) : null;
}

function getYouTubeIdAndParams(url) {
  const parsed = parseUrl(url);
  if (!parsed) return null;

  let videoId = null;

  if (YOUTUBE_SHORT_HOSTS.has(parsed.hostname)) {
    videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else {
      const [kind, id] = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(kind)) {
        videoId = id;
      }
    }
  }

  if (!videoId) return null;

  const params = new URLSearchParams();
  const start = parsed.searchParams.get('start') ?? parseTime(parsed.searchParams.get('t'));
  const list = parsed.searchParams.get('list');

  if (start) params.set('start', start);
  if (list) params.set('list', list);

  return {
    videoId,
    params: params.toString() || undefined,
  };
}

function youtubeEmbed(url, context) {
  const youtube = getYouTubeIdAndParams(url);
  if (!youtube) return null;

  context.components.add('YouTubeEmbed');

  return mdxElement('YouTubeEmbed', {
    videoId: youtube.videoId,
    params: youtube.params,
  });
}

function getCodeSandboxId(url) {
  const parsed = parseUrl(url);
  if (!parsed || !CODESANDBOX_HOSTS.has(parsed.hostname)) return null;

  const [kind, sandboxId] = parsed.pathname.split('/').filter(Boolean);
  if (!['s', 'embed'].includes(kind) || !sandboxId) return null;

  return sandboxId;
}

function codeSandboxEmbed(url, context) {
  const sandboxId = getCodeSandboxId(url);
  if (!sandboxId) return null;

  context.components.add('CodeSandboxEmbed');

  return mdxElement('CodeSandboxEmbed', { sandboxId });
}

function getTweetUrl(url) {
  const parsed = parseUrl(url);
  if (!parsed || !TWITTER_HOSTS.has(parsed.hostname)) return null;

  const parts = parsed.pathname.split('/').filter(Boolean);
  const statusIndex = parts.findIndex((part) => part === 'status' || part === 'statuses');
  const statusId = statusIndex >= 0 ? parts[statusIndex + 1] : null;

  if (!statusId || !/^\d+$/.test(statusId)) return null;

  return `https://twitter.com/${parts[0]}/status/${statusId}`;
}

function twitterEmbed(url, context) {
  const tweetUrl = getTweetUrl(url);
  if (!tweetUrl) return null;

  context.components.add('TweetEmbed');
  context.components.add('TwitterWidgetsScript');
  context.hasTweet = true;

  return mdxElement('TweetEmbed', { url: tweetUrl });
}

function giphyEmbed(url, context) {
  const query = url.replace(/^giphy:/, '').trim();
  if (!query) return null;

  context.components.add('GiphyEmbed');

  return mdxElement('GiphyEmbed', {
    query: query.replaceAll('_', ' '),
  });
}

function embedForUrl(url, context) {
  if (!url) return null;
  if (url.startsWith('giphy:')) return giphyEmbed(url, context);

  return youtubeEmbed(url, context) ?? codeSandboxEmbed(url, context) ?? twitterEmbed(url, context);
}

function getStandaloneUrl(node) {
  if (!node || node.type !== 'paragraph' || !Array.isArray(node.children)) return null;

  if (node.children.length !== 1) return null;

  const [child] = node.children;
  if (child.type === 'text') return child.value.trim();
  if (child.type === 'link') return child.url.trim();
  if (child.type === 'image') return child.url.trim();

  return null;
}

function transformNode(node, context) {
  if (!node || typeof node !== 'object') return node;

  if (node.type === 'image') {
    return embedForUrl(node.url, context) ?? node;
  }

  const standaloneUrl = getStandaloneUrl(node);
  if (standaloneUrl) {
    return embedForUrl(standaloneUrl, context) ?? node;
  }

  if (Array.isArray(node.children)) {
    node.children = node.children.map((child) => transformNode(child, context));
  }

  return node;
}

function importDeclaration(names, source) {
  const specifiers = names.map((name) => ({
    type: 'ImportSpecifier',
    imported: { type: 'Identifier', name },
    local: { type: 'Identifier', name },
  }));

  return {
    type: 'mdxjsEsm',
    value: `import { ${names.join(', ')} } from '${source}';`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers,
            source: { type: 'Literal', value: source, raw: JSON.stringify(source) },
          },
        ],
      },
    },
  };
}

function injectComponentImports(tree, file, componentNames, options) {
  if (!file.path || componentNames.size === 0) return;

  const importsBySource = new Map();

  for (const componentName of componentNames) {
    const source = importSource(file.path, componentPath(componentName, options));
    const names = importsBySource.get(source) ?? [];
    names.push(componentName);
    importsBySource.set(source, names);
  }

  const imports = [...importsBySource.entries()].map(([source, names]) =>
    importDeclaration(names.sort(), source)
  );

  tree.children.unshift(...imports);
}

function hasFrontmatter(tree) {
  return tree.children.some((node) => node.type === 'yaml' || node.type === 'toml');
}

export function remarkSwizecEmbeds(options = {}) {
  return (tree, file) => {
    file.data.swizecHasFrontmatter = hasFrontmatter(tree);

    const context = {
      components: new Set(),
      hasTweet: false,
    };

    transformNode(tree, context);

    if (context.hasTweet) {
      tree.children.push(mdxElement('TwitterWidgetsScript'));
    }

    injectComponentImports(tree, file, context.components, options);
  };
}

function routePathForFile(filePath, appDir) {
  const appPath = toPosix(new URL(appDir, import.meta.url).pathname);
  const relativePath = path.posix.relative(appPath, toPosix(filePath));
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.pop();

  if (!fileName) return '/';

  if (!/^page\.mdx?$/.test(fileName) && !/^index\.mdx?$/.test(fileName)) {
    parts.push(fileName.replace(/\.mdx?$/, ''));
  }

  const routeParts = parts.filter((part) => !part.startsWith('(') && !part.startsWith('@'));
  return `/${routeParts.join('/')}`.replace(/\/$/, '') || '/';
}

function hasMetadataExport(tree) {
  return tree.body.some((node) => {
    if (node.type !== 'ExportNamedDeclaration') return false;

    if (node.declaration?.type === 'VariableDeclaration') {
      return node.declaration.declarations.some(
        (declaration) => declaration.id?.type === 'Identifier' && declaration.id.name === 'metadata'
      );
    }

    return node.specifiers?.some((specifier) => specifier.exported?.name === 'metadata');
  });
}

function hasFrontmatterExport(tree) {
  return tree.body.some((node) => {
    if (node.type !== 'ExportNamedDeclaration') return false;
    if (node.declaration?.type !== 'VariableDeclaration') return false;

    return node.declaration.declarations.some(
      (declaration) => declaration.id?.type === 'Identifier' && declaration.id.name === 'frontmatter'
    );
  });
}

function metadataImport(source) {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: 'metadataFromFrontmatter' },
        local: { type: 'Identifier', name: 'metadataFromFrontmatter' },
      },
    ],
    source: { type: 'Literal', value: source, raw: JSON.stringify(source) },
  };
}

function metadataExport(routePath) {
  return {
    type: 'ExportNamedDeclaration',
    declaration: {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name: 'metadata' },
          init: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'metadataFromFrontmatter' },
            arguments: [
              { type: 'Identifier', name: 'frontmatter' },
              { type: 'Literal', value: routePath, raw: JSON.stringify(routePath) },
            ],
            optional: false,
          },
        },
      ],
    },
    specifiers: [],
    source: null,
  };
}

export function recmaFrontmatterMetadata(options = {}) {
  return (tree, file) => {
    if (!file.path) return;
    if (!file.data.swizecHasFrontmatter) return;
    if (!hasFrontmatterExport(tree) || hasMetadataExport(tree)) return;

    const metadataFile = new URL(options.metadataModule ?? './app/mdx-metadata.ts', import.meta.url)
      .pathname;
    const source = importSource(file.path, metadataFile);
    const routePath = routePathForFile(file.path, options.appDir ?? './app/');

    tree.body.unshift(metadataImport(source));
    tree.body.push(metadataExport(routePath));
  };
}
