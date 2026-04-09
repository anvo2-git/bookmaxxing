"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { createClerkSupabaseClient } from "@/lib/supabase";
import {
  getLocalFavorites,
  removeLocalFavorite,
  clearLocalFavorites,
  type LocalFavorite,
} from "@/lib/local-favorites";

interface FavoriteBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
}

export default function MyBooksPage() {
  const { getToken, userId } = useAuth();
  const [books, setBooks] = useState<FavoriteBook[]>([]);
  const [localBooks, setLocalBooks] = useState<LocalFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!userId;

  const syncAndFetch = useCallback(async () => {
    if (!userId) return;

    const supabase = createClerkSupabaseClient(() =>
      getToken({ template: "supabase" }),
    );

    // Check localStorage for books to sync
    const savedLocally = getLocalFavorites();
    if (savedLocally.length > 0) {
      // Sync each local favorite to Supabase
      for (const book of savedLocally) {
        try {
          await supabase.from("favorites").upsert(
            {
              user_id: userId,
              title: book.title,
              author: book.author,
              cover_url: book.cover_url,
              ol_key: book.ol_key,
            },
            { onConflict: "user_id,ol_key" },
          );
        } catch {
          // Ignore errors for individual inserts
        }
      }
      clearLocalFavorites();
    }

    // Fetch user's favorites from Supabase
    const { data, error } = await supabase
      .from("favorites")
      .select("id, title, author, cover_url, ol_key")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBooks(data);
    }
    setLoading(false);
  }, [userId, getToken]);

  // Logged-in mode: sync localStorage then fetch from Supabase
  useEffect(() => {
    if (!userId) return;
    syncAndFetch();
  }, [userId, syncAndFetch]);

  // Guest mode: load from localStorage
  useEffect(() => {
    if (userId) return;
    setLocalBooks(getLocalFavorites());
    setLoading(false);
  }, [userId]);

  async function removeSupabaseBook(bookId: string) {
    const supabase = createClerkSupabaseClient(() =>
      getToken({ template: "supabase" }),
    );

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", bookId);

    if (!error) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    }
  }

  function removeLocal(olKey: string) {
    removeLocalFavorite(olKey);
    setLocalBooks((prev) => prev.filter((b) => b.ol_key !== olKey));
  }

  const displayBooks = isLoggedIn ? books : [];
  const displayLocalBooks = !isLoggedIn ? localBooks : [];
  const isEmpty = isLoggedIn
    ? books.length === 0
    : localBooks.length === 0;

  return (
    <div className="sparkle-bg max-w-6xl mx-auto px-6 py-8">
      <div className="page-title-wrapper">
        <h1 className="font-circus text-3xl md:text-5xl text-[#FFD700] mb-2">
          💅 My Shelf (She&apos;s Iconic)
        </h1>
      </div>
      <p className="font-body text-[#D8A9E8] mb-8">
        ur personal curated collection. main character energy only.
      </p>

      {/* Guest sign-in banner */}
      {!isLoggedIn && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#FF69B4] to-[#7B2D8E] p-6">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="text-4xl">🔒</span>
            <h2 className="font-display text-xl text-[#FFD700] font-semibold">
              bestie, sign in or these books vanish
            </h2>
            <p className="font-body text-[#E8D5F5] max-w-md">
              your collection lives in this browser rn. sign in to save it
              forever and flex on your classmates.
            </p>
            <SignInButton mode="modal">
              <button className="mt-2 rounded-full bg-[#FF69B4] px-8 py-3 font-body text-sm text-white font-semibold transition-colors hover:bg-[#FF1493] border-2 border-white/30">
                sign in & save forever
              </button>
            </SignInButton>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="font-body text-[#D8A9E8] text-lg">
            🔮 summoning your collection...
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-7xl empty-state-emoji">🪞💅</div>
          <p className="font-display text-2xl text-[#FFD700]">
            {isLoggedIn
              ? "not a single book? in THIS economy?"
              : "your shelf is tragically empty bestie"}
          </p>
          <p className="font-body text-[#D8A9E8]">
            {isLoggedIn
              ? "ur bookshelf is giving... nothing. let's fix that."
              : "find some books and start building your iconic collection."}
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-full bg-[#FF69B4] px-8 py-3 font-body text-sm text-white font-semibold transition-colors hover:bg-[#FF1493]"
          >
            go find something iconic
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {/* Logged-in: Supabase books */}
          {isLoggedIn &&
            displayBooks.map((book) => {
              const bookPath = book.ol_key.startsWith("/")
                ? book.ol_key.slice(1)
                : book.ol_key;

              return (
                <div
                  key={book.id}
                  className="book-card flex flex-col relative group"
                >
                  <button
                    onClick={() => removeSupabaseBook(book.id)}
                    className="absolute top-2 right-2 z-10 rounded-full border border-[#FF69B4] bg-transparent px-3 py-1 font-body text-xs text-[#FF69B4] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#FF69B4] hover:text-white"
                    aria-label={`Remove ${book.title}`}
                  >
                    unstan
                  </button>

                  <Link
                    href={`/book/${bookPath}`}
                    className="flex flex-col flex-1"
                  >
                    <div className="relative aspect-[2/3] bg-[#2D1B4E]">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full p-3">
                          <p className="font-display text-sm text-[#FFD700] text-center line-clamp-4">
                            {book.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <p className="font-display font-semibold text-[#FFF0F5] line-clamp-2">
                        {book.title}
                      </p>
                      <p className="font-body text-sm text-[#D8A9E8]">
                        {book.author}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}

          {/* Guest: localStorage books */}
          {!isLoggedIn &&
            displayLocalBooks.map((book) => {
              const bookPath = book.ol_key.startsWith("/")
                ? book.ol_key.slice(1)
                : book.ol_key;

              return (
                <div
                  key={book.ol_key}
                  className="book-card flex flex-col relative group"
                >
                  <button
                    onClick={() => removeLocal(book.ol_key)}
                    className="absolute top-2 right-2 z-10 rounded-full border border-[#FF69B4] bg-transparent px-3 py-1 font-body text-xs text-[#FF69B4] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#FF69B4] hover:text-white"
                    aria-label={`Remove ${book.title}`}
                  >
                    unstan
                  </button>

                  <Link
                    href={`/book/${bookPath}`}
                    className="flex flex-col flex-1"
                  >
                    <div className="relative aspect-[2/3] bg-[#2D1B4E]">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full p-3">
                          <p className="font-display text-sm text-[#FFD700] text-center line-clamp-4">
                            {book.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <p className="font-display font-semibold text-[#FFF0F5] line-clamp-2">
                        {book.title}
                      </p>
                      <p className="font-body text-sm text-[#D8A9E8]">
                        {book.author}
                      </p>
                    </div>
                  </Link>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
