import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a23] text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_85%_at_14%_100%,rgba(92,128,255,0.42),transparent_58%),radial-gradient(110%_95%_at_42%_16%,rgba(132,178,255,0.45),transparent_64%),radial-gradient(95%_90%_at_86%_44%,rgba(36,64,155,0.52),transparent_66%),linear-gradient(155deg,#040920_0%,#0a1536_45%,#060b26_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-15%] top-[22%] h-[58vh] w-[58vw] rounded-[45%] border border-white/10 bg-gradient-to-br from-sky-200/35 via-blue-300/20 to-indigo-700/10 blur-[1px] rotate-[-18deg]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-[8%] h-[70vh] w-[52vw] rounded-[46%] border border-blue-100/10 bg-gradient-to-bl from-blue-200/20 via-blue-400/18 to-transparent rotate-[22deg]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-24%] left-[25%] h-[44vh] w-[46vw] rounded-[42%] border border-indigo-200/10 bg-gradient-to-tr from-blue-800/35 via-indigo-500/28 to-transparent blur-sm"
      />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <AuthForm mode="login" variant="compact" />
      </div>
    </main>
  );
}
