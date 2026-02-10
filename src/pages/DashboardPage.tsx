import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_ACTIVITY } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Activity, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="p-6 md:p-8 space-y-6 pattern-grid min-h-[60vh]">
      {/* Welcome */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{user.email} · {user.company}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Status card */}
        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-primary">{user.completionPercent}%</p>
            <Progress value={user.completionPercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground font-mono mt-2 capitalize">{user.onboardingStatus.replace("_", " ")}</p>
          </CardContent>
        </Card>

        {/* Upload card */}
        <Card className="animate-slide-up cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50" onClick={() => navigate("/upload")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload PDF</p>
              <p className="text-xs text-muted-foreground">Start onboarding process</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>

        {/* Documents card */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Documents</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{user.documentsUploaded.length}</p>
              <p className="text-xs text-muted-foreground">Uploaded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity feed */}
      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_ACTIVITY.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-medium">{a.action}</span>
                <span className="text-muted-foreground font-mono text-xs">{a.detail}</span>
                <span className="text-muted-foreground text-xs ml-auto">{a.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {user.onboardingStatus !== "not_started" && (
        <Button onClick={() => navigate("/onboarding")} className="font-mono text-sm">
          Continue Onboarding →
        </Button>
      )}
    </div>
  );
}
