"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabaseAnon } from "@/lib/supabase";

interface FavoriteBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
}

export default function Home() {
  const [books, setBooks] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabaseAnon
        .from("favorites")
        .select("id, title, author, cover_url, ol_key")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBooks(data);
      }
      setLoading(false);
    }
    fetchBooks();
  }, []);

  return (
    <div className="sparkle-bg max-w-6xl mx-auto px-6 py-8">
      <div className="page-title-wrapper">
        <h1 className="font-circus text-3xl md:text-5xl text-[#FFD700] mb-2">
          🎪 The Book Circus
        </h1>
      </div>
      <p className="font-body text-[#D8A9E8] mb-8">
        every book your classmates gagged over, all in one place
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="font-body text-[#D8A9E8] text-lg">
            ✨ manifesting your books...
          </p>
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-7xl empty-state-emoji">🎪✨</div>
          <p className="font-display text-2xl text-[#FFD700]">
            the circus tent is empty bestie
          </p>
          <p className="font-body text-[#D8A9E8]">
            somebody needs to add a book before this gets embarrassing
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-full bg-[#FF69B4] px-8 py-3 font-body text-sm text-white font-semibold transition-colors hover:bg-[#FF1493]"
          >
            be the main character — go search
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => {
            const bookPath = book.ol_key.startsWith("/")
              ? book.ol_key.slice(1)
              : book.ol_key;

            return (
              <Link
                key={book.id}
                href={`/book/${bookPath}`}
                className="book-card flex flex-col"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
