import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { curatedWords } from "../shared/schema";

interface WordEntry {
  word: string;
  difficulty: number;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sqlClient = neon(process.env.DATABASE_URL);
  const db = drizzle(sqlClient);

  try {
    // Read current words
    const currentWordsPath = resolve(import.meta.dirname, '../server/data/curated-words-2000.json');
    const currentWords: WordEntry[] = JSON.parse(await readFile(currentWordsPath, 'utf-8'));
    
    // Read new advanced words
    const newWordsPath = resolve(import.meta.dirname, '../server/data/advanced-words-to-add.json');
    const newWords: WordEntry[] = JSON.parse(await readFile(newWordsPath, 'utf-8'));
    
    console.log(`Current word count: ${currentWords.length}`);
    console.log(`New words to add: ${newWords.length}`);
    
    // Merge word lists
    const mergedWords = [...currentWords, ...newWords];
    
    // Sort by difficulty (highest first), then alphabetically
    mergedWords.sort((a, b) => {
      if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
      return a.word.localeCompare(b.word);
    });
    
    console.log(`Total words after merge: ${mergedWords.length}`);
    
    // Save merged list
    const mergedPath = resolve(import.meta.dirname, '../server/data/curated-words-merged.json');
    await writeFile(mergedPath, JSON.stringify(mergedWords, null, 2));
    console.log(`Saved merged list to ${mergedPath}`);
    
    // Seed only the new words to database
    console.log(`\nSeeding ${newWords.length} new words to database...`);
    
    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < newWords.length; i += batchSize) {
      const batch = newWords.slice(i, i + batchSize);
      
      await db.insert(curatedWords)
        .values(batch.map(w => ({
          word: w.word,
          difficulty: w.difficulty
        })))
        .onConflictDoNothing();
      
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${newWords.length} words`);
    }
    
    // Verify total count in database
    const allWords = await db.select().from(curatedWords);
    console.log(`\nDatabase now contains ${allWords.length} total words`);
    
    console.log('\n✓ Successfully merged and seeded advanced words!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
