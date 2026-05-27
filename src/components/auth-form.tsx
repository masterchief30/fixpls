"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AuthFormProps {
  mode: "login" | "signup";
  variant?: "default" | "compact";
}

export function AuthForm({ mode, variant = "default" }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isCompact = variant === "compact";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthCallbackUrl(),
            data: {
              full_name: fullName.trim() || null,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/workspaces");
          router.refresh();
        } else {
          setNotice(
            "Check your email to confirm your account, then log in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/workspaces");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={
        isCompact
          ? "w-full max-w-sm border-white/15 bg-slate-900/55 text-zinc-100 shadow-[0_20px_60px_-24px_rgba(8,15,40,0.9)] backdrop-blur-md"
          : "w-full max-w-md border-white/20 bg-zinc-800/75 text-zinc-100 shadow-[0_24px_85px_-28px_rgba(2,6,23,0.9)] backdrop-blur-md"
      }
    >
      <CardHeader className={isCompact ? "pb-3" : ""}>
        <CardTitle
          className={
            isCompact
              ? "text-2xl font-semibold tracking-tight text-white"
              : "text-3xl font-semibold tracking-tight text-white"
          }
        >
          {mode === "login" ? "Log in" : "Sign up"}
        </CardTitle>
        <CardDescription className={isCompact ? "text-sm text-zinc-300" : "text-zinc-300"}>
          {mode === "login"
            ? "Enter your email and password to access your workspaces."
            : "Create an account to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={isCompact ? "space-y-3" : "space-y-4"}>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-zinc-200">
                Name
              </Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={
                  isCompact
                    ? "h-10 border-white/15 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/35 focus-visible:ring-white/20"
                    : "h-11 border-white/20 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/40 focus-visible:ring-white/20"
                }
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={
                isCompact
                  ? "h-10 border-white/15 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/35 focus-visible:ring-white/20"
                  : "h-11 border-white/20 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/40 focus-visible:ring-white/20"
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={
                isCompact
                  ? "h-10 border-white/15 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/35 focus-visible:ring-white/20"
                  : "h-11 border-white/20 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-400 focus-visible:border-white/40 focus-visible:ring-white/20"
              }
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}
          {notice && (
            <p className="text-sm text-emerald-300">{notice}</p>
          )}
          <Button
            type="submit"
            className={
              isCompact
                ? "h-10 w-full cursor-pointer !bg-zinc-100 !text-zinc-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:!bg-white hover:!text-zinc-900 hover:shadow-[0_10px_24px_-16px_rgba(255,255,255,0.75)]"
                : "h-11 w-full cursor-pointer !bg-zinc-100 !text-zinc-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:!bg-white hover:!text-zinc-900 hover:shadow-[0_12px_30px_-18px_rgba(255,255,255,0.75)]"
            }
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
