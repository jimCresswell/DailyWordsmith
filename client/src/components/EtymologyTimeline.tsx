import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EtymologyStep {
  language: string;
  period: string;
  form: string;
  meaning: string;
}

interface EtymologyTimelineProps {
  etymology: string;
  steps?: EtymologyStep[];
}

export function EtymologyTimeline({ etymology, steps }: EtymologyTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="text-etymology-header">Etymology</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-etymology"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Details
            </>
          )}
        </Button>
      </div>

      <p className="text-muted-foreground leading-relaxed" data-testid="text-etymology">
        {etymology}
      </p>

      {isExpanded && steps && steps.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground">LINGUISTIC JOURNEY</h3>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4" data-testid={`etymology-step-${index}`}>
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  {index < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold">{step.language}</span>
                    <span className="text-sm text-muted-foreground">({step.period})</span>
                  </div>
                  <p className="text-sm">
                    <span className="font-mono">{step.form}</span> — {step.meaning}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
