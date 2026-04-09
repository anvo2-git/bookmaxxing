"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";

const links = [
  { href: "/", label: "The Circus" },
  { href: "/search", label: "Hunt" },
  { href: "/my-books", label: "My Shelf" },
];

export default function Nav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#FF69B4]/20 bg-[#1A0A2E]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-display text-2xl font-bold text-[#FFD700] transition-colors hover:text-[#FF69B4]"
        >
          bookmaxxing 101 ✨
        </Link>

        <div className="flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {links.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`font-body text-sm tracking-wide transition-colors ${
                      isActive
                        ? "font-medium text-[#FF1493] underline underline-offset-4 decoration-[#FFD700]"
                        : "text-[#DDA0DD] hover:text-[#FF69B4]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isSignedIn ? (
            <div className="rounded-full ring-2 ring-[#FF69B4]/50 ring-offset-2 ring-offset-[#1A0A2E]">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="rounded-full bg-[#FF1493] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#FF69B4]">
                sign in bestie
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
