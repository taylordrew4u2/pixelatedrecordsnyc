import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <img
        src="/assets/logo-light.png"
        alt="Pixelated Records"
        width="260"
        height="76"
      />
      <p className="eyebrow">404 · WRONG SIDE</p>
      <h1>
        Let’s flip
        <br />
        that record.
      </h1>
      <p>This page isn’t here. There’s more waiting inside.</p>
      <Link className="button primary" href="/">
        Back to Pixelated ↗
      </Link>
    </main>
  );
}
