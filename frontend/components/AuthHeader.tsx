"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

const connexionClassName =
  "rounded-full border border-zinc-700/80 bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800";

export function AuthHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="flex h-12 shrink-0 items-center justify-end border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6">
      {!isLoaded ? (
        <div
          className="h-8 w-24 animate-pulse rounded-full bg-zinc-800"
          aria-hidden
        />
      ) : isSignedIn ? (
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      ) : (
        <SignInButton mode="modal">
          <button type="button" className={connexionClassName}>
            Connexion
          </button>
        </SignInButton>
      )}
    </header>
  );
}
