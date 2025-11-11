import { type User, type InsertUser, type Word, type InsertWord, type UserProgress, type InsertUserProgress } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWord(id: string): Promise<Word | undefined>;
  getWordByWord(word: string): Promise<Word | undefined>;
  createWord(word: InsertWord): Promise<Word>;
  getAllWords(): Promise<Word[]>;
  getWordsByDifficulty(minDifficulty: number): Promise<Word[]>;
  
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getWordProgress(userId: string, wordId: string): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: string, learned: number): Promise<UserProgress | undefined>;
  getLearnedWordsCount(userId: string): Promise<number>;
  getStreak(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private words: Map<string, Word>;
  private userProgress: Map<string, UserProgress>;

  constructor() {
    this.users = new Map();
    this.words = new Map();
    this.userProgress = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getWord(id: string): Promise<Word | undefined> {
    return this.words.get(id);
  }

  async getWordByWord(word: string): Promise<Word | undefined> {
    return Array.from(this.words.values()).find(
      (w) => w.word.toLowerCase() === word.toLowerCase(),
    );
  }

  async createWord(insertWord: InsertWord): Promise<Word> {
    const id = randomUUID();
    const word: Word = { 
      id,
      word: insertWord.word,
      pronunciation: insertWord.pronunciation ?? null,
      partOfSpeech: insertWord.partOfSpeech ?? null,
      definition: insertWord.definition,
      etymology: insertWord.etymology ?? null,
      examples: insertWord.examples ?? null,
      difficulty: insertWord.difficulty,
      dateAdded: new Date()
    };
    this.words.set(id, word);
    return word;
  }

  async getAllWords(): Promise<Word[]> {
    return Array.from(this.words.values()).sort((a, b) => {
      const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getWordsByDifficulty(minDifficulty: number): Promise<Word[]> {
    return Array.from(this.words.values()).filter(
      (word) => word.difficulty >= minDifficulty,
    );
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.userId === userId,
    );
  }

  async getWordProgress(userId: string, wordId: string): Promise<UserProgress | undefined> {
    return Array.from(this.userProgress.values()).find(
      (progress) => progress.userId === userId && progress.wordId === wordId,
    );
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const progress: UserProgress = {
      id,
      userId: insertProgress.userId ?? null,
      wordId: insertProgress.wordId ?? null,
      learned: insertProgress.learned ?? null,
      dateViewed: new Date(),
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async updateUserProgress(id: string, learned: number): Promise<UserProgress | undefined> {
    const progress = this.userProgress.get(id);
    if (!progress) return undefined;
    
    const updated = { ...progress, learned };
    this.userProgress.set(id, updated);
    return updated;
  }

  async getLearnedWordsCount(userId: string): Promise<number> {
    return Array.from(this.userProgress.values()).filter(
      (progress) => progress.userId === userId && progress.learned === 1,
    ).length;
  }

  async getStreak(userId: string): Promise<number> {
    const progressList = Array.from(this.userProgress.values())
      .filter((progress) => progress.userId === userId)
      .sort((a, b) => {
        const dateA = a.dateViewed ? new Date(a.dateViewed).getTime() : 0;
        const dateB = b.dateViewed ? new Date(b.dateViewed).getTime() : 0;
        return dateB - dateA;
      });

    if (progressList.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const progress of progressList) {
      if (!progress.dateViewed) break;
      
      const viewDate = new Date(progress.dateViewed);
      viewDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - viewDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const storage = new MemStorage();
