import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, User as UserIcon, Building, Mail } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  const fields = [
    { icon: UserIcon, label: "Name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Building, label: "Company", value: user.company },
    { icon: null, label: "Role", value: user.role },
    { icon: null, label: "User ID", value: user.id.slice(0, 8) },
  ];

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Account Details</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">user.profile</p>
      </div>

      {/* Profile */}
      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{f.label}</span>
              <span className="text-sm font-mono bg-background rounded px-2 py-1 border border-border">{f.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Onboarding Status */}
      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Onboarding Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={user.completionPercent} className="h-2 mb-2" />
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Progress</span>
            <span className="text-sm font-mono">{user.completionPercent}%</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Status</span>
            <span className="text-sm font-mono capitalize">{user.onboardingStatus.replace("_", " ")}</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">Step</span>
            <span className="text-sm font-mono">{user.currentStep} / 8</span>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Document History</CardTitle>
        </CardHeader>
        <CardContent>
          {user.documentsUploaded.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {user.documentsUploaded.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded border border-border bg-background">
                  <FileText className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-mono">{doc.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{doc.size} · {doc.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
