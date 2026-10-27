import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#F15C00]">404</p>
      <h1 className="mt-2 text-4xl text-[#1A4A16]">This page is not on the menu</h1>
      <p className="mt-3 text-[#6A5A4E]">The link may be old, or the tracking token may have been replaced.</p>
      <Link href="/" className="btn btn-accent mt-6 w-fit">Back home</Link>
    </main>
  );
}
