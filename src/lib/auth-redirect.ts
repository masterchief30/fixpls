const DEFAULT_LOCAL_CALLBACK = "http://localhost:3000/auth/callback";

function normalizeSiteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getAuthCallbackUrl(): string {
  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (configured) {
    return `${configured}/auth/callback`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }

  return DEFAULT_LOCAL_CALLBACK;
}
