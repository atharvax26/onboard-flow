import { useState } from "react";
import { MOCK_ONBOARDING_STEPS } from "@/lib/mock-data";
import { OnboardingStep } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Play, Clock, GitBranch } from "lucide-react";

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(
    MOCK_ONBOARDING_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "in_progress" : "pending" }))
  );
  const [activeStep, setActiveStep] = useState(0);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percent = Math.round((completedCount / steps.length) * 100);

  const completeStep = (id: number) => {
    setSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) return { ...s, status: "completed" as const, timeSpent: `${Math.floor(Math.random() * 20 + 5)}m` };
        return s;
      });
      // Set next pending step to in_progress
      const nextIdx = updated.findIndex((s) => s.status === "pending");
      if (nextIdx !== -1) {
        updated[nextIdx] = { ...updated[nextIdx], status: "in_progress" };
        setActiveStep(nextIdx);
      }
      return updated;
    });
  };

  const active = steps[activeStep];

  return (
    <div className="flex flex-col md:flex-row min-h-[60vh]">
      {/* Left sidebar - Explorer */}
      <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border p-4 bg-chrome/50">
        <div className="mb-4">
          <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2">Progress</p>
          <Progress value={percent} className="h-2" />
          <p className="text-xs font-mono text-muted-foreground mt-1">{completedCount}/{steps.length} completed</p>
        </div>
        <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2">Steps</p>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                i === activeStep ? "bg-card border border-primary/30 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              {step.status === "completed" ? (
                <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : step.status === "in_progress" ? (
                <Play className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate font-mono">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center - Step details */}
      <div className="flex-1 p-6 md:p-8">
        {active && (
          <div className="animate-slide-up max-w-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">Step {active.id}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded capitalize ${
                active.status === "completed" ? "bg-primary/10 text-primary" : active.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
              }`}>{active.status.replace("_", " ")}</span>
            </div>
            <h2 className="text-xl font-semibold mt-2 mb-2">{active.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{active.description}</p>
            <div className="bg-background rounded-lg border border-border p-4 mb-6 pattern-grid">
              <p className="text-sm leading-relaxed">{active.details}</p>
            </div>
            {active.status === "in_progress" && (
              <Button onClick={() => completeStep(active.id)} className="font-mono text-sm">
                Mark Complete ✓
              </Button>
            )}
            {active.status === "completed" && (
              <p className="text-sm text-primary font-mono flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Completed
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right sidebar - Property Inspector */}
      <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border p-4 bg-chrome/50">
        <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-3">Properties</p>
        {active && (
          <div className="space-y-3">
            {[
              { label: "Status", value: active.status.replace("_", " ") },
              { label: "Time Spent", value: active.timeSpent },
              { label: "Step ID", value: `#${active.id}` },
            ].map((prop) => (
              <div key={prop.label} className="grid grid-cols-[72px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{prop.label}</span>
                <span className="text-xs font-mono bg-card rounded px-2 py-1 border border-border capitalize">{prop.value}</span>
              </div>
            ))}
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <GitBranch className="w-3 h-3" /> Dependencies
              </span>
              {active.dependencies.length > 0 ? (
                active.dependencies.map((d, i) => (
                  <span key={i} className="inline-block text-[10px] font-mono bg-card rounded px-2 py-0.5 border border-border mr-1 mb-1">{d}</span>
                ))
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground">None</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Estimated
              </span>
              <span className="text-xs font-mono">{Math.floor(Math.random() * 20 + 10)}min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
