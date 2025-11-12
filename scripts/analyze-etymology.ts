import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { curatedWords, wordDefinitions, missingDefinitions } from "../shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

interface DictionaryApiResponse {
  word: string;
  phonetics: Array<{ text?: string }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
  origin?: string;
}

async function fetchFromDictionaryApi(word: string): Promise<DictionaryApiResponse | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ❌ Dictionary API 404 for: ${word}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error(`  ⚠️  API error for ${word}:`, error);
    return null;
  }
}

async function analyzeWords() {
  console.log("🔍 Starting etymology analysis...\n");

  // Fetch all curated words
  const allWords = await db.select().from(curatedWords);
  console.log(`📚 Total curated words: ${allWords.length}\n`);

  // Get existing cached definitions
  const cachedDefs = await db.select().from(wordDefinitions);
  const cachedMap = new Map(cachedDefs.map(d => [d.wordId, d]));
  console.log(`💾 Cached definitions: ${cachedDefs.length}`);

  // Get existing missing words
  const missing = await db.select().from(missingDefinitions);
  const missingMap = new Map(missing.map(m => [m.wordId, m]));
  console.log(`❌ Already marked missing: ${missing.length}\n`);

  const stats = {
    total: allWords.length,
    cached: cachedDefs.length,
    alreadyMissing: missing.length,
    fetched: 0,
    hasEtymology: 0,
    noEtymology: 0,
    api404: 0,
    apiErrors: 0,
    newlyMarkedMissing: 0,
  };

  let wordsToFetch = allWords.filter(w => 
    !cachedMap.has(w.id) && !missingMap.has(w.id)
  );

  console.log(`📥 Words to fetch: ${wordsToFetch.length}`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(wordsToFetch.length * 0.5)} seconds\n`);

  if (wordsToFetch.length === 0) {
    console.log("✅ All words already analyzed!\n");
  } else {
    console.log("Starting API fetches (rate limited to ~2 per second)...\n");
  }

  // Process in batches to avoid rate limiting
  for (let i = 0; i < wordsToFetch.length; i++) {
    const word = wordsToFetch[i];
    
    if (i > 0 && i % 10 === 0) {
      console.log(`Progress: ${i}/${wordsToFetch.length} (${Math.round(i/wordsToFetch.length*100)}%)`);
    }

    const apiData = await fetchFromDictionaryApi(word.word);
    stats.fetched++;

    if (!apiData) {
      // API returned 404
      stats.api404++;
      stats.newlyMarkedMissing++;
      
      await db.insert(missingDefinitions).values({
        wordId: word.id,
        reason: "Dictionary API returned 404",
      });
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }

    const etymology = apiData.origin;
    
    if (!etymology || etymology.trim() === "") {
      // No etymology available
      stats.noEtymology++;
      stats.newlyMarkedMissing++;
      
      console.log(`  ⚠️  No etymology: ${word.word}`);
      
      await db.insert(missingDefinitions).values({
        wordId: word.id,
        reason: "No etymology available in Dictionary API response",
      });
    } else {
      // Has etymology - cache it
      stats.hasEtymology++;
      
      const partOfSpeech = apiData.meanings[0]?.partOfSpeech || "";
      const definition = apiData.meanings[0]?.definitions[0]?.definition || "";
      const pronunciation = apiData.phonetics[0]?.text || "";
      
      const examples: string[] = [];
      for (const meaning of apiData.meanings) {
        for (const def of meaning.definitions) {
          if (def.example) {
            examples.push(def.example);
            if (examples.length >= 3) break;
          }
        }
        if (examples.length >= 3) break;
      }
      
      await db.insert(wordDefinitions).values({
        wordId: word.id,
        pronunciation,
        partOfSpeech,
        definition,
        etymology: etymology.trim(),
        examples: examples.length > 0 ? examples : null,
        fetchedAt: new Date(),
      });
    }

    // Rate limit to ~2 requests per second
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Count words with etymology from cache
  for (const def of cachedDefs) {
    if (def.etymology && def.etymology.trim() !== "") {
      stats.hasEtymology++;
    } else {
      stats.noEtymology++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 ETYMOLOGY ANALYSIS RESULTS");
  console.log("=".repeat(60));
  console.log(`Total curated words:        ${stats.total}`);
  console.log(`Words with etymology:       ${stats.hasEtymology} (${Math.round(stats.hasEtymology/stats.total*100)}%)`);
  console.log(`Words without etymology:    ${stats.noEtymology} (${Math.round(stats.noEtymology/stats.total*100)}%)`);
  console.log(`Dictionary API 404s:        ${stats.api404}`);
  console.log(`Total missing/excluded:     ${stats.alreadyMissing + stats.newlyMarkedMissing}`);
  console.log(`Newly marked as missing:    ${stats.newlyMarkedMissing}`);
  console.log(`API fetches performed:      ${stats.fetched}`);
  console.log("=".repeat(60));
  console.log(`\n✅ Eligible word pool: ${stats.hasEtymology} words\n`);
}

analyzeWords()
  .then(() => {
    console.log("✨ Analysis complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
