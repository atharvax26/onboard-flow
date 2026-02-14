import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("All fields required"); return; }
    
    setLoading(true);
    setError("");
    
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate("/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-sm">
        <div className="border border-border rounded-lg bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
          <div className="px-4 py-2 border-b border-border bg-chrome rounded-t-lg">
            <span className="font-mono text-xs text-muted-foreground">auth://login</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@demo.com" className="mt-1 font-mono text-sm" required />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 font-mono text-sm" />
            </div>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <Button type="submit" className="w-full font-mono text-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login →"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No account? <Link to="/register" className="text-primary hover:underline">Register</Link>
            </p>
            <p className="text-[10px] text-center text-muted-foreground font-mono">
              Admin: admin@demo.com · any password
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
