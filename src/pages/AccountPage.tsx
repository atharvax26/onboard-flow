import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Users, Activity, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { User, Team } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const { user, isAdmin, refreshUser } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSteps, setUserSteps] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Refresh user data first
        await refreshUser();
        
        if (isAdmin) {
          // Load all users for admin
          const users = await api.getAllUsers();
          setAllUsers(users);
        } else {
          // Load user's steps to get accurate step count
          const steps = await api.getSteps(user.email);
          setUserSteps(steps);
          
          // Load user's teams
          const teams = await api.getUserTeams(user.email);
          setUserTeams(teams);
        }
      } catch (error) {
        console.error('Failed to load account data:', error);
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
          <p className="text-sm font-mono text-muted-foreground">Loading account details...</p>
        </div>
      </div>
    );
  }

  const profileFields = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Company", value: user.company },
    { label: "Role", value: user.role },
    { label: "User ID", value: user.id.slice(0, 8) },
  ];

  const regularUsers = allUsers.filter(u => u.role === "user");
  const totalUsers = regularUsers.length;
  const completedUsers = regularUsers.filter(u => u.onboardingStatus === "completed").length;
  const activeUsers = regularUsers.filter(u => u.onboardingStatus === "in_progress").length;
  const totalSteps = userSteps.length;

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      await api.clearDatabase();
      toast({
        title: "Database Cleared",
        description: "All user data has been removed successfully",
      });
      // Reload the data
      const users = await api.getAllUsers();
      setAllUsers(users);
      setShowClearDialog(false);
    } catch (error) {
      console.error('Failed to clear database:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    setDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/user/${deletingUser.email}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove user from local state
      setAllUsers(users => users.filter(u => u.email !== deletingUser.email));
      
      toast({
        title: "User Deleted",
        description: `${deletingUser.name} has been removed from the system`,
      });
      
      setDeletingUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">{isAdmin ? "Admin Account" : "Account Details"}</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{isAdmin ? "admin.profile" : "user.profile"}</p>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profileFields.map((f) => (
            <div key={f.label} className="grid grid-cols-[80px_1fr] gap-2 items-center">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{f.label}</span>
              <span className="text-sm font-mono bg-background rounded px-2 py-1 border border-border">{f.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Users</span>
                <span className="text-sm font-mono bg-background rounded px-2 py-1 border border-border">{totalUsers}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Active</span>
                <span className="text-sm font-mono bg-background rounded px-2 py-1 border border-border">{activeUsers}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Completed</span>
                <span className="text-sm font-mono bg-background rounded px-2 py-1 border border-border">{completedUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Managed Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {regularUsers.length > 0 ? (
                <div className="space-y-2">
                  {regularUsers.map((u) => (
                    <div key={u.email} className="group flex items-center gap-3 p-2 rounded border border-border bg-background hover:border-primary/30 transition-colors relative">
                      <Activity className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-mono">{u.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{u.company} · {u.onboardingStatus.replace("_", " ")}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground group-hover:opacity-0 transition-opacity">{u.completionPercent}%</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1"
                        onClick={() => setDeletingUser(u)}
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-mono">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-mono">No users registered yet</p>
              )}
            </CardContent>
          </Card>

          {/* Clear Database Section */}
          <Card className="animate-slide-up border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-destructive tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Clear all user data, documents, and onboarding progress. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowClearDialog(true)}
                disabled={clearing}
                className="w-full font-mono text-sm"
              >
                {clearing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Database
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Confirmation Dialog */}
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Clear Database?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all user accounts, documents, onboarding steps, and activity logs.
                  The admin account will be preserved. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearDatabase}
                  disabled={clearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearing ? "Clearing..." : "Yes, Clear Database"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete User Confirmation Dialog */}
          <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-mono font-semibold">{deletingUser?.name}</span> ({deletingUser?.email})? 
                  This will permanently remove their account, documents, and onboarding progress. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Onboarding Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={user.completionPercent} className="h-2 mb-2" />
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Progress</span>
                <span className="text-sm font-mono">{user.completionPercent}%</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Status</span>
                <span className="text-sm font-mono capitalize">{user.onboardingStatus.replace("_", " ")}</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Steps</span>
                <span className="text-sm font-mono">
                  {userSteps.filter(s => s.status === "completed").length} / {totalSteps}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Document History</CardTitle>
            </CardHeader>
            <CardContent>
              {user.documentsUploaded.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {user.documentsUploaded.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded border border-border bg-background">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-mono">{doc.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{doc.size} · {doc.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> My Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground font-mono">Not a member of any teams yet</p>
              ) : (
                <div className="space-y-2">
                  {userTeams.map((team) => (
                    <div key={team.id} className="flex items-center gap-3 p-2 rounded border border-border bg-background">
                      <Users className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-mono">{team.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {team.description || "No description"} · {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
