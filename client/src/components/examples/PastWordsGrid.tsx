import { PastWordsGrid } from "../PastWordsGrid";
import type { Word } from "@shared/schema";

export default function PastWordsGridExample() {
  const mockWords: Word[] = [
    {
      id: "1",
      word: "Ephemeral",
      pronunciation: "/ɪˈfem.ər.əl/",
      partOfSpeech: "adjective",
      definition: "Lasting for a very short time; transient or fleeting in nature.",
      etymology: null,
      examples: null,
      difficulty: 7,
      dateAdded: new Date("2024-01-10"),
    },
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
    <div className="p-6 max-w-6xl mx-auto">
      <PastWordsGrid words={mockWords} onWordClick={(word) => console.log("Clicked:", word.word)} />
    </div>
  );
}
