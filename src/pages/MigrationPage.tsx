import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MigrationPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-6 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Admin access required to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.migrateQueue();
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Document Queue Migration</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Queue existing documents for team members
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Migrate Existing Documents</CardTitle>
          <CardDescription>
            This will queue all existing team documents for team members who haven't completed them yet.
            Run this once to fix the queue for existing data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">What this does:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Finds all documents uploaded for each team</li>
              <li>Adds documents to team members' queues</li>
              <li>Skips documents that are already completed</li>
              <li>Skips documents that are already in the queue</li>
              <li>Preserves active onboarding sessions</li>
            </ul>
          </div>

          <Button
            onClick={runMigration}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Migration
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  
                  {result.results && result.results.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {result.results.map((team: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-primary pl-3">
                          <p className="font-medium text-sm">Team: {team.teamName}</p>
                          {team.members.map((member: any, midx: number) => (
                            <div key={midx} className="mt-2 text-xs">
                              <p className="font-mono">{member.name} ({member.email})</p>
                              <ul className="list-disc list-inside ml-2 text-muted-foreground">
                                {member.queued.map((doc: string, didx: number) => (
                                  <li key={didx}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
        {result && (
          <Button onClick={() => navigate('/analytics')}>
            View Analytics →
          </Button>
        )}
      </div>
    </div>
  );
}
