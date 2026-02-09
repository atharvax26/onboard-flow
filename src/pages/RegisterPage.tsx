import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) { setError("All fields required"); return; }
    register(form.email, form.password, form.name, form.company);
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="w-full max-w-sm">
        <div className="border border-border rounded-lg bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
          <div className="px-4 py-2 border-b border-border bg-chrome rounded-t-lg">
            <span className="font-mono text-xs text-muted-foreground">auth://register</span>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {(["name", "email", "company", "password"] as const).map((field) => (
              <div key={field}>
                <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{field}</label>
                <Input
                  type={field === "password" ? "password" : "text"}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            ))}
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <Button type="submit" className="w-full font-mono text-sm">Create Account →</Button>
            <p className="text-xs text-center text-muted-foreground">
              Have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
