import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
  backHref?: string;
}

export function AppShell({ children, backHref }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 px-6 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center">
          {backHref ? (
            <Link
              href={backHref}
              className="cursor-pointer text-sm font-medium text-zinc-100 transition-colors duration-200 hover:text-white"
            >
              plsfix
            </Link>
          ) : (
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              plsfix
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl flex-1 p-6">{children}</main>
    </div>
  );
}
