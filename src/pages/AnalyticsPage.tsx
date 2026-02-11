import { useState } from "react";
import { MOCK_USERS, MOCK_ONBOARDING_STEPS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, CheckCircle, Clock, TrendingDown, Download, ArrowLeft, Search } from "lucide-react";

const COLORS = ["hsl(187 92% 41%)", "hsl(220 13% 83%)", "hsl(43 99% 58%)", "hsl(0 84% 60%)"];

const stepData = MOCK_ONBOARDING_STEPS.map((s) => ({
  name: s.title.split(" ").slice(0, 2).join(" "),
  users: Math.floor(Math.random() * 20 + 2),
  avgTime: Math.floor(Math.random() * 30 + 5),
}));

const statusData = [
  { name: "Completed", value: MOCK_USERS.filter((u) => u.onboardingStatus === "completed").length },
  { name: "In Progress", value: MOCK_USERS.filter((u) => u.onboardingStatus === "in_progress").length },
  { name: "Not Started", value: MOCK_USERS.filter((u) => u.onboardingStatus === "not_started").length },
];

export default function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const users = MOCK_USERS.filter((u) => u.role === "user");
  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const totalUsers = users.length;
  const completionRate = Math.round((users.filter((u) => u.onboardingStatus === "completed").length / totalUsers) * 100);
  const avgCompletion = Math.round(users.reduce((a, u) => a + u.completionPercent, 0) / totalUsers);
  const bottleneckStep = stepData.reduce((a, b) => (b.avgTime > a.avgTime ? b : a)).name;

  if (selectedUser) {
    const u = users.find((u) => u.id === selectedUser)!;
    return (
      <div className="p-6 md:p-8 space-y-6 min-h-[60vh]">
        <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analytics
        </button>
        <h2 className="text-xl font-semibold">{u.name}</h2>
        <p className="text-sm font-mono text-muted-foreground">{u.email} · {u.company}</p>
        <Progress value={u.completionPercent} className="h-2 max-w-md" />
        <p className="text-sm font-mono">{u.completionPercent}% complete · Step {u.currentStep}/8</p>
        <div className="space-y-2 mt-4">
          {MOCK_ONBOARDING_STEPS.map((step) => (
            <div key={step.id} className={`flex items-center gap-3 p-3 rounded border text-sm font-mono ${step.id <= u.currentStep ? "border-primary/30 bg-primary/5" : "border-border"}`}>
              {step.id <= u.currentStep ? <CheckCircle className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
              <span>{step.title}</span>
              {step.id === u.currentStep && <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Current</span>}
            </div>
          ))}
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
          { label: "Bottleneck", value: bottleneckStep, icon: TrendingDown },
        ].map((s) => (
          <Card key={s.label} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 cursor-default">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</span>
              </div>
              <p className="text-lg font-semibold truncate">{s.value}</p>
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
              {filtered.map((u) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-primary/5" onClick={() => setSelectedUser(u.id)}>
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
                  <TableCell className="font-mono text-xs">{u.currentStep}/8</TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{new Date(u.lastActivity).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
