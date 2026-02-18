import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import WelcomeAnimation from "@/components/WelcomeAnimation";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) { 
      setError("All fields required"); 
      return; 
    }
    
    // Validate email format - must end with @gmail.com
    if (!form.email.toLowerCase().endsWith('@gmail.com')) {
      setError("Email must be a Gmail address (@gmail.com)");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const ok = await register(form.email, form.password, form.name, form.company);
      if (ok) {
        // Show welcome animation instead of immediate redirect
        setShowWelcome(true);
      } else {
        setError("Registration failed");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    navigate("/dashboard");
  };

  return (
    <>
      {showWelcome && (
        <WelcomeAnimation 
          userName={form.name} 
          onComplete={handleWelcomeComplete}
        />
      )}
      
      <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-sm">
        <div className="border border-border rounded-lg bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
          <div className="px-4 py-2 border-b border-border bg-chrome rounded-t-lg">
            <span className="font-mono text-xs text-muted-foreground">auth://register</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {(["name", "email", "company"] as const).map((field) => (
              <div key={field}>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{field}</label>
                <Input
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="mt-1 font-mono text-sm"
                  placeholder={field === "email" ? "username@gmail.com" : ""}
                />
              </div>
            ))}
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <Button type="submit" className="w-full font-mono text-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account →"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
