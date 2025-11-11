import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Example {
  sentence: string;
  context?: string;
}

interface ExampleSentencesProps {
  word: string;
  examples: string[] | Example[];
}

export function ExampleSentences({ word, examples }: ExampleSentencesProps) {
  const renderExample = (example: string | Example, index: number) => {
    const sentence = typeof example === "string" ? example : example.sentence;
    const context = typeof example === "string" ? undefined : example.context;

    const parts = sentence.split(new RegExp(`(\\b${word}\\b)`, "gi"));

    return (
      <Card key={index} className="p-4 space-y-2" data-testid={`example-${index}`}>
        <p className="text-base leading-relaxed">
          {parts.map((part, i) =>
            part.toLowerCase() === word.toLowerCase() ? (
              <strong key={i} className="font-semibold">
                {part}
              </strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
        {context && (
          <Badge variant="outline" className="text-xs">
            {context}
          </Badge>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" data-testid="text-examples-header">
        Example Usage
      </h2>
      <div className="space-y-3">
        {examples.map((example, index) => renderExample(example, index))}
      </div>
    </div>
  );
}
