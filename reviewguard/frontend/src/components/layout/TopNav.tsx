"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "DASHBOARD" },
    { href: "/settings", label: "SETTINGS" },
  ];

  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      <Link href="/" className="nav-wordmark" aria-label="ReviewGuard Home">
        ReviewGuard
      </Link>

      <div className="nav-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`ghost-nav-btn ${pathname === item.href ? "active" : ""}`}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <Link href="/connect" className="signal-lime-cta">
        NEW REVIEW
      </Link>
    </nav>
  );
}