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
 * Extract all data from REST API response
 */
interface RESTAPIExtractedData {
  hasDefinition: boolean;
  hasEtymology: boolean;
  hasExamples: boolean;
  hasPronunciation: boolean;
  pronunciation?: string;
  definitions: string[];
  examples: string[];
  partOfSpeech?: string;
  error?: string;
}

/**
 * Test REST API endpoint for a single word
 */
async function testRESTAPI(word: string): Promise<RESTAPIExtractedData> {
  const url = `${REST_API_BASE}/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetchWithUserAgent(url);
    
    if (!response.ok) {
      return {
        hasDefinition: false,
        hasEtymology: false,
        hasExamples: false,
        hasPronunciation: false,
        definitions: [],
        examples: [],
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
        hasPronunciation: false,
        definitions: [],
        examples: [],
        error: 'No English entries found',
      };
    }
    
    // Extract all definitions
    const definitions: string[] = [];
    const examples: string[] = [];
    let partOfSpeech: string | undefined;
    
    for (const entry of englishEntries) {
      if (!partOfSpeech && entry.partOfSpeech) {
        partOfSpeech = entry.partOfSpeech;
      }
      
      for (const def of entry.definitions || []) {
        if (def.definition) {
          definitions.push(def.definition);
        }
        if (def.examples) {
          examples.push(...def.examples);
        }
      }
    }
    
    const hasDefinition = definitions.length > 0;
    const hasExamples = examples.length > 0;
    
    // REST API doesn't include etymology - will need fallback
    const hasEtymology = false;
    
    // REST API doesn't include pronunciation in this endpoint
    const hasPronunciation = false;
    
    return {
      hasDefinition,
      hasEtymology,
      hasExamples,
      hasPronunciation,
      definitions,
      examples,
      partOfSpeech,
    };
  } catch (error) {
    return {
      hasDefinition: false,
      hasEtymology: false,
      hasExamples: false,
      hasPronunciation: false,
      definitions: [],
      examples: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean wikitext templates and formatting
 */
function cleanWikitext(text: string): string {
  let cleaned = text;
  
  // Extract text from common templates while preserving meaning
  // {{term|...}} → just the term
  cleaned = cleaned.replace(/\{\{term\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1');
  
  // {{m|lang|text}} → text (remove language code)
  cleaned = cleaned.replace(/\{\{m\|[^|]+\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1');
  
  // {{l|lang|text}} → text (links)
  cleaned = cleaned.replace(/\{\{l\|[^|]+\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1');
  
  // {{suffix|...}} → keep meaningful part
  cleaned = cleaned.replace(/\{\{suffix\|([^}]+)\}\}/g, 'suffix: $1');
  
  // {{prefix|...}} → keep meaningful part  
  cleaned = cleaned.replace(/\{\{prefix\|([^}]+)\}\}/g, 'prefix: $1');
  
  // {{compound|...}} → keep meaningful part
  cleaned = cleaned.replace(/\{\{compound\|([^}]+)\}\}/g, 'compound: $1');
  
  // Generic template removal (for any remaining templates)
  cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up wiki links [[text|display]] → display
  cleaned = cleaned.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  
  // Clean up simple wiki links [[text]] → text
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');
  
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Clean up multiple spaces and newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove leading/trailing punctuation artifacts
  cleaned = cleaned.replace(/^[,;:\s]+|[,;:\s]+$/g, '');
  
  return cleaned;
}

/**
 * Test Action API fallback for etymology and pronunciation
 */
async function testActionAPIForEtymology(word: string): Promise<{ 
  etymology?: string; 
  pronunciation?: string;
  error?: string;
}> {
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
    
    // Extract English section first
    const englishMatch = wikitext.match(/==English==([\s\S]*?)(?:\n==[^=]|$)/);
    const englishSection = englishMatch ? englishMatch[1] : wikitext;
    
    // Extract etymology (try numbered and unnumbered)
    let etymology: string | undefined;
    const etymologyMatch = englishSection.match(/===Etymology(?:\s+\d+)?===\s*\n([\s\S]*?)(?=\n===|$)/);
    
    if (etymologyMatch) {
      const rawEtymology = etymologyMatch[1].trim();
      const cleaned = cleanWikitext(rawEtymology);
      if (cleaned.length > 10) { // Ensure we got meaningful content
        etymology = cleaned;
      }
    }
    
    // Extract pronunciation (IPA)
    let pronunciation: string | undefined;
    const pronunciationMatch = englishSection.match(/===Pronunciation===\s*\n([\s\S]*?)(?=\n===|$)/);
    
    if (pronunciationMatch) {
      const ipaMatch = pronunciationMatch[1].match(/\{\{IPA\|en\|([^}]+)\}\}/);
      if (ipaMatch) {
        pronunciation = ipaMatch[1].replace(/\|/g, ', ');
      }
    }
    
    return { etymology, pronunciation };
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
  let pronunciation: string | undefined;
  
  // If no etymology from REST, try Action API fallback
  if (!restResult.hasEtymology && restResult.hasDefinition) {
    console.log(`  → Trying Action API fallback for etymology...`);
    const fallbackResult = await testActionAPIForEtymology(word);
    usedFallback = true;
    
    if (fallbackResult.etymology) {
      etymology = fallbackResult.etymology;
    }
    if (fallbackResult.pronunciation) {
      pronunciation = fallbackResult.pronunciation;
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
 * Randomly sample words from curated list
 */
function sampleWords(count: number): string[] {
  const shuffled = [...curatedWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(w => w.word);
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
  
  // Get sample size from command line or default to 50
  const sampleSize = process.argv[2] ? parseInt(process.argv[2]) : 50;
  
  // Sample words from curated list
  const testWords = sampleWords(sampleSize);
  
  console.log(`Testing ${testWords.length} randomly sampled words from ${curatedWords.length} total...`);
  console.log(`Estimated time: ~${Math.ceil(testWords.length * RATE_LIMIT_DELAY / 1000 / 60)} minutes\n`);
  
  const results: TestResult[] = [];
  let progressCount = 0;
  
  for (const word of testWords) {
    progressCount++;
    console.log(`[${progressCount}/${testWords.length}] Testing: ${word}`);
    
    const result = await testWord(word);
    results.push(result);
    
    console.log(`  ✓ Def: ${result.hasDefinition ? 'Y' : 'N'} | Etym: ${result.hasEtymology ? 'Y' : 'N'} | Ex: ${result.hasExamples ? 'Y' : 'N'} | Fallback: ${result.usedFallback ? 'Y' : 'N'}`);
    if (result.error) {
      console.log(`  ✗ Error: ${result.error}`);
    }
    
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
  
  console.log('\n' + '='.repeat(60));
  console.log('COVERAGE STATISTICS');
  console.log('='.repeat(60));
  console.log(`Total words tested: ${stats.total}`);
  console.log(`With definition: ${stats.withDefinition} (${(stats.withDefinition / stats.total * 100).toFixed(1)}%)`);
  console.log(`With etymology: ${stats.withEtymology} (${(stats.withEtymology / stats.total * 100).toFixed(1)}%)`);
  console.log(`With examples: ${stats.withExamples} (${(stats.withExamples / stats.total * 100).toFixed(1)}%)`);
  console.log(`Used fallback: ${stats.usedFallback} (${(stats.usedFallback / stats.total * 100).toFixed(1)}%)`);
  console.log(`Errors: ${stats.errors} (${(stats.errors / stats.total * 100).toFixed(1)}%)`);
  console.log('');
  
  // Sample etymologies for quality review
  const wordsWithEtymology = results.filter(r => r.etymology);
  const sampleEtymologies = wordsWithEtymology.slice(0, 10);
  
  if (sampleEtymologies.length > 0) {
    console.log('='.repeat(60));
    console.log('SAMPLE ETYMOLOGIES (first 10)');
    console.log('='.repeat(60));
    sampleEtymologies.forEach((r, i) => {
      console.log(`${i + 1}. ${r.word}:`);
      console.log(`   ${r.etymology}\n`);
    });
  }
  
  // Words with errors
  const wordsWithErrors = results.filter(r => r.error);
  if (wordsWithErrors.length > 0) {
    console.log('='.repeat(60));
    console.log(`ERRORS (${wordsWithErrors.length} words)`);
    console.log('='.repeat(60));
    wordsWithErrors.slice(0, 20).forEach(r => {
      console.log(`- ${r.word}: ${r.error}`);
    });
    if (wordsWithErrors.length > 20) {
      console.log(`  ... and ${wordsWithErrors.length - 20} more`);
    }
    console.log('');
  }
  
  // Assessment
  console.log('='.repeat(60));
  console.log('VIABILITY ASSESSMENT');
  console.log('='.repeat(60));
  const etymCoverage = stats.withEtymology / stats.total * 100;
  if (etymCoverage >= 95) {
    console.log(`✓ PASS: Etymology coverage (${etymCoverage.toFixed(1)}%) meets ≥95% requirement`);
  } else if (etymCoverage >= 90) {
    console.log(`⚠ BORDERLINE: Etymology coverage (${etymCoverage.toFixed(1)}%) is close to 95% target`);
  } else {
    console.log(`✗ FAIL: Etymology coverage (${etymCoverage.toFixed(1)}%) below 95% requirement`);
  }
  console.log('');
}

// Run the test
main().catch(console.error);
