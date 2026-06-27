import { allPages } from 'content-collections';

export const metadata = { title: 'Blog' };

export default function BlogIndex() {
  const posts = allPages
    .filter((p) => p._meta.path.startsWith('blog/'))
    .sort((a, b) => {
      const da = a.published ?? a.publishedAt ?? '';
      const db = b.published ?? b.publishedAt ?? '';
      return db.localeCompare(da);
    });

  return (
    <main>
      <h1>Blog ({posts.length} posts)</h1>
      {posts.map((post) => (
        <div key={post._meta.path}>
          <h2>
            <a href={`/${post._meta.path.replace(/\/index$/, '')}`}>{post.title}</a>
          </h2>
          {post.description && <p>{post.description}</p>}
        </div>
      ))}
    </main>
  );
}
