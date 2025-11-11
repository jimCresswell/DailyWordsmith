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

async function fetchWordFromDictionary(word: string): Promise<DictionaryApiResponse | null> {
  try {
    const response = await fetch(`${DICTIONARY_API_URL}/${word.toLowerCase()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) ? data[0] : null;
  } catch (error) {
    console.error(`Error fetching word ${word}:`, error);
    return null;
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

async function getWordWithFreshDefinition(wordId: string): Promise<Word | null> {
  const curatedWord = await storage.getCuratedWord(wordId);
  if (!curatedWord) return null;

  // Check existing definition
  const existingDef = await storage.getDefinition(wordId);
  
  // If definition exists and is fresh, return it
  if (existingDef && !storage.isDefinitionStale(existingDef)) {
    return {
      id: curatedWord.id,
      word: curatedWord.word,
      difficulty: curatedWord.difficulty,
      pronunciation: existingDef.pronunciation,
      partOfSpeech: existingDef.partOfSpeech,
      definition: existingDef.definition,
      etymology: existingDef.etymology,
      examples: existingDef.examples,
    };
  }

  // Definition is stale or doesn't exist - fetch from API
  const dictionaryData = await fetchWordFromDictionary(curatedWord.word);
  
  if (dictionaryData) {
    // Got fresh data from API - upsert it
    const freshDefData = transformDictionaryData(dictionaryData);
    const updatedDef = await storage.upsertDefinition(wordId, freshDefData);
    
    return {
      id: curatedWord.id,
      word: curatedWord.word,
      difficulty: curatedWord.difficulty,
      pronunciation: updatedDef.pronunciation,
      partOfSpeech: updatedDef.partOfSpeech,
      definition: updatedDef.definition,
      etymology: updatedDef.etymology,
      examples: updatedDef.examples,
    };
  } else if (existingDef) {
    // API failed but we have stale data - return it anyway
    console.warn(`Using stale definition for ${curatedWord.word} (API fetch failed)`);
    return {
      id: curatedWord.id,
      word: curatedWord.word,
      difficulty: curatedWord.difficulty,
      pronunciation: existingDef.pronunciation,
      partOfSpeech: existingDef.partOfSpeech,
      definition: existingDef.definition,
      etymology: existingDef.etymology,
      examples: existingDef.examples,
    };
  }

  // No definition available at all
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get a random word
  app.get("/api/words/random", async (_req, res) => {
    try {
      const randomCuratedWord = await storage.getRandomCuratedWord();
      if (!randomCuratedWord) {
        return res.status(404).json({ error: "No words available" });
      }

      const word = await getWordWithFreshDefinition(randomCuratedWord.id);
      if (!word) {
        return res.status(404).json({ error: "Could not fetch word definition" });
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
      const validWords = wordsWithDefs.filter((w): w is Word => w !== null);
      res.json(validWords);
    } catch (error) {
      console.error("Error getting all words:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get specific word by ID
  app.get("/api/words/:id", async (req, res) => {
    try {
      const word = await getWordWithFreshDefinition(req.params.id);
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      console.error("Error getting word:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = createServer(app);
  return server;
}
