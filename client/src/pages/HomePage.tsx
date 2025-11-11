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
import {
  getUserStats,
  markWordAsLearned,
  isWordLearned,
  recordWordView,
} from "@/lib/userStats";

export default function HomePage() {
  const { toast } = useToast();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [stats, setStats] = useState(getUserStats());

  // Fetch random word instead of daily word
  const { data: currentWord, isLoading: isWordLoading } = useQuery<Word>({
    queryKey: ["/api/words/random"],
  });

  const { data: allWords, isLoading: isAllWordsLoading } = useQuery<Word[]>({
    queryKey: ["/api/words"],
  });

  // Record word view when word loads
  useEffect(() => {
    if (currentWord?.id) {
      recordWordView(currentWord.id);
      setStats(getUserStats()); // Refresh stats after recording view
    }
  }, [currentWord?.id]);

  // Mutation to fetch a new random word
  const refreshWordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/words/random");
      return response.json();
    },
    onSuccess: (newWord) => {
      queryClient.setQueryData(["/api/words/random"], newWord);
      setSelectedWord(null); // Reset selected word to show new current word
      setActiveTab("today"); // Switch to today tab
      toast({
        title: "New word loaded!",
        description: `Explore the word "${newWord.word}"`,
      });
    },
    onError: (error) => {
      console.error("Error fetching new word:", error);
      toast({
        title: "Error",
        description: "Failed to load a new word. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePastWordClick = (word: Word) => {
    setSelectedWord(word);
    setActiveTab("today"); // Switch to today tab to show the word
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Mark word as learned
  const handleMarkLearned = (wordId: string) => {
    markWordAsLearned(wordId);
    setStats(getUserStats()); // Refresh stats
    toast({
      title: "Word learned!",
      description: "Great job! Keep building your vocabulary.",
    });
  };

  const displayWord = selectedWord || currentWord;

  if (isWordLoading) {
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

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Unable to load word</h2>
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
          streak={stats.streak}
          wordsLearned={stats.wordsLearned}
          currentLevel={stats.level}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full md:w-auto" data-testid="tabs-navigation">
            <TabsTrigger value="today" data-testid="tab-today">
              Current Word
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
                  onMarkLearned={() => handleMarkLearned(displayWord.id)}
                  onRefresh={() => refreshWordMutation.mutate()}
                  isLearned={isWordLearned(displayWord.id)}
                  isRefreshing={refreshWordMutation.isPending}
                />

                {displayWord.etymology && (
                  <EtymologyTimeline
                    etymology={displayWord.etymology}
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
                words={allWords?.filter((w) => w.id !== currentWord?.id) || []}
                onWordClick={handlePastWordClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
