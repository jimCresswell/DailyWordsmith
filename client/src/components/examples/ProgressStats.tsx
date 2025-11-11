import { ProgressStats } from "../ProgressStats";

export default function ProgressStatsExample() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <ProgressStats streak={7} wordsLearned={42} currentLevel={3} />
    </div>
  );
}
