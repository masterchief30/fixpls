import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const resolvedSiteUrl = (() => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.plsfix.app";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
})();

export const metadata: Metadata = {
  metadataBase: new URL(resolvedSiteUrl),
  title: "plsfix — Client Feedback & Bug Tracking",
  description: "Feedback and bugs, shared with clients.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "plsfix — Client Feedback & Bug Tracking",
    description: "Feedback and bugs, shared with clients.",
    url: resolvedSiteUrl,
    siteName: "plsfix",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "plsfix",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "plsfix — Client Feedback & Bug Tracking",
    description: "Feedback and bugs, shared with clients.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
