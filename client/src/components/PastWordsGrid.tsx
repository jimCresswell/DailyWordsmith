import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Word } from "@shared/schema";
import { useState } from "react";

interface PastWordsGridProps {
  words: Word[];
  onWordClick?: (word: Word) => void;
}

export function PastWordsGrid({ words, onWordClick }: PastWordsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWords = words.filter((word) =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search past words..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-words"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => (
          <Card
            key={word.id}
            className="p-4 space-y-2 hover-elevate cursor-pointer"
            onClick={() => onWordClick?.(word)}
            data-testid={`card-word-${word.id}`}
          >
            <h3 className="text-xl font-semibold">{word.word}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {word.definition}
            </p>
            <p className="text-xs text-muted-foreground">
              {word.dateAdded ? new Date(word.dateAdded).toLocaleDateString() : ""}
            </p>
          </Card>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No words found matching "{searchQuery}"
        </div>
      )}
    </div>
  );
}
