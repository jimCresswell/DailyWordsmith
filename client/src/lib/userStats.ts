// LocalStorage utility for user stats and progress tracking

export interface UserStats {
  wordsLearned: number;
  streak: number;
  level: number;
  lastVisit: string | null; // ISO date string
}

export interface WordView {
  wordId: string;
  viewedAt: string; // ISO date string
  learned: boolean;
}

const STATS_KEY = "lexicon_user_stats";
const WORD_VIEWS_KEY = "lexicon_word_views";

// Initialize default stats
const DEFAULT_STATS: UserStats = {
  wordsLearned: 0,
  streak: 0,
  level: 1,
  lastVisit: null,
};

// Get user stats from localStorage
export function getUserStats(): UserStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) return { ...DEFAULT_STATS };
    
    const stats = JSON.parse(stored) as UserStats;
    
    // Calculate streak based on last visit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (stats.lastVisit) {
      const lastVisit = new Date(stats.lastVisit);
      lastVisit.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor(
        (today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If more than 1 day has passed, reset streak
      if (daysDiff > 1) {
        stats.streak = 0;
      }
    }
    
    return stats;
  } catch (error) {
    console.error("Error reading user stats from localStorage:", error);
    return { ...DEFAULT_STATS };
  }
}

// Save user stats to localStorage
export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Error saving user stats to localStorage:", error);
  }
}

// Update stats when user visits today
export function recordTodayVisit(): void {
  const stats = getUserStats();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastVisit = stats.lastVisit ? new Date(stats.lastVisit) : null;
  if (lastVisit) {
    lastVisit.setHours(0, 0, 0, 0);
  }
  
  const daysDiff = lastVisit
    ? Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // If visiting for the first time today
  if (daysDiff === 1) {
    // Consecutive day - increment streak
    stats.streak += 1;
  } else if (daysDiff === 0) {
    // Already visited today, no change
    return;
  } else if (daysDiff === null || daysDiff > 1) {
    // First ever visit or returning after a break - start streak at 1
    stats.streak = 1;
  }
  
  stats.lastVisit = today.toISOString();
  saveUserStats(stats);
}

// Get all word views
export function getWordViews(): WordView[] {
  try {
    const stored = localStorage.getItem(WORD_VIEWS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as WordView[];
  } catch (error) {
    console.error("Error reading word views from localStorage:", error);
    return [];
  }
}

// Save all word views
function saveWordViews(views: WordView[]): void {
  try {
    localStorage.setItem(WORD_VIEWS_KEY, JSON.stringify(views));
  } catch (error) {
    console.error("Error saving word views to localStorage:", error);
  }
}

// Record that a word was viewed
export function recordWordView(wordId: string): void {
  const views = getWordViews();
  const existing = views.find((v) => v.wordId === wordId);
  
  if (existing) {
    // Update view time
    existing.viewedAt = new Date().toISOString();
  } else {
    // Add new view
    views.push({
      wordId,
      viewedAt: new Date().toISOString(),
      learned: false,
    });
  }
  
  saveWordViews(views);
  recordTodayVisit();
}

// Mark a word as learned
export function markWordAsLearned(wordId: string): void {
  const views = getWordViews();
  const view = views.find((v) => v.wordId === wordId);
  
  if (view && !view.learned) {
    view.learned = true;
    saveWordViews(views);
    
    // Update stats
    const stats = getUserStats();
    stats.wordsLearned += 1;
    stats.level = Math.floor(stats.wordsLearned / 10) + 1;
    saveUserStats(stats);
  } else if (!view) {
    // Word not viewed yet, add it as learned
    views.push({
      wordId,
      viewedAt: new Date().toISOString(),
      learned: true,
    });
    saveWordViews(views);
    
    const stats = getUserStats();
    stats.wordsLearned += 1;
    stats.level = Math.floor(stats.wordsLearned / 10) + 1;
    saveUserStats(stats);
  }
}

// Check if a word has been learned
export function isWordLearned(wordId: string): boolean {
  const views = getWordViews();
  const view = views.find((v) => v.wordId === wordId);
  return view?.learned ?? false;
}

// Get recently viewed words (for archive display)
export function getRecentWordIds(limit: number = 50): string[] {
  const views = getWordViews();
  return views
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
    .slice(0, limit)
    .map((v) => v.wordId);
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  localStorage.removeItem(STATS_KEY);
  localStorage.removeItem(WORD_VIEWS_KEY);
}
