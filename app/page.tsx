export const metadata = { title: 'Home' };

export default function Home() {
  return (
    <main>
      <h1>Welcome to timber.js</h1>
      <p>Pages are loaded from <code>pages/</code> via content collections.</p>
      <ul>
        <li><a href="/hello-world">Hello from content collections</a></li>
        <li><a href="/example">My favorite example article</a></li>
        <li><a href="/blog/hello">MDX blog page (app/ routing)</a></li>
      </ul>
    </main>
  );
}
