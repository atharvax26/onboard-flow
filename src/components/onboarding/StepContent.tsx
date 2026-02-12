import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CheckCircle, Sparkles, Brain, Zap, ArrowRight, Upload, Users, Link2,
  FileText, Settings, GraduationCap, Rocket, Check, Loader2, Eye
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

// Auto-fill mock data per step
const AUTOFILL_DATA: Record<number, Record<string, string>> = {
  1: { companyName: "Acme Corporation", industry: "technology", size: "51-200", email: "admin@acme.com" },
  2: { name0: "Jane Cooper", email0: "jane@acme.com", role0: "admin", name1: "Bob Builder", email1: "bob@acme.com", role1: "manager" },
  3: {},
  4: {},
  5: { platform: "competitor a" },
  6: { approval: "multi-level", notifications: "Notify admins on approval requests. Send weekly digest to managers. Alert on failed integrations." },
  7: {},
  8: {},
};

const TEMPLATE_DATA: Record<number, Record<string, string>> = {
  1: { companyName: "TechStartup Inc", industry: "technology", size: "11-50", email: "founder@techstartup.io" },
  2: { name0: "CTO", email0: "cto@company.com", role0: "admin", name1: "Lead Dev", email1: "lead@company.com", role1: "manager" },
  3: {},
  4: {},
  5: { platform: "custom/other" },
  6: { approval: "single approver", notifications: "Auto-approve low-risk changes. Require manager sign-off for data exports." },
  7: {},
  8: {},
};

const STEP_RECOMMENDATIONS: Record<number, { label: string; action: "autofill" | "template" }[]> = {
  1: [
    { label: "Auto-fill from uploaded documents", action: "autofill" },
    { label: "Use industry template for faster setup", action: "template" },
  ],
  2: [
    { label: "Import team from Google Workspace", action: "autofill" },
    { label: "Assign roles based on org chart", action: "template" },
  ],
  3: [
    { label: "Auto-detect compliance requirements", action: "autofill" },
    { label: "Pre-fill from industry standards", action: "template" },
  ],
  4: [
    { label: "Match integrations to your stack", action: "autofill" },
    { label: "Use pre-built connector templates", action: "template" },
  ],
  5: [
    { label: "Smart field mapping from CSV headers", action: "autofill" },
    { label: "Validate data before import", action: "template" },
  ],
  6: [
    { label: "Apply best-practice workflow templates", action: "autofill" },
    { label: "Clone from similar companies", action: "template" },
  ],
  7: [
    { label: "Skip modules your role doesn't need", action: "autofill" },
    { label: "Fast-track certification path", action: "template" },
  ],
  8: [
    { label: "Run automated pre-launch diagnostics", action: "autofill" },
    { label: "Generate go-live report", action: "template" },
  ],
};

// Step 1 - Company Profile with state
function Step1Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Company Name</Label>
          <Input
            placeholder="e.g. Acme Corporation"
            className="font-mono text-sm h-9"
            value={formData.companyName || ""}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono">Industry</Label>
          <Select value={formData.industry || ""} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
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
          <Select value={formData.size || ""} onValueChange={(v) => setFormData({ ...formData, size: v })}>
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
          <Input
            type="email"
            placeholder="you@company.com"
            className="font-mono text-sm h-9"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2 - Team Members with dynamic add
function Step2Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const memberCount = parseInt(formData._memberCount || "2");

  const addMember = () => {
    setFormData({ ...formData, _memberCount: String(memberCount + 1) });
    toast.success("New member row added");
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: memberCount }).map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_120px] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Name</Label>
            <Input
              placeholder="Full name"
              className="font-mono text-sm h-9"
              value={formData[`name${i}`] || ""}
              onChange={(e) => setFormData({ ...formData, [`name${i}`]: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Email</Label>
            <Input
              placeholder="email@company.com"
              className="font-mono text-sm h-9"
              value={formData[`email${i}`] || ""}
              onChange={(e) => setFormData({ ...formData, [`email${i}`]: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono">Role</Label>
            <Select
              value={formData[`role${i}`] || "viewer"}
              onValueChange={(v) => setFormData({ ...formData, [`role${i}`]: v })}
            >
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
      <Button variant="outline" size="sm" className="font-mono text-xs mt-1" onClick={addMember}>
        <Users className="w-3 h-3 mr-1" /> Add Another Member
      </Button>
    </div>
  );
}

// Step 3 - Compliance with checkable docs and viewable dialog
function Step3Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const docs = ["Terms of Service", "Privacy Policy", "Data Processing Agreement"];

  const toggleDoc = (doc: string) => {
    const key = `checked_${doc}`;
    setFormData({ ...formData, [key]: formData[key] === "true" ? "false" : "true" });
  };

  const viewDoc = (doc: string) => {
    toast.info(`Viewing ${doc}`, { description: "Document preview would open here. This is a mock placeholder." });
  };

  return (
    <div className="space-y-3">
      {docs.map(doc => {
        const checked = formData[`checked_${doc}`] === "true";
        return (
          <div key={doc} className={`flex items-center gap-3 p-3 rounded-md border bg-card transition-all duration-200 ${checked ? "border-primary/30" : "border-border"}`}>
            <Checkbox
              id={doc}
              checked={checked}
              onCheckedChange={() => toggleDoc(doc)}
            />
            <div className="flex-1">
              <label htmlFor={doc} className="text-sm font-mono cursor-pointer">{doc}</label>
              <p className="text-[10px] font-mono text-muted-foreground">
                {checked ? "✓ Acknowledged" : "Review and acknowledge"}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-mono" onClick={() => viewDoc(doc)}>
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Step 4 - Integrations with connect/disconnect
function Step4Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const integrations = ["Slack", "Salesforce CRM", "Jira"];

  const toggleConnect = (name: string) => {
    const key = `connected_${name}`;
    const isConnected = formData[key] === "true";
    setFormData({ ...formData, [key]: isConnected ? "false" : "true" });
    toast.success(isConnected ? `${name} disconnected` : `${name} connected successfully`);
  };

  return (
    <div className="space-y-3">
      {integrations.map(name => {
        const connected = formData[`connected_${name}`] === "true";
        return (
          <div key={name} className={`flex items-center justify-between p-3 rounded-md border bg-card transition-all duration-200 ${connected ? "border-primary/30" : "border-border"}`}>
            <div className="flex items-center gap-2">
              {connected ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4 text-muted-foreground" />}
              <span className="text-sm font-mono">{name}</span>
              {connected && <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">Connected</span>}
            </div>
            <Button
              variant={connected ? "ghost" : "outline"}
              size="sm"
              className="text-xs font-mono"
              onClick={() => toggleConnect(name)}
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Step 5 - Data Migration with file upload mock
function Step5Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const [uploading, setUploading] = useState(false);
  const hasFile = formData.uploadedFile === "true";

  const simulateUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setFormData({ ...formData, uploadedFile: "true" });
      toast.success("File uploaded successfully", { description: "legacy-data.csv — 2.4 MB parsed" });
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {hasFile ? (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-mono">legacy-data.csv</p>
            <p className="text-[10px] font-mono text-muted-foreground">2.4 MB · 1,247 records parsed</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-mono" onClick={() => setFormData({ ...formData, uploadedFile: "false" })}>Remove</Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-card/50 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={simulateUpload}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          )}
          <p className="text-sm font-mono text-muted-foreground">{uploading ? "Uploading..." : "Drop CSV files here or click to upload"}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">Supports .csv, .xlsx, .json</p>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-mono">Source Platform</Label>
        <Select value={formData.platform || ""} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
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

// Step 6 - Workflow with state
function Step6Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono">Approval Chain</Label>
        <Select value={formData.approval || ""} onValueChange={(v) => setFormData({ ...formData, approval: v })}>
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
        <Textarea
          placeholder="Describe your notification preferences..."
          className="font-mono text-sm resize-none h-20"
          value={formData.notifications || ""}
          onChange={(e) => setFormData({ ...formData, notifications: e.target.value })}
        />
      </div>
    </div>
  );
}

// Step 7 - Training with start/complete toggle
function Step7Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const modules = ["Platform Overview", "Data Management", "Admin Console", "API & Integrations"];

  const toggleModule = (mod: string) => {
    const key = `module_${mod}`;
    const status = formData[key];
    if (!status || status === "not_started") {
      setFormData({ ...formData, [key]: "in_progress" });
      toast.info(`Started: ${mod}`);
    } else if (status === "in_progress") {
      setFormData({ ...formData, [key]: "completed" });
      toast.success(`Completed: ${mod}`);
    }
  };

  return (
    <div className="space-y-3">
      {modules.map((mod, i) => {
        const status = formData[`module_${mod}`] || "not_started";
        return (
          <div key={mod} className={`flex items-center justify-between p-3 rounded-md border bg-card transition-all duration-200 ${
            status === "completed" ? "border-primary/30" : status === "in_progress" ? "border-yellow-500/30" : "border-border"
          }`}>
            <div className="flex items-center gap-2">
              {status === "completed" ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <span className="text-sm font-mono">{mod}</span>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {status === "completed" ? "✓ Completed" : status === "in_progress" ? "In progress..." : `${10 + i * 5} min`}
                </p>
              </div>
            </div>
            <Button
              variant={status === "completed" ? "ghost" : "outline"}
              size="sm"
              className="text-xs font-mono"
              onClick={() => toggleModule(mod)}
              disabled={status === "completed"}
            >
              {status === "completed" ? "Done" : status === "in_progress" ? "Complete" : "Start"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// Step 8 - Go-Live Checklist with checkable items
function Step8Form({ formData, setFormData }: { formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }) {
  const checks = [
    "All team members have access",
    "Integrations are connected and tested",
    "Data migration verified",
    "Workflows configured and tested",
    "Training modules completed",
  ];

  const toggleCheck = (check: string) => {
    const key = `check_${check}`;
    setFormData({ ...formData, [key]: formData[key] === "true" ? "false" : "true" });
  };

  return (
    <div className="space-y-3">
      {checks.map(check => {
        const checked = formData[`check_${check}`] === "true";
        return (
          <div key={check} className={`flex items-center gap-3 p-2.5 rounded-md border bg-card transition-all duration-200 ${checked ? "border-primary/30" : "border-border"}`}>
            <Checkbox
              id={check}
              checked={checked}
              onCheckedChange={() => toggleCheck(check)}
            />
            <label htmlFor={check} className={`text-sm font-mono cursor-pointer ${checked ? "text-primary line-through" : ""}`}>{check}</label>
          </div>
        );
      })}
    </div>
  );
}

type FormComponent = React.FC<{ formData: Record<string, string>; setFormData: (d: Record<string, string>) => void }>;

const STEP_FORMS: Record<number, FormComponent> = {
  1: Step1Form, 2: Step2Form, 3: Step3Form, 4: Step4Form,
  5: Step5Form, 6: Step6Form, 7: Step7Form, 8: Step8Form,
};

const STEP_ICONS: Record<number, React.FC<{ className?: string }>> = {
  1: Settings, 2: Users, 3: FileText, 4: Link2,
  5: Upload, 6: Zap, 7: GraduationCap, 8: Rocket,
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

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [filling, setFilling] = useState(false);

  const handleRecommendation = useCallback((action: "autofill" | "template") => {
    const data = action === "autofill" ? AUTOFILL_DATA[step.id] : TEMPLATE_DATA[step.id];
    if (!data || Object.keys(data).length === 0) {
      toast.info("AI processing...", { description: "Mock: This action would trigger AI analysis for this step." });
      return;
    }
    setFilling(true);
    toast.loading("AI is filling fields...", { id: "ai-fill" });
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, ...data }));
      setFilling(false);
      toast.success("Fields auto-filled by AI", { id: "ai-fill", description: `${Object.keys(data).length} fields populated` });
    }, 800);
  }, [step.id]);

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
        <div className={`bg-card rounded-lg border border-border p-5 mb-5 transition-opacity duration-300 ${filling ? "opacity-60" : ""}`}>
          <FormComponent formData={formData} setFormData={setFormData} />
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
              <button
                key={i}
                onClick={() => handleRecommendation(rec.action)}
                disabled={filling}
                className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 text-xs font-mono text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-foreground hover:shadow-sm cursor-pointer group text-left disabled:opacity-50"
              >
                <ArrowRight className="w-3 h-3 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                {rec.label}
              </button>
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
