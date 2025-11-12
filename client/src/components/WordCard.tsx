import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Bookmark, RefreshCw, ExternalLink } from "lucide-react";
import type { Word } from "@shared/schema";

interface WordCardProps {
  word: Word;
  onBookmark?: () => void;
  onRefresh?: () => void;
  isBookmarked?: boolean;
  isRefreshing?: boolean;
}

export function WordCard({ 
  word, 
  onBookmark, 
  onRefresh, 
  isBookmarked = false,
  isRefreshing = false 
}: WordCardProps) {
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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBookmark}
            className={isBookmarked ? "text-primary" : ""}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this word"}
            data-testid="button-bookmark"
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="sr-only">
              {isBookmarked ? "Remove bookmark" : "Bookmark this word"}
            </span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">DEFINITION</h2>
          <p className="text-lg leading-relaxed" data-testid="text-definition">
            {word.definition}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">ETYMOLOGY</h2>
          {word.etymology ? (
            <p className="text-base leading-relaxed text-muted-foreground" data-testid="text-etymology">
              {word.etymology}
            </p>
          ) : (
            <p className="text-base leading-relaxed italic text-muted-foreground/60" data-testid="text-etymology-unavailable">
              Etymology unavailable — Wiktionary import in progress
            </p>
          )}
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        {onRefresh && (
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            data-testid="button-refresh-word"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Loading..." : "New Word"}
          </Button>
        )}
      </div>

      {/* Wiktionary Attribution */}
      {word.sourceUrl && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Source:</span>
              <a 
                href={word.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
                data-testid="link-wiktionary-source"
              >
                Wiktionary
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {word.license && (
              <span className="text-xs" data-testid="text-license">
                {word.license}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
