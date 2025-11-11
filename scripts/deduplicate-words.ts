import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

type WordEntry = {
  word: string;
  difficulty: number;
};

async function deduplicate() {
  const filePath = resolve(import.meta.dirname, "../server/data/curated-words-2000.json");
  const data = await readFile(filePath, "utf-8");
  const words: WordEntry[] = JSON.parse(data);

  console.log(`Original: ${words.length} words`);

  // Find duplicates - keep first occurrence
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unique: WordEntry[] = [];

  for (const entry of words) {
    const key = entry.word.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(entry.word);
    } else {
      seen.add(key);
      unique.push(entry);
    }
  }

  console.log(`Duplicates found: ${duplicates.length}`);
  console.log(`Unique words: ${unique.length}`);

  if (duplicates.length > 0) {
    console.log("Sample duplicates:", duplicates.slice(0, 10).join(", "));
  }

  // Write deduplicated list
  await writeFile(filePath, JSON.stringify(unique, null, 2));
  console.log("✓ Deduplicated word list saved");
}

deduplicate().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
