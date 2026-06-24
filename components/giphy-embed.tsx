type GiphyEmbedProps = {
  query: string;
};

export function GiphyEmbed({ query }: GiphyEmbedProps) {
  const href = `https://giphy.com/search/${encodeURIComponent(query)}`;

  return (
    <figure className="swizec-embed swizec-embed-giphy">
      <a href={href}>Giphy: {query}</a>
    </figure>
  );
}
