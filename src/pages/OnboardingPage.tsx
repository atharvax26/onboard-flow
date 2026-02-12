import { useState, useMemo } from "react";
import { MOCK_ONBOARDING_STEPS } from "@/lib/mock-data";
import { OnboardingStep } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import StepContent from "@/components/onboarding/StepContent";
import {
  CheckCircle, Circle, Play, Clock, GitBranch, Sparkles, Brain,
  Building2, FileText, BarChart3, Shield, Info
} from "lucide-react";

const MATURITY_LEVELS = [
  { label: "Startup", range: [0, 25], color: "text-destructive", bg: "bg-destructive/10" },
  { label: "Growing", range: [26, 50], color: "text-yellow-600", bg: "bg-yellow-100" },
  { label: "Established", range: [51, 75], color: "text-primary", bg: "bg-primary/10" },
  { label: "Enterprise", range: [76, 100], color: "text-primary", bg: "bg-primary/10" },
];

const AI_INSIGHTS: Record<number, { tag: string; priority: "high" | "medium" | "low" }> = {
  1: { tag: "Foundation", priority: "high" },
  2: { tag: "Collaboration", priority: "high" },
  3: { tag: "Regulatory", priority: "high" },
  4: { tag: "Connectivity", priority: "medium" },
  5: { tag: "Data Layer", priority: "medium" },
  6: { tag: "Automation", priority: "medium" },
  7: { tag: "Enablement", priority: "low" },
  8: { tag: "Launch", priority: "low" },
};

const PRIORITY_STYLES = {
  high: "border-destructive/30 bg-destructive/5 text-destructive",
  medium: "border-yellow-500/30 bg-yellow-50 text-yellow-700",
  low: "border-primary/30 bg-primary/5 text-primary",
};

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(
    MOCK_ONBOARDING_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "in_progress" : "pending" }))
  );
  const [activeStep, setActiveStep] = useState(0);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percent = Math.round((completedCount / steps.length) * 100);

  const maturity = useMemo(() => {
    return MATURITY_LEVELS.find((m) => percent >= m.range[0] && percent <= m.range[1]) || MATURITY_LEVELS[0];
  }, [percent]);

  const completeStep = (id: number) => {
    setSteps((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id) return { ...s, status: "completed" as const, timeSpent: `${Math.floor(Math.random() * 20 + 5)}m` };
        return s;
      });
      const nextIdx = updated.findIndex((s) => s.status === "pending");
      if (nextIdx !== -1) {
        updated[nextIdx] = { ...updated[nextIdx], status: "in_progress" };
        setActiveStep(nextIdx);
      }
      return updated;
    });
  };

  const active = steps[activeStep];
  const insight = active ? AI_INSIGHTS[active.id] : null;

  return (
    <div className="flex flex-col md:flex-row min-h-[60vh]">
      {/* Left sidebar - AI Workflow Explorer */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-4 bg-chrome/50">
        {/* AI Engine Banner */}
        <div className="mb-4 p-2.5 rounded-md bg-dark text-dark-foreground">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary">AI Workflow Engine</span>
          </div>
          <p className="text-[10px] font-mono text-dark-foreground/60 leading-relaxed">
            Steps dynamically generated from company profile &amp; document analysis
          </p>
        </div>

        {/* Maturity Assessment */}
        <div className="mb-4 p-2.5 rounded-md border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Maturity Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold font-mono ${maturity.color}`}>{percent}%</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${maturity.bg} ${maturity.color}`}>
              {maturity.label}
            </span>
          </div>
          <Progress value={percent} className="h-1.5 mt-2" />
          <p className="text-[10px] font-mono text-muted-foreground mt-1.5">{completedCount}/{steps.length} steps completed</p>
        </div>

        {/* Steps */}
        <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Adaptive Steps
        </p>
        <div className="space-y-0.5">
          {steps.map((step, i) => {
            const si = AI_INSIGHTS[step.id];
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-left transition-all duration-200 group ${
                  i === activeStep
                    ? "bg-card border border-primary/30 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50 hover:translate-x-0.5"
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : step.status === "in_progress" ? (
                  <Play className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse-tag" />
                ) : (
                  <Circle className="w-3.5 h-3.5 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-mono text-[11px]">{step.title}</span>
                  {si && (
                    <span className={`text-[9px] font-mono mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity`}>
                      {si.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center - AI-Enhanced Step Details */}
      <div className="flex-1 p-6 md:p-8">
        {percent === 100 && (
          <div className="animate-slide-up max-w-xl text-center py-12 mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Onboarding Complete!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              AI-driven workflow finished. All {steps.length} adaptive steps completed based on your company profile.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
              {[
                { icon: Building2, label: "Profile", value: "Configured" },
                { icon: FileText, label: "Documents", value: "Parsed" },
                { icon: Shield, label: "Compliance", value: "Verified" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-[10px] font-mono text-muted-foreground">{s.label}</p>
                  <p className="text-xs font-mono font-semibold text-primary">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 inline-block">
              <p className="text-sm font-mono text-primary">{completedCount}/{steps.length} steps • 100% • Enterprise Ready</p>
            </div>
          </div>
        )}
        {percent < 100 && active && (
          <StepContent step={active} onComplete={completeStep} />
        )}
      </div>

      {/* Right sidebar - AI Property Inspector */}
      <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border p-4 bg-chrome/50">
        <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-3">Properties</p>
        {active && (
          <div className="space-y-3">
            {[
              { label: "Status", value: active.status.replace("_", " ") },
              { label: "Time Spent", value: active.timeSpent },
              { label: "Step ID", value: `#${active.id}` },
            ].map((prop) => (
              <div key={prop.label} className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{prop.label}</span>
                <span className="text-xs font-mono bg-card rounded px-2 py-1 border border-border capitalize">{prop.value}</span>
              </div>
            ))}

            {/* AI Priority */}
            {insight && (
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" /> AI Priority
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${PRIORITY_STYLES[insight.priority]}`}>
                  {insight.priority}
                </span>
              </div>
            )}

            {/* AI Tag */}
            {insight && (
              <div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                  <Brain className="w-3 h-3" /> AI Category
                </span>
                <span className="text-[10px] font-mono bg-dark text-primary px-2 py-0.5 rounded">
                  {insight.tag}
                </span>
              </div>
            )}

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

            {/* Adaptation Source */}
            <div className="mt-2 pt-3 border-t border-border">
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1.5">
                <Info className="w-3 h-3" /> Adaptation Source
              </span>
              <div className="space-y-1">
                {["Company Profile", "Document Analysis", "Maturity Model"].map((src) => (
                  <div key={src} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground">{src}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
