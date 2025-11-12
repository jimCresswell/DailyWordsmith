/**
 * Test specific failed words to verify parser fix
 * Usage: npx tsx server/scripts/test-specific-words.ts
 */

import curatedWords from '../data/curated-words-merged.json';

const USER_AGENT = 'Lexicon/1.0 (Replit educational app; testing etymology parser fix)';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const REST_API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition';
const ACTION_API_BASE = 'https://en.wiktionary.org/w/api.php';

// Test the 5 words that previously failed
const testWords = ['stringent', 'nugatory', 'hubris', 'evenhanded', 'fawning'];

interface TestResult {
  word: string;
  hasEtymology: boolean;
  etymology?: string;
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithUserAgent(url: string): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
}

function cleanWikitext(text: string): string {
  let cleaned = text;
  
  // Remove {{wp}}, {{wpe}}, {{wikipedia}} templates
  cleaned = cleaned.replace(/\{\{(?:wp|wpe|wikipedia)[^}]*\}\}/g, '');
  
  // Handle basic word origin templates: {{bor|en|la|word}} → "from Latin word"
  cleaned = cleaned.replace(/\{\{(?:bor|der|inh|lbor|obor|cog)\+?\|en\|([a-z]+)\|([^}|]+)(?:\|[^}]*)?\}\}/g, (_, langCode, word) => {
    const langMap: Record<string, string> = {
      'la': 'Latin',
      'grc': 'Ancient Greek',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'it': 'Italian',
      'ine-pro': 'Proto-Indo-European',
    };
    const lang = langMap[langCode] || langCode;
    return `from ${lang} ${word}`;
  });
  
  // Handle compound templates: {{com|en|word1|word2}} → "word1 + word2"
  cleaned = cleaned.replace(/\{\{com\|en\|([^}|]+)\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1 + $2');
  
  // Handle suffix templates: {{suffix|en|word|suffix}} → "word + -suffix"
  cleaned = cleaned.replace(/\{\{suffix\|en\|([^}|]+)\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1 + -$2');
  
  // Handle affix templates: {{affix|en|prefix-|word}} → "prefix- + word"
  cleaned = cleaned.replace(/\{\{affix\|en\|([^}|]+)\|([^}|]+)(?:\|[^}]*)?\}\}/g, '$1 + $2');
  
  // Remove root templates but preserve the root
  cleaned = cleaned.replace(/\{\{root\|en\|([^}]+)\}\}/g, 'from root $1');
  
  // Remove other template remnants
  cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up wikilinks: [[word]] → word, [[link|display]] → display
  cleaned = cleaned.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');
  
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function testActionAPI(word: string): Promise<{ etymology?: string; error?: string }> {
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
    
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    if (!page || page.missing !== undefined) {
      return { error: 'Page not found' };
    }
    
    const wikitext = page.revisions?.[0]?.slots?.main?.['*'] || '';
    
    // Extract English section first (FIXED REGEX)
    const englishMatch = wikitext.match(/==English==\s*([\s\S]*?)(?=\n==[A-Z][a-z]|$)/);
    const englishSection = englishMatch ? englishMatch[1] : wikitext;
    
    // Extract etymology
    let etymology: string | undefined;
    const etymologyMatch = englishSection.match(/===Etymology(?:\s+\d+)?===\s*\n([\s\S]*?)(?=\n===|$)/);
    
    if (etymologyMatch) {
      const rawEtymology = etymologyMatch[1].trim();
      const cleaned = cleanWikitext(rawEtymology);
      if (cleaned.length > 10) {
        etymology = cleaned;
      }
    }
    
    return { etymology };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Parser Fix on Previously Failed Words');
  console.log('='.repeat(60));
  console.log(`Words: ${testWords.join(', ')}\n`);
  
  const results: TestResult[] = [];
  
  for (const word of testWords) {
    console.log(`[${results.length + 1}/${testWords.length}] Testing: ${word}`);
    
    const apiResult = await testActionAPI(word);
    
    const result: TestResult = {
      word,
      hasEtymology: !!apiResult.etymology,
      etymology: apiResult.etymology,
      error: apiResult.error,
    };
    
    results.push(result);
    
    if (result.hasEtymology) {
      console.log(`  ✅ Etymology found!`);
      console.log(`  Preview: ${result.etymology?.substring(0, 100)}...`);
    } else {
      console.log(`  ❌ No etymology extracted`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
    console.log('');
    
    // Rate limiting
    await sleep(RATE_LIMIT_DELAY);
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.hasEtymology).length;
  console.log(`Success rate: ${successCount}/${testWords.length} (${(successCount / testWords.length * 100).toFixed(0)}%)`);
  console.log('');
  
  // Show all etymologies
  results.forEach(r => {
    if (r.hasEtymology) {
      console.log(`${r.word}:`);
      console.log(`  ${r.etymology}\n`);
    }
  });
  
  if (successCount === testWords.length) {
    console.log('✅ ALL WORDS FIXED! Parser is working correctly.');
  } else {
    console.log(`⚠️ ${testWords.length - successCount} words still failing.`);
  }
}

main().catch(console.error);
