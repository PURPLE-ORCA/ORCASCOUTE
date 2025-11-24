export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            <span className="font-bold text-xl">OrcaScout</span>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
