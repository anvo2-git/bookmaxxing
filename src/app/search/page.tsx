"use client";

import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabase";
import {
  addLocalFavorite,
  isLocalFavorite,
} from "@/lib/local-favorites";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Celebration from "@/components/celebration";

interface BookResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

export default function SearchPage() {
  const { getToken, userId } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const isSaved = useCallback(
    (key: string) => {
      if (userId) return savedKeys.has(key);
      return isLocalFavorite(key);
    },
    [userId, savedKeys],
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`,
      );
      const data = await res.json();
      setResults(data.docs || []);

      // For logged-in users, check which results are already saved
      if (userId) {
        const supabase = createClerkSupabaseClient(() =>
          getToken({ template: "supabase" }),
        );
        const keys = (data.docs || []).map((b: BookResult) => b.key);
        const { data: favs } = await supabase
          .from("favorites")
          .select("ol_key")
          .eq("user_id", userId)
          .in("ol_key", keys);
        if (favs) {
          setSavedKeys(new Set(favs.map((f: { ol_key: string }) => f.ol_key)));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveFavorite(book: BookResult) {
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : null;

    if (userId) {
      // Logged-in: save to Supabase
      const supabase = createClerkSupabaseClient(() =>
        getToken({ template: "supabase" }),
      );

      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        title: book.title,
        author: book.author_name?.[0] ?? "Unknown",
        cover_url: coverUrl,
        ol_key: book.key,
      });

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        setSavedKeys((prev) => new Set(prev).add(book.key));
        setShowCelebration(true);
      }
    } else {
      // Guest: save to localStorage
      addLocalFavorite({
        title: book.title,
        author: book.author_name?.[0] ?? "Unknown",
        cover_url: coverUrl,
        ol_key: book.key,
      });
      // Force re-render by toggling a state update
      setSavedKeys((prev) => new Set(prev).add(book.key));
      setShowCelebration(true);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-8">
      <Celebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
      <h1 className="font-circus text-3xl md:text-4xl text-[#FFD700] mb-2">
        🔍✨ Find Your Next Obsession
      </h1>
      <p className="font-body text-[#D8A9E8] mb-8">
        go on bestie, search for something that will ruin your sleep schedule
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start here bestie, one letter at a time..."
          className="flex-1 rounded-full border border-[#FF69B4]/30 bg-[#2D1B4E] px-5 py-4 font-body text-[#FFF0F5] placeholder:text-[#8B6FA3] outline-none focus:border-[#FF1493] focus:shadow-[0_0_0_2px_#FF1493,0_0_20px_rgba(255,20,147,0.2)] transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#FF1493] text-white font-display font-semibold px-8 py-4 rounded-full hover:bg-[#FF69B4] hover:shadow-[0_0_20px_rgba(255,20,147,0.4)] hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? "hunting..." : "search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {results.map((book) => {
            const saved = isSaved(book.key);
            const detailHref = `/book/${book.key.replace(/^\//, "")}`;
            const author = book.author_name?.[0] ?? "Unknown author";

            return (
              <div key={book.key} className="book-card flex flex-col">
                <Link href={detailHref} className="block">
                  <div className="relative aspect-[2/3] bg-[#2D1B4E] rounded-t-xl overflow-hidden">
                    {book.cover_i ? (
                      <Image
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="font-display text-sm text-[#8B6FA3]">
                          No cover
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3 flex flex-col gap-1 flex-1">
                  <Link href={detailHref}>
                    <p className="font-display font-medium text-sm text-[#FFF0F5] line-clamp-2 hover:text-[#FF69B4] transition-colors">
                      {book.title}
                    </p>
                  </Link>
                  <p className="font-body text-xs text-[#D8A9E8] line-clamp-1">
                    {author}
                  </p>
                  <button
                    onClick={() => saveFavorite(book)}
                    disabled={saved}
                    className={`mt-auto rounded-full font-display text-xs px-4 py-1.5 transition-all ${
                      saved
                        ? "bg-[#FFD700] text-[#1A0A2E]"
                        : "bg-[#FF1493] text-white hover:bg-[#FF69B4] hover:scale-105 hover:shadow-[0_0_15px_rgba(255,20,147,0.3)]"
                    }`}
                  >
                    {saved ? "slayed \u2713" : "\u2728 slay (save)"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hasSearched && results.length === 0 && !loading && (
        <div className="text-center mt-16">
          <p className="text-5xl mb-4">🔍✨</p>
          <p className="font-display text-2xl text-[#FFD700] mb-2">
            type something already
          </p>
          <p className="font-body text-sm text-[#D8A9E8]">
            your next personality trait is waiting
          </p>
        </div>
      )}

      {hasSearched && results.length === 0 && !loading && (
        <div className="text-center mt-16">
          <p className="text-5xl mb-4">💀</p>
          <p className="font-display text-2xl text-[#FFD700] mb-2">
            absolutely zero results. dead.
          </p>
          <p className="font-body text-sm text-[#D8A9E8]">
            try again queen, maybe spell it differently this time
          </p>
        </div>
      )}
    </div>
  );
}
