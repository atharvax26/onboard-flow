import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle, Sparkles, Brain, Zap, ArrowRight, Upload, Users, Link2,
  FileText, Settings, GraduationCap, Rocket
} from "lucide-react";
import { OnboardingStep } from "@/lib/types";

const PRIORITY_STYLES = {
  high: "border-destructive/30 bg-destructive/5 text-destructive",
  medium: "border-yellow-500/30 bg-yellow-50 text-yellow-700",
  low: "border-primary/30 bg-primary/5 text-primary",
};

const AI_INSIGHTS: Record<number, { tag: string; reason: string; priority: "high" | "medium" | "low" }> = {
  1: { tag: "Foundation", reason: "AI detected: Company profile drives 6 downstream step customizations", priority: "high" },
  2: { tag: "Collaboration", reason: "AI analysis: Teams with 3+ members complete onboarding 40% faster", priority: "high" },
  3: { tag: "Regulatory", reason: "AI flagged: Your industry requires compliance review before integrations", priority: "high" },
  4: { tag: "Connectivity", reason: "AI matched: 3 integration templates based on your company profile", priority: "medium" },
  5: { tag: "Data Layer", reason: "AI estimated: Migration complexity is moderate based on document analysis", priority: "medium" },
  6: { tag: "Automation", reason: "AI generated: 4 workflow templates tailored to your operational maturity", priority: "medium" },
  7: { tag: "Enablement", reason: "AI personalized: Training path based on team roles and experience level", priority: "low" },
  8: { tag: "Launch", reason: "AI compiled: Pre-launch checklist from 12 configuration verification points", priority: "low" },
};

const STEP_RECOMMENDATIONS: Record<number, string[]> = {
  1: ["Auto-fill from uploaded documents", "Use industry template for faster setup"],
  2: ["Import team from Google Workspace", "Assign roles based on org chart"],
  3: ["Auto-detect compliance requirements", "Pre-fill from industry standards"],
  4: ["Match integrations to your stack", "Use pre-built connector templates"],
  5: ["Smart field mapping from CSV headers", "Validate data before import"],
  6: ["Apply best-practice workflow templates", "Clone from similar companies"],
  7: ["Skip modules your role doesn't need", "Fast-track certification path"],
  8: ["Run automated pre-launch diagnostics", "Generate go-live report"],
};

// Mock form content per step
function Step1Form() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Company Name</Label>
          <Input placeholder="e.g. Acme Corporation" className="font-mono text-sm h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Industry</Label>
          <Select>
            <SelectTrigger className="font-mono text-sm h-9">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education"].map(i => (
                <SelectItem key={i} value={i.toLowerCase()} className="font-mono text-sm">{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Company Size</Label>
          <Select>
            <SelectTrigger className="font-mono text-sm h-9">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {["1-10", "11-50", "51-200", "201-1000", "1000+"].map(s => (
                <SelectItem key={s} value={s} className="font-mono text-sm">{s} employees</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Primary Contact Email</Label>
          <Input type="email" placeholder="you@company.com" className="font-mono text-sm h-9" />
        </div>
      </div>
    </div>
  );
}

function Step2Form() {
  const members = [
    { name: "", email: "", role: "viewer" },
    { name: "", email: "", role: "viewer" },
  ];
  return (
    <div className="space-y-3">
      {members.map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_120px] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Name</Label>
            <Input placeholder="Full name" className="font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Email</Label>
            <Input placeholder="email@company.com" className="font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Role</Label>
            <Select defaultValue="viewer">
              <SelectTrigger className="font-mono text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Admin", "Manager", "Viewer"].map(r => (
                  <SelectItem key={r} value={r.toLowerCase()} className="font-mono text-sm">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="font-mono text-xs mt-1">
        <Users className="w-3 h-3 mr-1" /> Add Another Member
      </Button>
    </div>
  );
}

function Step3Form() {
  const docs = ["Terms of Service", "Privacy Policy", "Data Processing Agreement"];
  return (
    <div className="space-y-3">
      {docs.map(doc => (
        <div key={doc} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card">
          <Checkbox id={doc} />
          <div className="flex-1">
            <label htmlFor={doc} className="text-sm font-mono cursor-pointer">{doc}</label>
            <p className="text-[10px] font-mono text-muted-foreground">Review and acknowledge</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-mono">View</Button>
        </div>
      ))}
    </div>
  );
}

function Step4Form() {
  const integrations = [
    { name: "Slack", status: "available" },
    { name: "Salesforce CRM", status: "available" },
    { name: "Jira", status: "available" },
  ];
  return (
    <div className="space-y-3">
      {integrations.map(int => (
        <div key={int.name} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono">{int.name}</span>
          </div>
          <Button variant="outline" size="sm" className="text-xs font-mono">Connect</Button>
        </div>
      ))}
    </div>
  );
}

function Step5Form() {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-card/50">
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-mono text-muted-foreground">Drop CSV files here or click to upload</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">Supports .csv, .xlsx, .json</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono">Source Platform</Label>
        <Select>
          <SelectTrigger className="font-mono text-sm h-9">
            <SelectValue placeholder="Select previous platform" />
          </SelectTrigger>
          <SelectContent>
            {["Competitor A", "Competitor B", "Custom/Other"].map(p => (
              <SelectItem key={p} value={p.toLowerCase()} className="font-mono text-sm">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step6Form() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono">Approval Chain</Label>
        <Select>
          <SelectTrigger className="font-mono text-sm h-9">
            <SelectValue placeholder="Select approval workflow" />
          </SelectTrigger>
          <SelectContent>
            {["Single Approver", "Multi-level", "Auto-approve"].map(a => (
              <SelectItem key={a} value={a.toLowerCase()} className="font-mono text-sm">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono">Notification Rules</Label>
        <Textarea placeholder="Describe your notification preferences..." className="font-mono text-sm resize-none h-20" />
      </div>
    </div>
  );
}

function Step7Form() {
  const modules = ["Platform Overview", "Data Management", "Admin Console", "API & Integrations"];
  return (
    <div className="space-y-3">
      {modules.map((mod, i) => (
        <div key={mod} className="flex items-center justify-between p-3 rounded-md border border-border bg-card">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-mono">{mod}</span>
              <p className="text-[10px] font-mono text-muted-foreground">{10 + i * 5} min</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-xs font-mono">Start</Button>
        </div>
      ))}
    </div>
  );
}

function Step8Form() {
  const checks = [
    "All team members have access",
    "Integrations are connected and tested",
    "Data migration verified",
    "Workflows configured and tested",
    "Training modules completed",
  ];
  return (
    <div className="space-y-3">
      {checks.map(check => (
        <div key={check} className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-card">
          <Checkbox id={check} />
          <label htmlFor={check} className="text-sm font-mono cursor-pointer">{check}</label>
        </div>
      ))}
    </div>
  );
}

const STEP_FORMS: Record<number, React.FC> = {
  1: Step1Form,
  2: Step2Form,
  3: Step3Form,
  4: Step4Form,
  5: Step5Form,
  6: Step6Form,
  7: Step7Form,
  8: Step8Form,
};

const STEP_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Settings,
  2: Users,
  3: FileText,
  4: Link2,
  5: Upload,
  6: Zap,
  7: GraduationCap,
  8: Rocket,
};

interface StepContentProps {
  step: OnboardingStep;
  onComplete: (id: number) => void;
}

export default function StepContent({ step, onComplete }: StepContentProps) {
  const insight = AI_INSIGHTS[step.id];
  const recommendations = STEP_RECOMMENDATIONS[step.id] || [];
  const FormComponent = STEP_FORMS[step.id];
  const StepIcon = STEP_ICONS[step.id];

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
        {insight && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-dark text-primary flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> AI-Adapted
          </span>
        )}
      </div>

      {/* Title & description */}
      <div className="flex items-start gap-3 mb-4">
        {StepIcon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <StepIcon className="w-4.5 h-4.5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold leading-tight">{step.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
        </div>
      </div>

      {/* AI Insight */}
      {insight && (
        <div className={`rounded-lg border p-3 mb-5 flex items-start gap-3 ${PRIORITY_STYLES[insight.priority]}`}>
          <Brain className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5 opacity-70">
              AI Insight · {insight.priority} priority
            </p>
            <p className="text-xs font-mono leading-relaxed">{insight.reason}</p>
          </div>
        </div>
      )}

      {/* Form section */}
      {step.status !== "completed" && FormComponent && (
        <div className="bg-card rounded-lg border border-border p-5 mb-5">
          <FormComponent />
        </div>
      )}

      {/* Completed content */}
      {step.status === "completed" && (
        <div className="bg-card rounded-lg border border-primary/20 p-5 mb-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{step.details}</p>
        </div>
      )}

      {/* AI Recommendations */}
      {step.status === "in_progress" && recommendations.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> AI Recommendations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 text-xs font-mono text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-foreground hover:shadow-sm cursor-pointer group"
              >
                <ArrowRight className="w-3 h-3 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {step.status === "in_progress" && (
        <Button onClick={() => onComplete(step.id)} className="font-mono text-sm">
          Mark Complete ✓
        </Button>
      )}
      {step.status === "completed" && (
        <p className="text-sm text-primary font-mono flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> Completed
        </p>
      )}
    </div>
  );
}
