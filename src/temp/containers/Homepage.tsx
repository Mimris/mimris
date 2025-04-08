import Link from 'next/link';

export function HomePage() {
  return (
    <div>
      <h1>Hello</h1>
      <Link href="/people">People </Link>
      <hr />
      <Link href="/vehicles">Vehicles </Link>
    </div>
  );
}
