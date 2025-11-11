import { WordCard } from "../WordCard";
import type { Word } from "@shared/schema";

export default function WordCardExample() {
  const mockWord: Word = {
    id: "1",
    word: "Ephemeral",
    pronunciation: "/ɪˈfem.ər.əl/",
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time; transient or fleeting in nature.",
    etymology: "From Greek ephēmeros 'lasting only a day'",
    examples: ["The ephemeral beauty of cherry blossoms", "Social media posts are ephemeral"],
    difficulty: 7,
    dateAdded: new Date(),
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <WordCard word={mockWord} onMarkLearned={() => console.log("Marked as learned")} />
    </div>
  );
}
