import { useState } from "react";
import { WordCard } from "@/components/WordCard";
import { EtymologyTimeline } from "@/components/EtymologyTimeline";
import { ExampleSentences } from "@/components/ExampleSentences";
import { ProgressStats } from "@/components/ProgressStats";
import { PastWordsGrid } from "@/components/PastWordsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Word } from "@shared/schema";

export default function HomePage() {
  const [isLearned, setIsLearned] = useState(false);

  //todo: remove mock functionality
  const todayWord: Word = {
    id: "1",
    word: "Ephemeral",
    pronunciation: "/ɪˈfem.ər.əl/",
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time; transient or fleeting in nature.",
    etymology: "From Greek ephēmeros 'lasting only a day', from epi 'upon' + hēmera 'day'.",
    examples: [
      "The ephemeral beauty of cherry blossoms reminds us to appreciate the present moment.",
      "In the digital age, social media posts are ephemeral, quickly forgotten in the endless scroll.",
      "The artist captured the ephemeral quality of light on water in her paintings.",
    ],
    difficulty: 7,
    dateAdded: new Date(),
  };

  //todo: remove mock functionality
  const etymologySteps = [
    {
      language: "Greek",
      period: "Ancient",
      form: "ephēmeros",
      meaning: "lasting only a day",
    },
    {
      language: "Latin",
      period: "Classical",
      form: "ephemerus",
      meaning: "short-lived",
    },
    {
      language: "French",
      period: "16th century",
      form: "éphémère",
      meaning: "transitory",
    },
    {
      language: "English",
      period: "1600s",
      form: "ephemeral",
      meaning: "lasting for a very short time",
    },
  ];

  //todo: remove mock functionality
  const exampleSentences = [
    {
      sentence: "The ephemeral beauty of cherry blossoms reminds us to appreciate the present moment.",
      context: "Literary",
    },
    {
      sentence: "In the digital age, social media posts are ephemeral, quickly forgotten in the endless scroll.",
      context: "Contemporary",
    },
    {
      sentence: "The artist captured the ephemeral quality of light on water in her paintings.",
      context: "Art Criticism",
    },
  ];

  //todo: remove mock functionality
  const pastWords: Word[] = [
    {
      id: "2",
      word: "Serendipity",
      pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
      partOfSpeech: "noun",
      definition: "The occurrence of events by chance in a happy or beneficial way.",
      etymology: null,
      examples: null,
      difficulty: 6,
      dateAdded: new Date("2024-01-09"),
    },
    {
      id: "3",
      word: "Ubiquitous",
      pronunciation: "/juːˈbɪk.wɪ.təs/",
      partOfSpeech: "adjective",
      definition: "Present, appearing, or found everywhere.",
      etymology: null,
      examples: null,
      difficulty: 7,
      dateAdded: new Date("2024-01-08"),
    },
    {
      id: "4",
      word: "Cacophony",
      pronunciation: "/kəˈkɒf.ə.ni/",
      partOfSpeech: "noun",
      definition: "A harsh, discordant mixture of sounds.",
      etymology: null,
      examples: null,
      difficulty: 8,
      dateAdded: new Date("2024-01-07"),
    },
    {
      id: "5",
      word: "Ameliorate",
      pronunciation: "/əˈmiː.li.ə.reɪt/",
      partOfSpeech: "verb",
      definition: "To make something bad or unsatisfactory better.",
      etymology: null,
      examples: null,
      difficulty: 8,
      dateAdded: new Date("2024-01-06"),
    },
    {
      id: "6",
      word: "Perspicacious",
      pronunciation: "/ˌpɜː.spɪˈkeɪ.ʃəs/",
      partOfSpeech: "adjective",
      definition: "Having a ready insight into and understanding of things.",
      etymology: null,
      examples: null,
      difficulty: 9,
      dateAdded: new Date("2024-01-05"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        <ProgressStats streak={7} wordsLearned={42} currentLevel={3} />

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="w-full md:w-auto" data-testid="tabs-navigation">
            <TabsTrigger value="today" data-testid="tab-today">
              Today's Word
            </TabsTrigger>
            <TabsTrigger value="archive" data-testid="tab-archive">
              Past Words
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-8 mt-6">
            <WordCard
              word={todayWord}
              onMarkLearned={() => setIsLearned(true)}
              isLearned={isLearned}
            />

            <EtymologyTimeline
              etymology={todayWord.etymology || ""}
              steps={etymologySteps}
            />

            <ExampleSentences
              word={todayWord.word}
              examples={exampleSentences}
            />
          </TabsContent>

          <TabsContent value="archive" className="mt-6">
            <PastWordsGrid
              words={pastWords}
              onWordClick={(word) => console.log("View word:", word.word)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
