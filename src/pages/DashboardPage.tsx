import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_ACTIVITY, MOCK_USERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Activity, ArrowRight, Users, CheckCircle2 } from "lucide-react";

const ADMIN_ACTIVITY = [
  { id: "aa1", action: "Jane Cooper", detail: "Completed step: Integration Configuration", time: "1 hour ago" },
  { id: "aa2", action: "Bob Builder", detail: "Uploaded document: startup-onboard.pdf", time: "2 hours ago" },
  { id: "aa3", action: "Mike Design", detail: "Completed step: Training & Certification", time: "3 hours ago" },
  { id: "aa4", action: "Sara Smith", detail: "Registered — onboarding not started", time: "5 hours ago" },
  { id: "aa5", action: "Lisa Wong", detail: "Completed all onboarding steps", time: "1 day ago" },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  if (isAdmin) {
    const totalUsers = MOCK_USERS.filter((u) => u.role === "user").length;
    const activeUsers = MOCK_USERS.filter((u) => u.onboardingStatus === "in_progress").length;
    const completedUsers = MOCK_USERS.filter((u) => u.onboardingStatus === "completed").length;
    const avgCompletion = Math.round(
      MOCK_USERS.filter((u) => u.role === "user").reduce((sum, u) => sum + u.completionPercent, 0) / totalUsers
    );

    return (
      <div className="p-6 md:p-8 space-y-6 pattern-grid min-h-[60vh]">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{user.email} · {user.company}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-semibold">{totalUsers}</p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Active Onboardings</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-semibold">{activeUsers}</p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Completed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-semibold">{completedUsers}</p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Avg Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary">{avgCompletion}%</p>
              <Progress value={avgCompletion} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* User activity feed */}
        <Card className="animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> User Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ADMIN_ACTIVITY.map((a) => (
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

        <Button onClick={() => navigate("/analytics")} className="font-mono text-sm">
          View Full Analytics →
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 pattern-grid min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{user.email} · {user.company}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
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
