import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Brain } from "lucide-react";
import { OnboardingStep } from "@/lib/types";

const PRIORITY_STYLES = {
  high: "border-destructive/30 bg-destructive/5 text-destructive",
  medium: "border-yellow-500/30 bg-yellow-50 text-yellow-700",
  low: "border-primary/30 bg-primary/5 text-primary",
};

interface StepContentProps {
  step: OnboardingStep;
  onComplete: (id: number) => void;
}

export default function StepContent({ step, onComplete }: StepContentProps) {
  return (
    <div className="animate-fade-in max-w-2xl">
      {/* Header badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wide">
          Step {step.id}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
          step.status === "completed"
            ? "bg-primary/10 text-primary"
            : step.status === "in_progress"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-muted text-muted-foreground"
        }`}>
          {step.status.replace("_", " ")}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark text-primary flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> AI-Generated
        </span>
      </div>

      {/* Title & description */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold leading-tight mb-2">{step.title}</h2>
        <p className="text-base text-muted-foreground">{step.description}</p>
      </div>

      {/* AI-Generated Details */}
      <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-xl border-2 border-primary/20 p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-primary/10">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-primary flex items-center gap-2">
              AI Guidance
              <span className="text-[9px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Personalized
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Tailored recommendations for your workflow
            </p>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap bg-card/50 rounded-lg p-4 border border-border/50">
            {step.details}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-primary/10 flex items-center gap-2 text-[10px] text-muted-foreground">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="font-mono">
            Generated based on your company profile and document analysis
          </span>
        </div>
      </div>

      {/* Dependencies */}
      {step.dependencies && step.dependencies.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2">
            Prerequisites
          </p>
          <div className="flex flex-wrap gap-2">
            {step.dependencies.map((dep, i) => (
              <span 
                key={i} 
                className="text-xs font-mono bg-muted rounded px-3 py-1.5 border border-border"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {(step.status === "in_progress" || step.status === "pending") && (
        <Button 
          onClick={() => onComplete(step.id)} 
          className="font-mono text-xs"
          size="sm"
        >
          Mark as Done
        </Button>
      )}
      
      {step.status === "completed" && (
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-mono font-semibold">Completed</span>
        </div>
      )}
    </div>
  );
}
