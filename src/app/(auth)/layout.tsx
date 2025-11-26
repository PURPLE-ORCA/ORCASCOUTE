export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="mb-8 text-center">
        <div className="mb-2 text-6xl">
          <img
            src="/img/orcaLogo.png"
            alt="OrcaScout Logo"
            width={100}
            height={100}
          />
        </div>
        <h1 className="font-bold text-3xl">OrcaScout</h1>
        <p className="text-muted-foreground">Job hunting assistant & tracker</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
