import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { curatedWords, wordDefinitions } from "../shared/schema";
import curatedWordsData from "./data/curated-words.json";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database with curated words...");

  try {
    // Insert curated words and their definitions
    for (const wordData of curatedWordsData) {
      // First, insert the curated word (just word text and difficulty)
      const [insertedWord] = await db
        .insert(curatedWords)
        .values({
          word: wordData.word,
          difficulty: wordData.difficulty,
        })
        .returning();

      console.log(`Inserted word: ${insertedWord.word}`);

      // Then, insert the definition (cached from curated data)
      await db.insert(wordDefinitions).values({
        wordId: insertedWord.id,
        pronunciation: wordData.pronunciation,
        partOfSpeech: wordData.partOfSpeech,
        definition: wordData.definition,
        etymology: wordData.etymology || null,
        examples: wordData.examples || [],
      });

      console.log(`  Added definition for: ${insertedWord.word}`);
    }

    console.log(`\nSuccessfully seeded ${curatedWordsData.length} words!`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
