import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, RotateCw, Lock, LogOut } from "lucide-react";

const USER_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Document Upload", path: "/upload" },
  { label: "Onboarding", path: "/onboarding" },
  { label: "Account Details", path: "/account" },
];

const ADMIN_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Document Upload", path: "/upload" },
  { label: "Account Details", path: "/account" },
  { label: "Analytics", path: "/analytics" },
];

export default function BrowserChrome({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const tabs = isAdmin ? ADMIN_TABS : USER_TABS;

  return (
    <div className="min-h-screen bg-background pattern-grid flex items-start justify-center p-2 sm:p-4">
      <div className="w-full max-w-7xl rounded-lg border border-chrome-border shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] overflow-hidden bg-card">
        {/* Title bar with traffic lights */}
        <div className="flex items-center gap-2 px-4 py-2 bg-chrome border-b border-chrome-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 100% 67%)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(43 99% 58%)" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "hsl(135 73% 53%)" }} />
          </div>
          {/* Tab bar */}
          {user && (
            <div className="flex ml-4 gap-0.5">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`px-4 py-1 text-xs font-mono rounded-t transition-colors ${
                      isActive
                        ? "bg-card text-foreground border border-b-0 border-chrome-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
          {user && (
            <button onClick={() => { logout(); navigate("/"); }} className="ml-auto text-muted-foreground hover:text-foreground">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Address bar */}
        {user && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-chrome border-b border-chrome-border">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => navigate(1)} className="text-muted-foreground hover:text-foreground"><ArrowRight className="w-3.5 h-3.5" /></button>
            <button className="text-muted-foreground hover:text-foreground"><RotateCw className="w-3.5 h-3.5" /></button>
            <div className="flex-1 flex items-center gap-1.5 bg-card rounded px-3 py-1 border border-chrome-border">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">onboard-agent://app{location.pathname}</span>
            </div>
            <div className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 border border-primary/20">
              <span className="text-primary text-xs font-bold">O</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="min-h-[calc(100vh-120px)] bg-card">
          {children}
        </div>
      </div>
    </div>
  );
}
