import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { Word } from "@shared/schema";

const DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  origin?: string;
}

interface FetchWordResult {
  success: boolean;
  data?: DictionaryApiResponse;
  notFound?: boolean;
}

async function fetchWordFromDictionary(word: string): Promise<FetchWordResult> {
  try {
    const response = await fetch(`${DICTIONARY_API_URL}/${word.toLowerCase()}`);
    
    if (response.status === 404) {
      return { success: false, notFound: true };
    }
    
    if (!response.ok) {
      return { success: false };
    }
    
    const data = await response.json();
    const firstEntry = Array.isArray(data) ? data[0] : null;
    
    if (!firstEntry) {
      return { success: false };
    }
    
    return { success: true, data: firstEntry };
  } catch (error) {
    console.error(`Error fetching word ${word}:`, error);
    return { success: false };
  }
}

function transformDictionaryData(data: DictionaryApiResponse) {
  const pronunciation = data.phonetic || data.phonetics?.[0]?.text || "";
  const mainMeaning = data.meanings[0];
  const partOfSpeech = mainMeaning?.partOfSpeech || "";
  const definition = mainMeaning?.definitions[0]?.definition || "";
  
  const examples: string[] = [];
  data.meanings.forEach((meaning) => {
    meaning.definitions.forEach((def) => {
      if (def.example) examples.push(def.example);
    });
  });

  const etymology = data.origin || "";

  return {
    pronunciation: pronunciation || null,
    partOfSpeech: partOfSpeech || null,
    definition,
    etymology: etymology || null,
    examples: examples.length > 0 ? examples.slice(0, 3) : null,
  };
}

interface GetWordResult {
  success: boolean;
  word?: Word;
  notFound?: boolean;
}

async function getWordWithFreshDefinition(wordId: string): Promise<GetWordResult> {
  const curatedWord = await storage.getCuratedWord(wordId);
  if (!curatedWord) {
    return { success: false };
  }

  // Check if word is already marked as missing
  const missingDef = await storage.getMissingDefinition(wordId);
  if (missingDef) {
    return { success: false, notFound: true };
  }

  // Check existing definition
  const existingDef = await storage.getDefinition(wordId);
  
  // If definition exists and not stale, return it (temporary: allow null etymology until Wiktionary migration)
  if (existingDef && !storage.isDefinitionStale(existingDef)) {
    return {
      success: true,
      word: {
        id: curatedWord.id,
        word: curatedWord.word,
        difficulty: curatedWord.difficulty,
        pronunciation: existingDef.pronunciation,
        partOfSpeech: existingDef.partOfSpeech,
        definition: existingDef.definition,
        etymology: existingDef.etymology, // May be null - WordCard shows fallback message
        examples: existingDef.examples,

      }
    };
  }

  // Definition is stale or doesn't exist - fetch from API
  const fetchResult = await fetchWordFromDictionary(curatedWord.word);
  
  if (fetchResult.success && fetchResult.data) {
    // Got fresh data from API - transform and upsert (temporary: allow null etymology until Wiktionary migration)
    const freshDefData = transformDictionaryData(fetchResult.data);
    const updatedDef = await storage.upsertDefinition(wordId, freshDefData);
    
    return {
      success: true,
      word: {
        id: curatedWord.id,
        word: curatedWord.word,
        difficulty: curatedWord.difficulty,
        pronunciation: updatedDef.pronunciation,
        partOfSpeech: updatedDef.partOfSpeech,
        definition: updatedDef.definition,
        etymology: updatedDef.etymology, // May be null - WordCard shows fallback message
        examples: updatedDef.examples,
        sourceUrl: updatedDef.sourceUrl,
        license: updatedDef.license,
      }
    };
  } else if (fetchResult.notFound) {
    // API returned 404 - mark word as missing
    await storage.markWordAsMissing(wordId, "Dictionary API returned 404");
    return { success: false, notFound: true };
  } else if (existingDef) {
    // API failed but we have stale data - return it anyway
    console.warn(`Using stale definition for ${curatedWord.word} (API fetch failed)`);
    return {
      success: true,
      word: {
        id: curatedWord.id,
        word: curatedWord.word,
        difficulty: curatedWord.difficulty,
        pronunciation: existingDef.pronunciation,
        partOfSpeech: existingDef.partOfSpeech,
        definition: existingDef.definition,
        etymology: existingDef.etymology,
        examples: existingDef.examples,

      }
    };
  }

  // No definition available at all
  return { success: false };
}

// Iterative retry logic with capped attempts
async function getRandomWordWithRetry(maxAttempts: number = 10): Promise<Word | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get random eligible word (excludes missing definitions)
    const randomCuratedWord = await storage.getRandomEligibleWord();
    
    if (!randomCuratedWord) {
      // No eligible words left
      return null;
    }

    const result = await getWordWithFreshDefinition(randomCuratedWord.id);
    
    if (result.success && result.word) {
      return result.word;
    }
    
    if (result.notFound) {
      // Word marked as missing, continue to next attempt
      console.log(`Word ${randomCuratedWord.word} marked as missing (attempt ${attempt + 1}/${maxAttempts})`);
      continue;
    }
    
    // Other errors - continue trying
    console.warn(`Failed to get definition for ${randomCuratedWord.word} (attempt ${attempt + 1}/${maxAttempts})`);
  }
  
  // Exhausted all attempts
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get a random word with retry logic
  app.get("/api/words/random", async (_req, res) => {
    try {
      const word = await getRandomWordWithRetry();
      
      if (!word) {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          message: "Unable to find a word with a valid definition. Please try again later."
        });
      }

      res.json(word);
    } catch (error) {
      console.error("Error getting random word:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all curated words (for archive/past words view)
  app.get("/api/words", async (_req, res) => {
    try {
      const curatedWords = await storage.getAllCuratedWords();
      
      // Get definitions for all words
      const wordsWithDefs = await Promise.all(
        curatedWords.map(async (cw) => {
          const def = await storage.getDefinition(cw.id);
          if (!def) return null;
          
          return {
            id: cw.id,
            word: cw.word,
            difficulty: cw.difficulty,
            pronunciation: def.pronunciation,
            partOfSpeech: def.partOfSpeech,
            definition: def.definition,
            etymology: def.etymology,
            examples: def.examples,
          };
        })
      );

      // Filter out null values
      const validWords = wordsWithDefs.filter((w) => w !== null) as Word[];
      res.json(validWords);
    } catch (error) {
      console.error("Error getting all words:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get specific word by ID
  app.get("/api/words/:id", async (req, res) => {
    try {
      const result = await getWordWithFreshDefinition(req.params.id);
      
      if (!result.success || !result.word) {
        return res.status(404).json({ error: "Word not found" });
      }
      
      res.json(result.word);
    } catch (error) {
      console.error("Error getting word:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = createServer(app);
  return server;
}
