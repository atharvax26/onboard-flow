import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User, OnboardingStep } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, CheckCircle, Clock, TrendingDown, Download, ArrowLeft, Search, Loader2 } from "lucide-react";

const COLORS = ["hsl(187 92% 41%)", "hsl(220 13% 83%)", "hsl(43 99% 58%)", "hsl(0 84% 60%)"];

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSteps, setUserSteps] = useState<Record<string, OnboardingStep[]>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const allUsers = await api.getAllUsers();
        const regularUsers = allUsers.filter((u) => u.role === "user");
        setUsers(regularUsers);

        // Load steps for each user
        const stepsMap: Record<string, OnboardingStep[]> = {};
        for (const user of regularUsers) {
          try {
            const steps = await api.getSteps(user.email);
            stepsMap[user.email] = steps;
          } catch (error) {
            console.error(`Failed to load steps for ${user.email}:`, error);
            stepsMap[user.email] = [];
          }
        }
        setUserSteps(stepsMap);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  // Calculate analytics from real data
  const totalUsers = users.length;
  const completionRate = totalUsers > 0 
    ? Math.round((users.filter((u) => u.onboardingStatus === "completed").length / totalUsers) * 100)
    : 0;
  const avgCompletion = totalUsers > 0
    ? Math.round(users.reduce((a, u) => a + u.completionPercent, 0) / totalUsers)
    : 0;

  // Calculate step data from all users' steps
  const stepDataMap = new Map<string, { count: number; totalTime: number }>();
  Object.values(userSteps).forEach(steps => {
    steps.forEach(step => {
      const key = step.title.split(" ").slice(0, 3).join(" ");
      const existing = stepDataMap.get(key) || { count: 0, totalTime: 0 };
      const timeInMinutes = parseInt(step.timeSpent) || 0;
      stepDataMap.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + timeInMinutes
      });
    });
  });

  const stepData = Array.from(stepDataMap.entries()).map(([name, data]) => ({
    name,
    users: data.count,
    avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
  })).slice(0, 10); // Top 10 steps

  const statusData = [
    { name: "Completed", value: users.filter((u) => u.onboardingStatus === "completed").length },
    { name: "In Progress", value: users.filter((u) => u.onboardingStatus === "in_progress").length },
    { name: "Not Started", value: users.filter((u) => u.onboardingStatus === "not_started").length },
  ];

  const bottleneckStep = stepData.length > 0 
    ? stepData.reduce((a, b) => (b.avgTime > a.avgTime ? b : a))
    : { name: "N/A", avgTime: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-mono text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (selectedUser) {
    const u = users.find((u) => u.email === selectedUser);
    if (!u) {
      setSelectedUser(null);
      return null;
    }
    
    const steps = userSteps[u.email] || [];
    const completedSteps = steps.filter(s => s.status === "completed").length;
    
    return (
      <div className="p-6 md:p-8 space-y-6 min-h-[60vh]">
        <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analytics
        </button>
        <h2 className="text-xl font-semibold">{u.name}</h2>
        <p className="text-sm font-mono text-muted-foreground">{u.email} · {u.company}</p>
        <Progress value={u.completionPercent} className="h-2 max-w-md" />
        <p className="text-sm font-mono">{u.completionPercent}% complete · Step {completedSteps}/{steps.length}</p>
        <div className="space-y-2 mt-4">
          {steps.length > 0 ? (
            steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded border text-sm font-mono ${
                step.status === "completed" ? "border-primary/30 bg-primary/5" : 
                step.status === "in_progress" ? "border-yellow-300 bg-yellow-50" : 
                "border-border"
              }`}>
                {step.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : step.status === "in_progress" ? (
                  <Clock className="w-4 h-4 text-yellow-600" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground" />
                )}
                <span>{step.title}</span>
                {step.status === "in_progress" && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Current</span>
                )}
                {step.status === "completed" && step.timeSpent && (
                  <span className="ml-auto text-xs text-muted-foreground">{step.timeSpent}</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No onboarding steps yet</p>
          )}
        </div>
      </div>
    );
  }

  const exportCSV = () => {
    const header = "Name,Email,Company,Status,Completion,Current Step\n";
    const rows = users.map((u) => `${u.name},${u.email},${u.company},${u.onboardingStatus},${u.completionPercent}%,${u.currentStep}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "analytics.csv"; a.click();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-[60vh]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Analytics</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">dashboard.analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="font-mono text-xs">
          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users },
          { label: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle },
          { label: "Avg Progress", value: `${avgCompletion}%`, icon: Clock },
          { label: "Bottleneck", value: bottleneckStep.name, subtitle: `~${bottleneckStep.avgTime}min avg`, icon: TrendingDown },
        ].map((s) => (
          <Card key={s.label} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 cursor-default">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
              </div>
              <p className="text-lg font-semibold leading-snug">{s.value}</p>
              {"subtitle" in s && s.subtitle && <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Users per Step</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Bar dataKey="users" fill="hsl(187 92% 41%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User table */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">All Users</CardTitle>
          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-7 h-7 text-xs font-mono" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {["Name", "Company", "Status", "Progress", "Step", "Last Active"].map((h) => (
                  <TableHead key={h} className="text-[10px] font-mono uppercase">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const steps = userSteps[u.email] || [];
                const completedSteps = steps.filter(s => s.status === "completed").length;
                
                return (
                  <TableRow key={u.email} className="cursor-pointer hover:bg-primary/5" onClick={() => setSelectedUser(u.email)}>
                    <TableCell className="font-mono text-xs">{u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{u.company}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        u.onboardingStatus === "completed" ? "bg-primary/10 text-primary" : u.onboardingStatus === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                      }`}>{u.onboardingStatus.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={u.completionPercent} className="h-1.5 w-16" />
                        <span className="text-[10px] font-mono">{u.completionPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{completedSteps}/{steps.length}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
