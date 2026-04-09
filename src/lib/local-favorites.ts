export interface LocalFavorite {
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
  created_at: string; // ISO string
}

export function getLocalFavorites(): LocalFavorite[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("bookmaxxing-favorites");
  return stored ? JSON.parse(stored) : [];
}

export function addLocalFavorite(
  book: Omit<LocalFavorite, "created_at">,
): void {
  const favorites = getLocalFavorites();
  if (favorites.some((f) => f.ol_key === book.ol_key)) return;
  favorites.unshift({ ...book, created_at: new Date().toISOString() });
  localStorage.setItem("bookmaxxing-favorites", JSON.stringify(favorites));
}

export function removeLocalFavorite(olKey: string): void {
  const favorites = getLocalFavorites().filter((f) => f.ol_key !== olKey);
  localStorage.setItem("bookmaxxing-favorites", JSON.stringify(favorites));
}

export function isLocalFavorite(olKey: string): boolean {
  return getLocalFavorites().some((f) => f.ol_key === olKey);
}

export function clearLocalFavorites(): void {
  localStorage.removeItem("bookmaxxing-favorites");
}
