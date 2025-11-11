// LocalStorage utility for managing bookmarked words

export interface BookmarkedWord {
  wordId: string;
  word: string;
  bookmarkedAt: string; // ISO date string
}

const BOOKMARKS_KEY = "lexicon_bookmarked_words";

// Get all bookmarked words
export function getBookmarkedWords(): BookmarkedWord[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as BookmarkedWord[];
  } catch (error) {
    console.error("Error reading bookmarks from localStorage:", error);
    return [];
  }
}

// Save all bookmarked words
function saveBookmarkedWords(bookmarks: BookmarkedWord[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("Error saving bookmarks to localStorage:", error);
  }
}

// Check if a word is bookmarked
export function isWordBookmarked(wordId: string): boolean {
  const bookmarks = getBookmarkedWords();
  return bookmarks.some((b) => b.wordId === wordId);
}

// Toggle bookmark status for a word
export function toggleBookmark(wordId: string, word: string): boolean {
  const bookmarks = getBookmarkedWords();
  const existingIndex = bookmarks.findIndex((b) => b.wordId === wordId);
  
  if (existingIndex !== -1) {
    // Remove bookmark
    bookmarks.splice(existingIndex, 1);
    saveBookmarkedWords(bookmarks);
    return false; // Not bookmarked anymore
  } else {
    // Add bookmark
    bookmarks.push({
      wordId,
      word,
      bookmarkedAt: new Date().toISOString(),
    });
    saveBookmarkedWords(bookmarks);
    return true; // Now bookmarked
  }
}

// Get bookmarked word IDs (for quick lookup)
export function getBookmarkedWordIds(): string[] {
  return getBookmarkedWords().map((b) => b.wordId);
}

// Clear all bookmarks (for testing/reset)
export function clearAllBookmarks(): void {
  localStorage.removeItem(BOOKMARKS_KEY);
}
