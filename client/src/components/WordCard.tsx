import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, BookmarkPlus, Check } from "lucide-react";
import type { Word } from "@shared/schema";

interface WordCardProps {
  word: Word;
  onMarkLearned?: () => void;
  isLearned?: boolean;
}

export function WordCard({ word, onMarkLearned, isLearned = false }: WordCardProps) {
  const handlePlayPronunciation = () => {
    console.log("Playing pronunciation for:", word.word);
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-5xl md:text-6xl font-bold" data-testid="text-word">
              {word.word}
            </h1>
            {word.pronunciation && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPronunciation}
                data-testid="button-pronunciation"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            )}
          </div>
          {word.pronunciation && (
            <p className="text-lg italic text-muted-foreground" data-testid="text-pronunciation">
              {word.pronunciation}
            </p>
          )}
          {word.partOfSpeech && (
            <Badge variant="secondary" data-testid="badge-part-of-speech">
              {word.partOfSpeech}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          data-testid="button-bookmark"
        >
          <BookmarkPlus className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">DEFINITION</h2>
          <p className="text-lg leading-relaxed" data-testid="text-definition">
            {word.definition}
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button
          onClick={onMarkLearned}
          disabled={isLearned}
          className="w-full md:w-auto"
          data-testid="button-mark-learned"
        >
          {isLearned ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Marked as Learned
            </>
          ) : (
            "Mark as Learned"
          )}
        </Button>
      </div>
    </Card>
  );
}
