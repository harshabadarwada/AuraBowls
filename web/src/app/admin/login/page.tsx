export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <img src="/aura-logo.png" alt="AuraBowls" className="mb-4 h-40 w-auto self-start" />
      <h1 className="text-3xl text-[#1A4A16]">Admin</h1>
      <p className="mt-2 text-sm text-[#6A5A4E]">Owner sign-in. Customer orders do not use this password.</p>
      {error ? <p className="mt-4 rounded-xl bg-[#fff1e8] px-3 py-2 text-sm" role="alert">{error === "1" ? "Those details were not accepted." : error}</p> : null}
      <form className="store-card mt-5 space-y-3 p-5" method="post" action="/api/admin/login">
        <label className="block text-sm">Email<input className="field mt-1" name="email" type="email" autoComplete="username" required /></label>
        <label className="block text-sm">Password<input className="field mt-1" name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn btn-accent w-full" type="submit">Sign in</button>
      </form>
    </main>
  );
}
