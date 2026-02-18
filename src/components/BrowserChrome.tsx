import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, RotateCw, Lock, LogOut } from "lucide-react";
import NotificationPopup from "./NotificationPopup";

// Customer/User Navigation - Optimized for workflow
const USER_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Onboarding", path: "/onboarding" },
  { label: "Upload", path: "/upload" },
  { label: "Teams", path: "/teams" },
  { label: "Support", path: "/support" },
  { label: "Account", path: "/account" },
];

// Admin Navigation - Optimized for management and oversight
const ADMIN_TABS = [
  { label: "Home", path: "/dashboard" },
  { label: "Analytics", path: "/analytics" },
  { label: "Teams", path: "/teams" },
  { label: "Upload", path: "/upload" },
  { label: "Support", path: "/support" },
  { label: "Account", path: "/account" },
];

export default function BrowserChrome({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = isAdmin ? ADMIN_TABS : USER_TABS;

  // Redirect to login when user becomes null (after logout)
  useEffect(() => {
    if (!user && location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/register") {
      console.log('User logged out, redirecting to login');
      navigate("/login", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleRefresh = () => {
    console.log('🔄 Soft refresh - staying logged in');
    console.log('Current user:', user?.email);
    
    // Soft refresh: Just re-navigate to current page with a new key
    // This forces React to remount components without losing session
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    // Navigate away and back to force remount
    navigate('/dashboard', { replace: true });
    setTimeout(() => {
      navigate(currentPath + currentSearch, { replace: true });
      setRefreshKey(prev => prev + 1);
      console.log('✅ Soft refresh complete - user still logged in');
    }, 10);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double-click
    if (isLoggingOut) {
      console.log('⚠️ Logout already in progress, ignoring click');
      return;
    }
    
    setIsLoggingOut(true);
    console.log('🚪 Logout button clicked');
    console.log('Current user:', user?.email);
    
    try {
      // Clear localStorage immediately
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      console.log('✅ localStorage cleared immediately');
      
      // Call logout function
      logout();
      console.log('✅ Logout function called successfully');
      
      // Force navigation to login page
      console.log('🔄 Redirecting to login page...');
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if there's an error, force redirect to login
      window.location.href = '/login';
    }
  };

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
            <div className="ml-auto flex items-center gap-2">
              {/* AI-Generated Steps Indicator - Only on Onboarding Page */}
              {location.pathname === '/onboarding' && (
                <div className="bg-primary/10 border border-primary/30 rounded px-2 py-0.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-mono text-primary">AI-Generated</span>
                </div>
              )}
              <NotificationPopup />
              <button 
                onClick={handleLogout} 
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Logout"
                disabled={isLoggingOut}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Address bar */}
        {user && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-chrome border-b border-chrome-border">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground" title="Go back">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => navigate(1)} className="text-muted-foreground hover:text-foreground" title="Go forward">
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleRefresh} className="text-muted-foreground hover:text-foreground" title="Refresh page">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 flex items-center gap-1.5 bg-card rounded px-3 py-1 border border-border">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">onboard-agent://app{location.pathname}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">
                {user.email} {isAdmin && <span className="text-primary">(Admin)</span>}
              </span>
              <div className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 border border-primary/20">
                <span className="text-primary text-xs font-bold">O</span>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="min-h-[calc(100vh-120px)] bg-card" key={refreshKey}>
          {children}
        </div>
      </div>
    </div>
  );
}
