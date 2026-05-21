import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-800 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent"
      />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
