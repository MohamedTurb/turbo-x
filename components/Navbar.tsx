"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Role } from "@/lib/types";

interface NavbarProps {
  role: Role;
  name: string;
  email: string;
}

const studentLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/assignments", label: "Assignments" },
  { href: "/grades", label: "Grades" },
];

const adminLinks = [{ href: "/admin", label: "Admin" }];

export default function Navbar({ role, name, email }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const links = role === "admin" ? adminLinks : studentLinks;

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href={role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              TURBOX
            </span>
            <span className="rounded-full border border-crimson/40 bg-crimson/10 px-2 py-0.5 text-[10px] font-medium text-crimson-bright">
              {role === "admin" ? "ADMIN" : "STUDENT"}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-neutral-500">{email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="focus-ring rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-crimson/50 hover:text-white disabled:opacity-60"
          >
            {loggingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-5 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
