import Link from "next/link";

function WarningTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      shapeRendering="geometricPrecision"
    >
      <path
        d="M16 2.5L30 28.5H2L16 2.5Z"
        fill="#FFE92E"
        stroke="#6E6E6E"
        strokeWidth="2"
      />
      <rect x="14.5" y="10" width="3" height="10" fill="#111111" rx="1" />
      <rect x="14.5" y="22.5" width="3" height="3.5" fill="#111111" rx="1" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#121426] via-[#161c34] to-[#0c1022]">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.02),rgba(255,255,255,0.02)_1px,transparent_1px,transparent_4px)]" />

      <div className="absolute left-6 top-6 hidden sm:flex">
        <div className="flex w-20 flex-col items-center gap-1 text-center">
          <WarningTriangleIcon className="h-9 w-9 drop-shadow-[1px_1px_0_rgba(0,0,0,0.55)]" />
          <span className="bg-[#000080] px-1 text-[11px] text-white">
            plsfix.exe
          </span>
        </div>
      </div>

      <section className="mx-auto flex min-h-[100svh] w-full max-w-5xl items-start justify-center px-4 pb-12 pt-20 sm:min-h-screen sm:items-center sm:px-6 sm:py-16">
        <div className="w-full max-w-2xl border-2 border-[#d4d4d4] bg-[#c0c0c0] shadow-[8px_8px_0_#0d0d0d]">
          <div className="flex items-center justify-between bg-[#000080] px-3 py-1">
            <span className="text-sm font-bold tracking-tight text-white">
              WARNING
            </span>
            <span className="grid h-5 w-5 place-items-center border border-[#8c8c8c] bg-[#c0c0c0] text-xs text-black shadow-[inset_-1px_-1px_0_#595959,inset_1px_1px_0_#ffffff]">
              X
            </span>
          </div>

          <div className="flex gap-4 bg-[#d4d0c8] p-6 text-black">
            <WarningTriangleIcon className="h-10 w-10 shrink-0" />
            <div className="space-y-2 pl-2">
              <h1 className="text-2xl font-bold">plsfix</h1>
              <p className="max-w-xl text-[15px] leading-6">
                Logging changes has never been easier.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-[#d4d0c8] px-6 pb-6">
            <Link
              href="/login"
              className="inline-flex h-10 min-w-28 cursor-pointer items-center justify-center border border-[#7f7f7f] bg-[#c0c0c0] px-5 text-sm font-semibold text-black shadow-[inset_-1px_-1px_0_#4f4f4f,inset_1px_1px_0_#ffffff] transition hover:bg-[#cdcdcd] active:translate-y-px"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
