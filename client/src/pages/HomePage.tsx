import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { WordCard } from "@/components/WordCard";
import { EtymologyTimeline } from "@/components/EtymologyTimeline";
import { ExampleSentences } from "@/components/ExampleSentences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { Word } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  toggleBookmark,
  isWordBookmarked,
  getBookmarkedWords,
} from "@/lib/bookmarks";

export default function HomePage() {
  const { toast } = useToast();
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [bookmarkedWordIds, setBookmarkedWordIds] = useState<string[]>([]);

  // Fetch random word
  const { data: currentWord, isLoading: isWordLoading } = useQuery<Word>({
    queryKey: ["/api/words/random"],
  });

  // Fetch all words for archive
  const { data: allWords } = useQuery<Word[]>({
    queryKey: ["/api/words"],
  });

  // Load bookmarks on mount
  useEffect(() => {
    const bookmarks = getBookmarkedWords();
    setBookmarkedWordIds(bookmarks.map((b) => b.wordId));
  }, []);

  // Mutation to fetch a new random word
  const refreshWordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/words/random");
      return response.json();
    },
    onSuccess: (newWord) => {
      queryClient.setQueryData(["/api/words/random"], newWord);
      setSelectedWord(null);
      setActiveTab("today");
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

  const handleBookmarkWordClick = (word: Word) => {
    setSelectedWord(word);
    setActiveTab("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle bookmark
  const handleToggleBookmark = (wordId: string, word: string, definition: string) => {
    const nowBookmarked = toggleBookmark(wordId, word, definition);
    const bookmarks = getBookmarkedWords();
    setBookmarkedWordIds(bookmarks.map((b) => b.wordId));
    
    toast({
      title: nowBookmarked ? "Bookmarked!" : "Bookmark removed",
      description: nowBookmarked 
        ? "Word saved to your bookmarks." 
        : "Word removed from bookmarks.",
    });
  };

  const displayWord = selectedWord || currentWord;

  // Get bookmarked words for display - use stored bookmark data directly
  const bookmarkedWords = getBookmarkedWords();

  if (isWordLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 space-y-8">
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
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full md:w-auto" data-testid="tabs-navigation">
            <TabsTrigger value="today" data-testid="tab-today">
              Current Word
            </TabsTrigger>
            <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">
              Bookmarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-8 mt-6">
            {displayWord && (
              <>
                <WordCard
                  word={displayWord}
                  onBookmark={() => handleToggleBookmark(displayWord.id, displayWord.word, displayWord.definition)}
                  onRefresh={() => refreshWordMutation.mutate()}
                  isBookmarked={bookmarkedWordIds.includes(displayWord.id)}
                  isRefreshing={refreshWordMutation.isPending}
                />

                {displayWord.examples && displayWord.examples.length > 0 && (
                  <ExampleSentences
                    word={displayWord.word}
                    examples={displayWord.examples}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-6">
            {bookmarkedWords.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  No bookmarked words yet. Bookmark interesting words to save them here!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarkedWords.map((bookmark) => (
                  <Card
                    key={bookmark.wordId}
                    className="p-4 cursor-pointer hover-elevate active-elevate-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={async () => {
                      // Fetch the full word by ID when clicking bookmark
                      const response = await apiRequest("GET", `/api/words/${bookmark.wordId}`);
                      const word: Word = await response.json();
                      setSelectedWord(word);
                      setActiveTab("today");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const response = await apiRequest("GET", `/api/words/${bookmark.wordId}`);
                        const word: Word = await response.json();
                        setSelectedWord(word);
                        setActiveTab("today");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View word ${bookmark.word}`}
                    data-testid={`bookmark-card-${bookmark.wordId}`}
                  >
                    <h3 className="text-xl font-bold mb-2" data-testid={`bookmark-word-${bookmark.wordId}`}>
                      {bookmark.word}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bookmark.definition}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
