import { readFile } from "fs/promises";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { curatedWords } from "../shared/schema";

interface WordEntry {
  word: string;
  difficulty: number;
}

async function seedWords() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sqlClient = neon(process.env.DATABASE_URL);
  const db = drizzle(sqlClient);

  console.log("Loading words from JSON file...");
  const wordsFilePath = resolve(import.meta.dirname, "../server/data/curated-words-2000.json");
  const wordsData = await readFile(wordsFilePath, "utf-8");
  const words: WordEntry[] = JSON.parse(wordsData);

  console.log(`Found ${words.length} words to seed`);

  // Check if words already exist
  const existingWords = await db.select().from(curatedWords);
  console.log(`Database currently has ${existingWords.length} words`);

  if (existingWords.length > 0) {
    console.log("Database already has words. Clearing existing words first...");
    // Note: This will cascade delete related word_definitions
    await db.delete(curatedWords);
    console.log("Existing words cleared");
  }

  console.log("Inserting words in batches...");
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    await db.insert(curatedWords).values(
      batch.map((w) => ({
        word: w.word,
        difficulty: w.difficulty,
      }))
    );
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${words.length} words`);
  }

  console.log(`✓ Successfully seeded ${inserted} words`);
  
  // Verify
  const finalCount = await db.select().from(curatedWords);
  console.log(`Final count in database: ${finalCount.length} words`);
}

seedWords()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
