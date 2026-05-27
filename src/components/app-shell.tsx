import Link from "next/link";

interface AppShellProps {
  children: React.ReactNode;
  backHref?: string;
  flush?: boolean;
}

export function AppShell({ children, backHref, flush = false }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <header
        className={`sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-md ${flush ? "px-0" : "px-4"}`}
      >
        <div className={`flex h-14 items-center ${flush ? "pl-3" : ""}`}>
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
      <main className={flush ? "flex-1 p-0" : "flex-1 px-4 py-6"}>{children}</main>
    </div>
  );
}
