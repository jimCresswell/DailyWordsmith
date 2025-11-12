/**
 * WiktionaryMigrationService - Offline bulk migration script
 * 
 * This service performs a one-time migration of all 2,320 curated words
 * from the Wiktionary API to PostgreSQL. It runs BEFORE deployment to ensure
 * all data is pre-loaded when users access the app.
 * 
 * Key features:
 * - Rate limiting (1 req/sec to respect Wikimedia guidelines)
 * - Exponential backoff with jitter for error handling
 * - Progress tracking and resumable migration
 * - Comprehensive logging for debugging
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { wordDefinitions, curatedWords, missingDefinitions, type WordDefinition } from '@shared/schema';
import { eq, isNotNull, and, sql } from 'drizzle-orm';
import curatedWordsList from '../data/curated-words-merged.json';
import crypto from 'crypto';

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

const USER_AGENT = 'Lexicon/1.0 (Etymology learning app; contact: lexicon@replit.app)';
const RATE_LIMIT_MS = 1000; // 1 request per second
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 32000; // 32 seconds

interface WiktionaryRestDefinition {
  partOfSpeech: string;
  definitions: Array<{
    definition: string;
    examples?: string[];
  }>;
}

interface WiktionaryRestResponse {
  en?: WiktionaryRestDefinition[];
}

interface ProcessedWord {
  wordId: string;
  word: string;
  pronunciation: string | null;
  partOfSpeech: string;
  definition: string;
  etymology: string | null;
  examples: string[];
  sourceUrl: string;
  retrievedAt: Date;
  license: string;
}

export class WiktionaryMigrationService {
  private lastRequestTime = 0;
  private processedCount = 0;
  private failedWords: string[] = [];
  private totalWords: number;

  constructor() {
    this.totalWords = curatedWordsList.length;
  }

  /**
   * Main entry point - runs the migration
   * @param limit Optional limit for testing (e.g., migrate only first 10 words)
   */
  async runMigration(limit?: number) {
    console.log('========================================');
    console.log('Wiktionary Offline Migration Starting');
    if (limit) {
      console.log(`TEST MODE: Limiting to ${limit} words`);
    }
    console.log(`Total words in database: ${this.totalWords}`);
    console.log('========================================\n');

    const startTime = Date.now();

    // Get list of words that need migration
    let wordsToMigrate = await this.getWordsNeedingMigration();
    
    // Apply limit if specified (for testing)
    if (limit && wordsToMigrate.length > limit) {
      wordsToMigrate = wordsToMigrate.slice(0, limit);
      console.log(`Limiting migration to first ${limit} words for testing\n`);
    }
    console.log(`Words needing migration: ${wordsToMigrate.length}`);
    console.log(`Already migrated: ${this.totalWords - wordsToMigrate.length}\n`);

    // Process each word with rate limiting
    for (const wordData of wordsToMigrate) {
      await this.processWord(wordData);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n========================================');
    console.log('Migration Complete');
    console.log(`Total processed: ${this.processedCount}`);
    console.log(`Failed: ${this.failedWords.length}`);
    console.log(`Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    
    if (this.failedWords.length > 0) {
      console.log(`\nFailed words: ${this.failedWords.join(', ')}`);
    }

    // Calculate etymology coverage
    await this.calculateCoverage();
    console.log('========================================');
  }

  /**
   * Get words that haven't been migrated yet (resumable migration)
   */
  private async getWordsNeedingMigration() {
    // Get all curated words from database
    const allWords = await db.select()
      .from(curatedWords)
      .orderBy(curatedWords.word);

    // Get already migrated words
    const migratedWords = await db.select({ wordId: wordDefinitions.wordId })
      .from(wordDefinitions)
      .where(isNotNull(wordDefinitions.sourceUrl));

    const migratedWordIds = new Set(migratedWords.map((w: { wordId: string }) => w.wordId));

    // Return words that need migration
    return allWords.filter((w: { id: string; word: string; difficulty: number }) => !migratedWordIds.has(w.id));
  }

  /**
   * Process a single word with rate limiting and error handling
   */
  private async processWord(wordData: { id: string; word: string; difficulty: number }) {
    const progress = Math.round((this.processedCount / this.totalWords) * 100);
    console.log(`[${this.processedCount + 1}/${this.totalWords}] (${progress}%) Processing: ${wordData.word}`);

    try {
      // Try REST API first (rate limiting happens inside fetchFromRestApi)
      let processedData = await this.fetchFromRestApi(wordData);
      
      // If no etymology from REST, try Action API fallback
      if (!processedData.etymology) {
        console.log(`  → No etymology in REST, trying Action API fallback...`);
        // Apply rate limiting before Action API call
        await this.enforceRateLimit();
        const etymologyFromAction = await this.fetchEtymologyFromActionApi(wordData.word);
        if (etymologyFromAction) {
          processedData.etymology = etymologyFromAction;
          console.log(`  ✓ Etymology found via Action API`);
        } else {
          console.log(`  ✗ No etymology found (genuine missing data)`);
        }
      }

      // Save to database
      await this.saveToDatabase(processedData);
      this.processedCount++;
      console.log(`  ✓ Saved to database`);

    } catch (error) {
      console.error(`  ✗ Failed to process ${wordData.word}:`, error);
      this.failedWords.push(wordData.word);
      
      // Mark as missing in database
      await this.markAsMissing(wordData.id, String(error));
    }
  }

  /**
   * Enforce rate limiting (1 request per second)
   */
  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch word data from Wiktionary REST API
   */
  private async fetchFromRestApi(wordData: { id: string; word: string }): Promise<ProcessedWord> {
    const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(wordData.word)}`;
    
    // Apply rate limiting before REST API call
    await this.enforceRateLimit();
    const response = await this.fetchWithRetry(url);
    const data: WiktionaryRestResponse = await response.json();
    
    if (!data.en || data.en.length === 0) {
      throw new Error('No English definitions found');
    }

    // Extract first definition
    const firstEntry = data.en[0];
    const firstDef = firstEntry.definitions[0];
    
    return {
      wordId: wordData.id,
      word: wordData.word,
      pronunciation: null, // REST API doesn't provide pronunciation
      partOfSpeech: firstEntry.partOfSpeech,
      definition: firstDef.definition,
      etymology: null, // Will be filled by Action API if available
      examples: firstDef.examples || [],
      sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(wordData.word)}`,
      retrievedAt: new Date(),
      license: 'CC BY-SA 3.0'
    };
  }

  /**
   * Fetch etymology from Wiktionary Action API (fallback)
   */
  private async fetchEtymologyFromActionApi(word: string): Promise<string | null> {
    const url = `https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=${encodeURIComponent(word)}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      const data: any = await response.json();
      
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (!page || page.missing) {
        return null;
      }
      
      const wikitext = page.revisions?.[0]?.slots?.main?.['*'] || '';
      
      // Extract English section with fixed regex
      const englishMatch = wikitext.match(/==English==\s*([\s\S]*?)(?=\n==[A-Z][a-z]|$)/);
      if (!englishMatch) {
        return null;
      }
      
      const englishSection = englishMatch[1];
      
      // Extract etymology
      const etymologyMatch = englishSection.match(/===Etymology[^=]*===\s*([\s\S]*?)(?=\n==|$)/);
      if (!etymologyMatch) {
        return null;
      }
      
      // Clean up wikitext (basic cleaning)
      let etymology = etymologyMatch[1]
        .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
        .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // Clean links
        .replace(/'''?/g, '') // Remove bold/italic
        .trim();
      
      return etymology || null;
      
    } catch (error) {
      console.error(`  Failed to fetch etymology from Action API:`, error);
      return null;
    }
  }

  /**
   * HTTP fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (response.ok) {
        return response;
      }
      
      // Handle rate limiting and server errors
      if (response.status === 429 || response.status >= 500) {
        if (retryCount < MAX_RETRIES) {
          const delay = this.calculateRetryDelay(retryCount);
          console.log(`  → Rate limited or server error (${response.status}), retrying in ${delay}ms...`);
          await this.sleep(delay);
          return this.fetchWithRetry(url, retryCount + 1);
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const delay = this.calculateRetryDelay(retryCount);
        console.log(`  → Network error, retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateRetryDelay(retryCount: number): number {
    const exponentialDelay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Save processed word data to database
   */
  private async saveToDatabase(data: ProcessedWord) {
    await db.insert(wordDefinitions)
      .values({
        id: crypto.randomUUID(),
        wordId: data.wordId,
        pronunciation: data.pronunciation,
        partOfSpeech: data.partOfSpeech,
        definition: data.definition,
        etymology: data.etymology,
        examples: data.examples,
        fetchedAt: data.retrievedAt,
        sourceUrl: data.sourceUrl,
        retrievedAt: data.retrievedAt,
        license: data.license
      })
      .onConflictDoUpdate({
        target: wordDefinitions.wordId,
        set: {
          pronunciation: data.pronunciation,
          partOfSpeech: data.partOfSpeech,
          definition: data.definition,
          etymology: data.etymology,
          examples: data.examples,
          fetchedAt: data.retrievedAt,
          sourceUrl: data.sourceUrl,
          retrievedAt: data.retrievedAt,
          license: data.license
        }
      });
  }

  /**
   * Mark a word as missing in the database
   */
  private async markAsMissing(wordId: string, reason: string) {
    await db.insert(missingDefinitions)
      .values({
        id: crypto.randomUUID(),
        wordId: wordId,
        reason: reason,
        markedAt: new Date()
      })
      .onConflictDoNothing();
  }

  /**
   * Calculate and display etymology coverage statistics
   */
  private async calculateCoverage() {
    const stats = await db.select({
      total: sql<number>`COUNT(*)`,
      withEtymology: sql<number>`COUNT(CASE WHEN etymology IS NOT NULL THEN 1 END)`,
      withExamples: sql<number>`COUNT(CASE WHEN array_length(examples, 1) > 0 THEN 1 END)`
    })
    .from(wordDefinitions)
    .where(isNotNull(wordDefinitions.sourceUrl)); // Only count migrated words
    
    const stat = stats[0];
    if (stat.total === 0) {
      console.log(`\nNo migrated words found in database`);
      return;
    }
    
    const etymologyCoverage = ((stat.withEtymology / stat.total) * 100).toFixed(1);
    const examplesCoverage = ((stat.withExamples / stat.total) * 100).toFixed(1);
    
    console.log(`\nCoverage Statistics (Migrated Words Only):`);
    console.log(`- Etymology: ${etymologyCoverage}% (${stat.withEtymology}/${stat.total})`);
    console.log(`- Examples: ${examplesCoverage}% (${stat.withExamples}/${stat.total})`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new WiktionaryMigrationService();
  service.runMigration()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}