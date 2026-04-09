"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/lib/supabase";
import {
  addLocalFavorite,
  removeLocalFavorite,
  isLocalFavorite,
} from "@/lib/local-favorites";
import Image from "next/image";
import Link from "next/link";
import Celebration from "@/components/celebration";

interface BookDetails {
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author: { key: string } }[];
}

interface AuthorDetails {
  name: string;
}

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ key: string[] }>;
}) {
  const { key } = use(params);
  const olKey = "/" + key.join("/");

  const { getToken, userId } = useAuth();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [author, setAuthor] = useState<string>("Unknown");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCoverUrl, setSavedCoverUrl] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const getCoverUrl = useCallback(
    (size: "L" | "M" = "L") => {
      if (book?.covers && book.covers.length > 0) {
        return `https://covers.openlibrary.org/b/id/${book.covers[0]}-${size}.jpg`;
      }
      return savedCoverUrl;
    },
    [book, savedCoverUrl],
  );

  const getDescription = useCallback(() => {
    if (!book?.description) return null;
    if (typeof book.description === "string") return book.description;
    if (typeof book.description === "object" && "value" in book.description) {
      return book.description.value;
    }
    return null;
  }, [book]);

  // Fetch book details
  useEffect(() => {
    async function fetchBook() {
      try {
        setLoading(true);
        const res = await fetch(`https://openlibrary.org${olKey}.json`);
        if (!res.ok) throw new Error("Book not found");
        const data: BookDetails = await res.json();
        setBook(data);

        // Fetch author if available
        if (data.authors && data.authors.length > 0) {
          const authorKey = data.authors[0].author.key;
          try {
            const authorRes = await fetch(
              `https://openlibrary.org${authorKey}.json`,
            );
            if (authorRes.ok) {
              const authorData: AuthorDetails = await authorRes.json();
              setAuthor(authorData.name);
            }
          } catch {
            // Author fetch failed, keep default
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load book");
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [olKey]);

  // Check if book is in favorites
  useEffect(() => {
    async function checkFavorite() {
      if (userId) {
        // Logged-in: check Supabase
        const supabase = createClerkSupabaseClient(() =>
          getToken({ template: "supabase" }),
        );

        const { data } = await supabase
          .from("favorites")
          .select("ol_key, cover_url")
          .eq("user_id", userId)
          .eq("ol_key", olKey)
          .maybeSingle();

        if (data) {
          setIsFavorite(true);
          if (data.cover_url) {
            setSavedCoverUrl(data.cover_url);
          }
        }
      } else {
        // Guest: check localStorage
        setIsFavorite(isLocalFavorite(olKey));
      }
    }

    checkFavorite();
  }, [userId, olKey, getToken]);

  async function toggleFavorite() {
    if (!book) return;
    setSaving(true);

    try {
      if (userId) {
        // Logged-in: use Supabase
        const supabase = createClerkSupabaseClient(() =>
          getToken({ template: "supabase" }),
        );

        if (isFavorite) {
          const { error: deleteError } = await supabase
            .from("favorites")
            .delete()
            .eq("ol_key", olKey)
            .eq("user_id", userId);

          if (deleteError) {
            alert(`Error: ${deleteError.message}`);
          } else {
            setIsFavorite(false);
          }
        } else {
          const coverUrl = getCoverUrl("M");

          const { error: insertError } = await supabase
            .from("favorites")
            .insert({
              user_id: userId,
              title: book.title,
              author: author,
              cover_url: coverUrl,
              ol_key: olKey,
            });

          if (insertError) {
            alert(`Error: ${insertError.message}`);
          } else {
            setIsFavorite(true);
            setShowCelebration(true);
          }
        }
      } else {
        // Guest: use localStorage
        if (isFavorite) {
          removeLocalFavorite(olKey);
          setIsFavorite(false);
        } else {
          const coverUrl = getCoverUrl("M");
          addLocalFavorite({
            title: book.title,
            author: author,
            cover_url: coverUrl,
            ol_key: olKey,
          });
          setIsFavorite(true);
          setShowCelebration(true);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl animate-spin" style={{ animationDuration: "2s" }}>
            🔮
          </span>
          <p className="font-display text-xl text-[#FFD700] animate-pulse">
            consulting the oracle...
          </p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-5xl">💀</p>
        <p className="font-display text-2xl text-[#FFD700]">
          this book doesn&apos;t exist bestie. it&apos;s giving 404.
        </p>
        <Link
          href="/search"
          className="font-body text-sm text-[#D8A9E8] hover:text-[#FF69B4] transition-colors"
        >
          &larr; back to the hunt
        </Link>
      </div>
    );
  }

  const coverUrl = getCoverUrl("L");
  const description = getDescription();
  const subjects = book.subjects?.slice(0, 8) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 w-full">
      <Celebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
      {/* Back link */}
      <Link
        href="/search"
        className="font-body text-[#D8A9E8] hover:text-[#FF69B4] transition-colors"
      >
        &larr; back to the hunt
      </Link>

      {/* Two-column layout */}
      <div className="mt-6 flex flex-col md:flex-row gap-8">
        {/* Cover image */}
        <div className="w-full md:w-80 shrink-0">
          {coverUrl ? (
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#2D1B4E] shadow-[0_0_30px_rgba(255,20,147,0.2)]">
              <Image
                src={coverUrl}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
          ) : (
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#2D1B4E] shadow-[0_0_30px_rgba(255,20,147,0.2)] flex items-center justify-center">
              <span className="font-display text-xl text-[#8B6FA3]">
                No Cover
              </span>
            </div>
          )}
        </div>

        {/* Book details */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="font-circus text-2xl md:text-4xl text-[#FFD700]">
            {book.title}
          </h1>

          <p className="font-display text-xl text-[#FF69B4]">{author}</p>

          {book.first_publish_date && (
            <p className="font-body text-sm text-[#8B6FA3]">
              first published {book.first_publish_date}
            </p>
          )}

          {/* Save / Remove button */}
          <button
            onClick={toggleFavorite}
            disabled={saving}
            className={
              isFavorite
                ? "w-fit rounded-full font-display font-semibold px-8 py-3 border-2 border-[#FF1493] text-[#FF1493] hover:bg-[#FF1493]/15 transition-all disabled:opacity-50"
                : "w-fit rounded-full font-display font-semibold px-8 py-3 bg-[#FF1493] text-white hover:bg-[#FF69B4] hover:scale-105 hover:shadow-[0_0_20px_rgba(255,20,147,0.4)] transition-all disabled:opacity-50"
            }
          >
            {saving
              ? "working on it..."
              : isFavorite
                ? "unstan"
                : "\u2728 slay (save)"}
          </button>

          {/* Description */}
          {description && (
            <div>
              <h2 className="font-display text-lg text-[#FFD700] mb-2">
                the tea on this book:
              </h2>
              <p className="font-body text-[#FFF0F5] leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-[#FFD700] mb-2">
                she&apos;s giving:
              </h2>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <span
                    key={subject}
                    className="font-body text-xs bg-[#3D2560] text-[#DDA0DD] px-3 py-1.5 rounded-full border border-[#FF69B4]/20"
                  >
                    ⭐ {subject}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
