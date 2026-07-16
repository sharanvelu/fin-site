import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fin.dev"),
  title: {
    default: "Fin — run local dev containers, extensible via plugs",
    template: "%s — Fin docs",
  },
  description:
    "Fin is a fast, opinionated, plugin-driven CLI for running local-development Docker containers. One command up: proxy, shared databases, and your app — routed by friendly *.localhost hostnames.",
  keywords: ["fin", "docker", "laravel", "local development", "cli", "traefik", "containers"],
  openGraph: {
    title: "Fin — run local dev containers, extensible via plugs",
    description:
      "A fast, plugin-driven CLI for local-dev Docker containers. One command up: proxy, shared databases, and your app.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-bg text-fg">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
