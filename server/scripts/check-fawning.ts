/**
 * Quick check of fawning's wikitext structure
 */

const USER_AGENT = 'Lexicon/1.0 (testing)';

async function main() {
  const word = 'fawning';
  const url = `https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=${word}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  
  const data: any = await response.json();
  const pages = data.query?.pages || {};
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];
  const wikitext = page.revisions?.[0]?.slots?.main?.['*'] || '';
  
  console.log('='.repeat(60));
  console.log('FAWNING WIKITEXT STRUCTURE');
  console.log('='.repeat(60));
  console.log(wikitext);
  console.log('\n' + '='.repeat(60));
  
  // Try to extract English section
  const englishMatch = wikitext.match(/==English==\s*([\s\S]*?)(?=\n==[A-Z][a-z]|$)/);
  if (englishMatch) {
    console.log('✓ English section found');
    console.log('English section content:');
    console.log(englishMatch[1]);
  } else {
    console.log('✗ No English section found');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Search for Etymology
  if (wikitext.includes('Etymology')) {
    console.log('✓ Word "Etymology" found in wikitext');
    const lines = wikitext.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('Etymology')) {
        console.log(`Line ${i}: ${line}`);
      }
    });
  } else {
    console.log('✗ Word "Etymology" NOT found in wikitext');
  }
}

main().catch(console.error);
