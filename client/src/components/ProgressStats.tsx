import { Card } from "@/components/ui/card";
import { Flame, BookOpen, Trophy } from "lucide-react";

interface ProgressStatsProps {
  streak: number;
  wordsLearned: number;
  currentLevel: number;
}

export function ProgressStats({ streak, wordsLearned, currentLevel }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">Daily Streak</span>
        </div>
        <p className="text-4xl font-bold" data-testid="text-streak">
          {streak}
        </p>
        <p className="text-sm text-muted-foreground">days in a row</p>
      </Card>

      <Card className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">Words Learned</span>
        </div>
        <p className="text-4xl font-bold" data-testid="text-words-learned">
          {wordsLearned}
        </p>
        <p className="text-sm text-muted-foreground">total vocabulary</p>
      </Card>

      <Card className="p-6 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-medium">Current Level</span>
        </div>
        <p className="text-4xl font-bold" data-testid="text-level">
          {currentLevel}
        </p>
        <p className="text-sm text-muted-foreground">advanced learner</p>
      </Card>
    </div>
  );
}
