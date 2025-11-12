/**
 * Debug script to investigate why specific words failed etymology extraction
 * Usage: npx tsx server/scripts/debug-failed-words.ts
 */

const USER_AGENT = 'Lexicon/1.0 (Replit educational app; debugging etymology parser)';
const failedWords = ['stringent', 'nugatory', 'hubris', 'evenhanded', 'fawning'];

interface ActionAPIResponse {
  query?: {
    pages?: {
      [key: string]: {
        revisions?: Array<{
          slots?: {
            main?: {
              '*': string;
            };
          };
        }>;
      };
    };
  };
}

async function fetchWikitext(word: string): Promise<string | null> {
  const url = `https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=${encodeURIComponent(word)}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  
  if (!response.ok) {
    console.error(`Failed to fetch ${word}: ${response.status}`);
    return null;
  }
  
  const data = await response.json() as ActionAPIResponse;
  const pages = data.query?.pages;
  
  if (!pages) return null;
  
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  const wikitext = page?.revisions?.[0]?.slots?.main?.['*'];
  
  return wikitext || null;
}

function extractEnglishSection(wikitext: string): string | null {
  const englishMatch = wikitext.match(/==English==([\s\S]*?)(?:^==[^=]|$)/m);
  return englishMatch ? englishMatch[1] : null;
}

function extractEtymologySection(englishSection: string): string | null {
  // Try different etymology section formats
  const patterns = [
    /===Etymology===\s*\n([\s\S]*?)(?:\n===|$)/,          // Standard format
    /===Etymology 1===\s*\n([\s\S]*?)(?:\n===|$)/,        // Numbered etymology
    /====Etymology====\s*\n([\s\S]*?)(?:\n====|$)/,       // Four equals
    /==Etymology==\s*\n([\s\S]*?)(?:\n==|$)/,             // Two equals (rare)
  ];
  
  for (const pattern of patterns) {
    const match = englishSection.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

async function debugWord(word: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`DEBUGGING: ${word}`);
  console.log('='.repeat(80));
  
  const wikitext = await fetchWikitext(word);
  
  if (!wikitext) {
    console.log('✗ Failed to fetch wikitext');
    return;
  }
  
  console.log(`✓ Fetched wikitext (${wikitext.length} chars)`);
  
  // Show first 1000 chars of RAW wikitext to see structure
  console.log('\n--- RAW WIKITEXT PREVIEW (first 1000 chars) ---');
  console.log(wikitext.substring(0, 1000));
  console.log('...\n');
  
  // Search for "English" in the wikitext
  console.log('Searching for "English" heading:');
  const lines = wikitext.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('English')) {
      console.log(`  Line ${i}: "${line}"`);
    }
  });
  
  const englishSection = extractEnglishSection(wikitext);
  
  if (!englishSection) {
    console.log('\n✗ No English section found with current regex');
    return;
  }
  
  console.log(`\n✓ Found English section (${englishSection.length} chars)`);
  
  // Show first 500 chars of English section to understand structure
  console.log('\n--- ENGLISH SECTION PREVIEW (first 500 chars) ---');
  console.log(englishSection.substring(0, 500));
  console.log('...\n');
  
  const etymology = extractEtymologySection(englishSection);
  
  if (!etymology) {
    console.log('✗ No etymology section found');
    console.log('\nSearching for "Etymology" in English section:');
    const etimLines = englishSection.split('\n');
    etimLines.forEach((line, i) => {
      if (line.toLowerCase().includes('etymology')) {
        console.log(`  Line ${i}: ${line}`);
      }
    });
  } else {
    console.log(`✓ Found etymology section (${etymology.length} chars)`);
    console.log('\n--- RAW ETYMOLOGY ---');
    console.log(etymology);
    console.log('\n--- END RAW ETYMOLOGY ---');
  }
}

async function main() {
  console.log('Debugging Failed Etymology Extractions');
  console.log('Words to investigate:', failedWords.join(', '));
  
  for (const word of failedWords) {
    await debugWord(word);
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('DEBUGGING COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);
