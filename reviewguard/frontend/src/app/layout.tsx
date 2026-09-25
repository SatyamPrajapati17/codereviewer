import type { Metadata } from "next";
import { Inter_Tight, PT_Serif, JetBrains_Mono } from "next/font/google";
import "../styles/globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pt-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReviewGuard — AI Code Review Assistant",
  description: "Five parallel AI reviewers for every PR. Security, correctness, performance, testing, maintainability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${ptSerif.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--surface-canvas)] text-[var(--color-bone)] antialiased">
        {children}
      </body>
    </html>
  );
}