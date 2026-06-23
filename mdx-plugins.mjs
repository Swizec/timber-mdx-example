const YOUTUBE_WATCH_RE = /^https:\/\/www\.youtube\.com\/watch\?(.+)$/;
const YOUTUBE_SHORT_RE = /^https:\/\/youtu\.be\/([^?&#/]+)(?:[?&#].*)?$/;
const CODESANDBOX_RE = /^https:\/\/codesandbox\.io\/s\/([^?#/]+)(?:[?#].*)?$/;
const TWITTER_STATUS_RE =
  /^https:\/\/(?:twitter\.com|x\.com)\/([^/]+)\/status\/([0-9]+)(?:[?#].*)?$/;

function mdxAttribute(name, value = null) {
  return { type: 'mdxJsxAttribute', name, value };
}

function mdxElement(name, attributes = {}, children = []) {
  return {
    type: 'mdxJsxFlowElement',
    name,
    attributes: Object.entries(attributes).map(([key, value]) => mdxAttribute(key, value)),
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

function getParagraphText(node) {
  if (!node || node.type !== 'paragraph' || !Array.isArray(node.children)) {
    return null;
  }

  if (node.children.length === 1) {
    const [child] = node.children;
    if (child.type === 'text') return child.value.trim();
    if (child.type === 'link') return child.url.trim();
  }

  if (node.children.every((child) => child.type === 'text')) {
    return node.children.map((child) => child.value).join('').trim();
  }

  return null;
}

function getYoutubeId(url) {
  const shortMatch = url.match(YOUTUBE_SHORT_RE);
  if (shortMatch) return shortMatch[1];

  const watchMatch = url.match(YOUTUBE_WATCH_RE);
  if (!watchMatch) return null;

  const params = new URLSearchParams(watchMatch[1]);
  return params.get('v');
}

function youtubeEmbed(url) {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;

  return mdxElement(
    'div',
    { className: 'swizec-embed swizec-embed-youtube' },
    [
      mdxElement('iframe', {
        src: `https://www.youtube.com/embed/${videoId}`,
        title: 'YouTube video',
        loading: 'lazy',
        allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
        allowFullScreen: null,
      }),
    ]
  );
}

function codeSandboxEmbed(url) {
  const match = url.match(CODESANDBOX_RE);
  if (!match) return null;

  return mdxElement(
    'div',
    { className: 'swizec-embed swizec-embed-codesandbox' },
    [
      mdxElement('iframe', {
        src: `https://codesandbox.io/embed/${match[1]}?fontsize=14&hidenavigation=1&theme=dark`,
        title: 'CodeSandbox embed',
        loading: 'lazy',
        allow:
          'accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking',
        sandbox:
          'allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts',
      }),
    ]
  );
}

function twitterEmbed(url) {
  const match = url.match(TWITTER_STATUS_RE);
  if (!match) return null;

  return mdxElement(
    'blockquote',
    { className: 'swizec-embed swizec-embed-tweet' },
    [
      paragraph([text(`Tweet by @${match[1]}`)]),
      paragraph([link(url, [text(url)])]),
    ]
  );
}

function giphyEmbed(giphyUrl) {
  const query = giphyUrl.replace(/^giphy:/, '').trim();
  if (!query) return null;

  const search = encodeURIComponent(query.replaceAll('_', ' '));

  return mdxElement(
    'figure',
    { className: 'swizec-embed swizec-embed-giphy' },
    [
      paragraph([
        link(`https://giphy.com/search/${search}`, [text(`Giphy: ${query.replaceAll('_', ' ')}`)]),
      ]),
    ]
  );
}

function embedForUrl(url) {
  if (!url) return null;
  if (url.startsWith('giphy:')) return giphyEmbed(url);

  return youtubeEmbed(url) ?? codeSandboxEmbed(url) ?? twitterEmbed(url);
}

function transformNode(node) {
  if (!node || typeof node !== 'object') return node;

  if (node.type === 'image') {
    return embedForUrl(node.url) ?? node;
  }

  if (node.type === 'paragraph' && Array.isArray(node.children) && node.children.length === 1) {
    const [child] = node.children;
    if (child.type === 'image') {
      return embedForUrl(child.url) ?? node;
    }
  }

  const paragraphText = getParagraphText(node);
  if (paragraphText) {
    return embedForUrl(paragraphText) ?? node;
  }

  if (Array.isArray(node.children)) {
    node.children = node.children.map(transformNode);
  }

  return node;
}

export function remarkSwizecEmbeds() {
  return (tree) => {
    transformNode(tree);
  };
}
