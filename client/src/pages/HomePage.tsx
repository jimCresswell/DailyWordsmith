import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WordCard } from "@/components/WordCard";
import { EtymologyTimeline } from "@/components/EtymologyTimeline";
import { ExampleSentences } from "@/components/ExampleSentences";
import { ProgressStats } from "@/components/ProgressStats";
import { PastWordsGrid } from "@/components/PastWordsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Word } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProgressStats {
  wordsLearned: number;
  streak: number;
  level: number;
}

export default function HomePage() {
  const { toast } = useToast();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const { data: dailyWord, isLoading: isDailyWordLoading } = useQuery<Word>({
    queryKey: ["/api/words/daily"],
  });

  const { data: allWords, isLoading: isAllWordsLoading } = useQuery<Word[]>({
    queryKey: ["/api/words"],
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<ProgressStats>({
    queryKey: ["/api/progress/stats"],
  });

  const { data: wordProgress } = useQuery<{ learned: number } | null>({
    queryKey: ["/api/progress", dailyWord?.id],
    enabled: !!dailyWord?.id,
  });

  const markLearnedMutation = useMutation({
    mutationFn: async (wordId: string) => {
      return apiRequest("/api/progress", "POST", {
        wordId,
        userId: "demo-user",
        learned: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/stats"] });
      toast({
        title: "Word learned!",
        description: "Great job! Keep building your vocabulary.",
      });
    },
  });

  const isLearned = wordProgress?.learned === 1;

  const etymologySteps = dailyWord?.etymology
    ? parseEtymologySteps(dailyWord.etymology)
    : [];

  const displayWord = selectedWord || dailyWord;

  if (isDailyWordLoading || isStatsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!dailyWord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Unable to load daily word</h2>
          <p className="text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        <ProgressStats
          streak={stats?.streak || 0}
          wordsLearned={stats?.wordsLearned || 0}
          currentLevel={stats?.level || 1}
        />

        <Tabs
          defaultValue="today"
          className="w-full"
          onValueChange={() => setSelectedWord(null)}
        >
          <TabsList className="w-full md:w-auto" data-testid="tabs-navigation">
            <TabsTrigger value="today" data-testid="tab-today">
              Today's Word
            </TabsTrigger>
            <TabsTrigger value="archive" data-testid="tab-archive">
              Past Words
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-8 mt-6">
            {displayWord && (
              <>
                <WordCard
                  word={displayWord}
                  onMarkLearned={() => markLearnedMutation.mutate(displayWord.id)}
                  isLearned={displayWord.id === dailyWord.id ? isLearned : false}
                />

                {displayWord.etymology && (
                  <EtymologyTimeline
                    etymology={displayWord.etymology}
                    steps={etymologySteps}
                  />
                )}

                {displayWord.examples && displayWord.examples.length > 0 && (
                  <ExampleSentences
                    word={displayWord.word}
                    examples={displayWord.examples}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            {isAllWordsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <PastWordsGrid
                words={allWords?.filter((w) => w.id !== dailyWord?.id) || []}
                onWordClick={(word) => {
                  setSelectedWord(word);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function parseEtymologySteps(etymology: string): Array<{
  language: string;
  period: string;
  form: string;
  meaning: string;
}> {
  const steps: Array<{
    language: string;
    period: string;
    form: string;
    meaning: string;
  }> = [];

  const patterns = [
    /from (\w+) ([^,]+),?/gi,
    /(\w+) ([^,]+)/gi,
  ];

  const matches = etymology.match(/from \w+ [^,]+/gi);
  
  if (matches && matches.length > 0) {
    matches.forEach((match) => {
      const parts = match.match(/from (\w+) (.+)/i);
      if (parts) {
        steps.push({
          language: parts[1],
          period: "Historical",
          form: parts[2].replace(/['"]/g, ""),
          meaning: parts[2].replace(/['"]/g, ""),
        });
      }
    });
  }

  return steps;
}
