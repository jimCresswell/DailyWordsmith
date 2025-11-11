import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWordSchema, insertUserProgressSchema } from "@shared/schema";
import curatedWords from "./data/curated-words.json";

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

function transformDictionaryData(data: DictionaryApiResponse, difficulty: number) {
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
    word: data.word,
    pronunciation,
    partOfSpeech,
    definition,
    etymology: etymology || null,
    examples: examples.length > 0 ? examples.slice(0, 3) : null,
    difficulty,
  };
}

async function getDailyWord(): Promise<any> {
  const allWords = await storage.getAllWords();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayWord = allWords.find((word) => {
    if (!word.dateAdded) return false;
    const wordDate = new Date(word.dateAdded);
    wordDate.setHours(0, 0, 0, 0);
    return wordDate.getTime() === today.getTime();
  });

  if (todayWord) {
    return todayWord;
  }

  const unseenCuratedWords = curatedWords.filter(
    (word) => !allWords.some((w) => w.word.toLowerCase() === word.word.toLowerCase())
  );

  if (unseenCuratedWords.length === 0) {
    return allWords[0] || curatedWords[0];
  }

  const randomCuratedWord = unseenCuratedWords[Math.floor(Math.random() * unseenCuratedWords.length)];
  
  const dictionaryData = await fetchWordFromDictionary(randomCuratedWord.word);

  let wordData;
  if (dictionaryData) {
    wordData = transformDictionaryData(dictionaryData, randomCuratedWord.difficulty);
  } else {
    wordData = {
      word: randomCuratedWord.word,
      pronunciation: randomCuratedWord.pronunciation,
      partOfSpeech: randomCuratedWord.partOfSpeech,
      definition: randomCuratedWord.definition,
      etymology: randomCuratedWord.etymology || null,
      examples: randomCuratedWord.examples || null,
      difficulty: randomCuratedWord.difficulty,
    };
  }
  
  const newWord = await storage.createWord(wordData);
  return newWord;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/words/daily", async (req, res) => {
    try {
      const dailyWord = await getDailyWord();
      if (!dailyWord) {
        return res.status(404).json({ error: "Could not fetch daily word" });
      }
      res.json(dailyWord);
    } catch (error) {
      console.error("Error getting daily word:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/words", async (req, res) => {
    try {
      const words = await storage.getAllWords();
      res.json(words);
    } catch (error) {
      console.error("Error getting words:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/words/:id", async (req, res) => {
    try {
      const word = await storage.getWord(req.params.id);
      if (!word) {
        return res.status(404).json({ error: "Word not found" });
      }
      res.json(word);
    } catch (error) {
      console.error("Error getting word:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/progress/stats", async (req, res) => {
    try {
      const userId = "demo-user";
      
      const wordsLearned = await storage.getLearnedWordsCount(userId);
      const streak = await storage.getStreak(userId);
      const level = Math.floor(wordsLearned / 10) + 1;

      res.json({
        wordsLearned,
        streak,
        level,
      });
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const validated = insertUserProgressSchema.parse(req.body);
      
      const userId = validated.userId || "demo-user";
      const wordId = validated.wordId!;
      
      const existing = await storage.getWordProgress(userId, wordId);
      
      if (existing) {
        const updated = await storage.updateUserProgress(existing.id, validated.learned || 0);
        return res.json(updated);
      }
      
      const progress = await storage.createUserProgress({
        ...validated,
        userId,
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/progress/:wordId", async (req, res) => {
    try {
      const userId = "demo-user";
      const wordId = req.params.wordId;
      
      const progress = await storage.getWordProgress(userId, wordId);
      
      res.json(progress || null);
    } catch (error) {
      console.error("Error getting progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
