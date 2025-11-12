/**
 * Wiktionary API Viability Testing Script
 * 
 * Purpose: Test REST API and Action API endpoints with sample words
 * to measure etymology coverage and data quality.
 * 
 * Week 1 Deliverable: Coverage report + go/no-go decision for migration
 */

import curatedWords from '../data/curated-words-merged.json';

// Configuration
const USER_AGENT = 'Lexicon/1.0 (Replit educational app; testing Wiktionary migration)';
const REST_API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition';
const ACTION_API_BASE = 'https://en.wiktionary.org/w/api.php';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Types for API responses
interface WiktionaryRESTDefinition {
  partOfSpeech: string;
  definitions: Array<{
    definition: string;
    examples?: string[];
  }>;
}

interface WiktionaryRESTResponse {
  en?: Array<WiktionaryRESTDefinition>;
}

interface TestResult {
  word: string;
  hasDefinition: boolean;
  hasEtymology: boolean;
  hasExamples: boolean;
  usedFallback: boolean;
  error?: string;
  etymology?: string;
}

// Statistics
interface CoverageStats {
  total: number;
  withDefinition: number;
  withEtymology: number;
  withExamples: number;
  usedFallback: number;
  errors: number;
}

/**
 * Fetch with Wikimedia-compliant User-Agent
 */
async function fetchWithUserAgent(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test REST API endpoint for a single word
 */
async function testRESTAPI(word: string): Promise<Partial<TestResult>> {
  const url = `${REST_API_BASE}/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetchWithUserAgent(url);
    
    if (!response.ok) {
      return {
        hasDefinition: false,
        hasEtymology: false,
        hasExamples: false,
        error: `HTTP ${response.status}`,
      };
    }
    
    const data: WiktionaryRESTResponse = await response.json();
    
    // Filter for English entries
    const englishEntries = data.en || [];
    
    if (englishEntries.length === 0) {
      return {
        hasDefinition: false,
        hasEtymology: false,
        hasExamples: false,
        error: 'No English entries found',
      };
    }
    
    // Check for definitions
    const hasDefinition = englishEntries.some(entry => 
      entry.definitions && entry.definitions.length > 0
    );
    
    // Check for examples
    const hasExamples = englishEntries.some(entry =>
      entry.definitions.some(def => def.examples && def.examples.length > 0)
    );
    
    // REST API typically doesn't include etymology - will need fallback
    const hasEtymology = false;
    
    return {
      hasDefinition,
      hasEtymology,
      hasExamples,
    };
  } catch (error) {
    return {
      hasDefinition: false,
      hasEtymology: false,
      hasExamples: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test Action API fallback for etymology
 */
async function testActionAPIForEtymology(word: string): Promise<{ etymology?: string; error?: string }> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content',
    rvslots: 'main',
    format: 'json',
    titles: word,
  });
  
  const url = `${ACTION_API_BASE}?${params}`;
  
  try {
    const response = await fetchWithUserAgent(url);
    
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    
    const data: any = await response.json();
    
    // Extract wikitext from response
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    if (!page || page.missing !== undefined) {
      return { error: 'Page not found' };
    }
    
    const wikitext = page.revisions?.[0]?.slots?.main?.['*'] || '';
    
    // Very basic etymology extraction (will improve in Week 2)
    const etymologyMatch = wikitext.match(/===Etymology===\s*\n([\s\S]*?)(?=\n===|$)/);
    
    if (etymologyMatch) {
      const etymology = etymologyMatch[1].trim();
      // Remove wikitext formatting for preview (basic cleanup)
      const cleaned = etymology
        .replace(/\{\{[^}]+\}\}/g, '') // Remove templates
        .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, '$1') // Simplify links
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .trim();
      
      return { etymology: cleaned || undefined };
    }
    
    return { etymology: undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Test a single word with REST API + fallback
 */
async function testWord(word: string): Promise<TestResult> {
  console.log(`Testing: ${word}`);
  
  // Try REST API first
  const restResult = await testRESTAPI(word);
  
  let usedFallback = false;
  let etymology: string | undefined;
  
  // If no etymology from REST, try Action API fallback
  if (!restResult.hasEtymology && restResult.hasDefinition) {
    console.log(`  → Trying Action API fallback for etymology...`);
    const fallbackResult = await testActionAPIForEtymology(word);
    usedFallback = true;
    
    if (fallbackResult.etymology) {
      etymology = fallbackResult.etymology;
    }
  }
  
  return {
    word,
    hasDefinition: restResult.hasDefinition || false,
    hasEtymology: !!etymology,
    hasExamples: restResult.hasExamples || false,
    usedFallback,
    error: restResult.error,
    etymology,
  };
}

/**
 * Main test function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Wiktionary API Viability Test');
  console.log('='.repeat(60));
  console.log(`User-Agent: ${USER_AGENT}`);
  console.log(`Rate limit: ${RATE_LIMIT_DELAY}ms between requests\n`);
  
  // Start with small test set (3-5 words)
  const testWords = ['ephemeral', 'gregarious', 'laconic', 'ubiquitous', 'verbose'];
  
  console.log(`Testing ${testWords.length} sample words...\n`);
  
  const results: TestResult[] = [];
  
  for (const word of testWords) {
    const result = await testWord(word);
    results.push(result);
    
    console.log(`  Definition: ${result.hasDefinition ? '✓' : '✗'}`);
    console.log(`  Etymology: ${result.hasEtymology ? '✓' : '✗'}`);
    console.log(`  Examples: ${result.hasExamples ? '✓' : '✗'}`);
    console.log(`  Fallback used: ${result.usedFallback ? 'Yes' : 'No'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.etymology) {
      console.log(`  Etymology preview: ${result.etymology.substring(0, 100)}...`);
    }
    console.log('');
    
    // Rate limiting
    await sleep(RATE_LIMIT_DELAY);
  }
  
  // Calculate statistics
  const stats: CoverageStats = {
    total: results.length,
    withDefinition: results.filter(r => r.hasDefinition).length,
    withEtymology: results.filter(r => r.hasEtymology).length,
    withExamples: results.filter(r => r.hasExamples).length,
    usedFallback: results.filter(r => r.usedFallback).length,
    errors: results.filter(r => r.error).length,
  };
  
  console.log('='.repeat(60));
  console.log('COVERAGE STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total words tested: ${stats.total}`);
  console.log(`With definition: ${stats.withDefinition} (${(stats.withDefinition / stats.total * 100).toFixed(1)}%)`);
  console.log(`With etymology: ${stats.withEtymology} (${(stats.withEtymology / stats.total * 100).toFixed(1)}%)`);
  console.log(`With examples: ${stats.withExamples} (${(stats.withExamples / stats.total * 100).toFixed(1)}%)`);
  console.log(`Used fallback: ${stats.usedFallback} (${(stats.usedFallback / stats.total * 100).toFixed(1)}%)`);
  console.log(`Errors: ${stats.errors} (${(stats.errors / stats.total * 100).toFixed(1)}%)`);
  console.log('');
}

// Run the test
main().catch(console.error);
