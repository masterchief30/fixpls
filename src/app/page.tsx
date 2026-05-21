import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent"
      />
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-zinc-800/75 p-8 text-center shadow-[0_24px_85px_-28px_rgba(2,6,23,0.9)] backdrop-blur-md md:p-12">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            plsfix
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-300 md:text-lg">
            A clean place to collect bugs, feedback, and feature requests with
            clients.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/login"
              className={buttonVariants({
                variant: "default",
                className:
                  "h-12 px-7 text-base !bg-zinc-100 !text-zinc-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:!bg-white hover:!text-zinc-900 hover:shadow-[0_10px_30px_-12px_rgba(255,255,255,0.8)]",
              })}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({
                variant: "outline",
                className:
                  "h-12 border-white/20 bg-white/5 px-7 text-base text-zinc-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/12 hover:text-white hover:shadow-[0_10px_30px_-18px_rgba(255,255,255,0.35)]",
              })}
            >
              Sign up
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
