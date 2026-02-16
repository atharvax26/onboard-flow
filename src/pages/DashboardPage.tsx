import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Activity, ArrowRight, Users, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { User } from "@/lib/types";

export default function DashboardPage() {
  const { user, isAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [adminActivity, setAdminActivity] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Refresh user data first
        await refreshUser();
        
        if (isAdmin) {
          // Load admin data
          const [allUsers, activity] = await Promise.all([
            api.getAllUsers(),
            api.getAdminActivity()
          ]);
          setUsers(allUsers.filter(u => u.role === "user"));
          setAdminActivity(activity);
        } else {
          // Load user activity
          const activity = await api.getUserActivity(user.email);
          setUserActivity(activity);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, isAdmin, refreshUser]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-mono text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.onboardingStatus === "in_progress").length;
    const completedUsers = users.filter((u) => u.onboardingStatus === "completed").length;
    const avgCompletion = totalUsers > 0 
      ? Math.round(users.reduce((sum, u) => sum + u.completionPercent, 0) / totalUsers)
      : 0;

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
            {adminActivity.length > 0 ? (
              <div className="space-y-3">
                {adminActivity.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{a.action}</span>
                    <span className="text-muted-foreground font-mono text-xs">{a.detail}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{a.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => navigate("/analytics")} size="sm" className="font-mono text-xs">
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
          {userActivity.length > 0 ? (
            <div className="space-y-3">
              {userActivity.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border pb-2 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="font-medium">{a.action}</span>
                  <span className="text-muted-foreground font-mono text-xs">{a.detail}</span>
                  <span className="text-muted-foreground text-xs ml-auto">{a.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          )}
        </CardContent>
      </Card>

      {user.onboardingStatus !== "not_started" && (
        <Button onClick={() => navigate("/onboarding")} size="sm" className="font-mono text-xs">
          Continue Onboarding →
        </Button>
      )}
    </div>
  );
}
