import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  Loader2,
  UserPlus,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array of email addresses
  createdAt: string;
  createdBy: string;
}

export default function TeamsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  
  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can access the Teams page",
        variant: "destructive"
      });
      return;
    }
    
    loadTeams();
  }, [isAdmin, toast]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teams`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Failed to load teams:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load teams. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Validation Error",
        description: "Team name is required",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teams`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: teamName,
            description: teamDescription
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const newTeam = await response.json();
      setTeams(prev => [newTeam, ...prev]);
      
      toast({
        title: "Team Created",
        description: `${teamName} has been created successfully`,
      });

      setShowCreateDialog(false);
      setTeamName("");
      setTeamDescription("");
    } catch (error) {
      console.error('Failed to create team:', error);
      toast({
        title: "Create Failed",
        description: error instanceof Error ? error.message : "Failed to create team",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !selectedTeam) {
      toast({
        title: "Validation Error",
        description: "Email address is required",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setAddingMember(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teams/${selectedTeam.id}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: memberEmail })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      const updatedTeam = await response.json();
      setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      
      toast({
        title: "Member Added",
        description: `${memberEmail} has been added to ${selectedTeam.name}`,
      });

      setShowAddMemberDialog(false);
      setMemberEmail("");
      setSelectedTeam(null);
    } catch (error) {
      console.error('Failed to add member:', error);
      toast({
        title: "Add Failed",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive"
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (teamId: string, email: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teams/${teamId}/members/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      const updatedTeam = await response.json();
      setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      
      toast({
        title: "Member Removed",
        description: `${email} has been removed from the team`,
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast({
        title: "Remove Failed",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/teams/${deletingTeam.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id));
      
      toast({
        title: "Team Deleted",
        description: `${deletingTeam.name} has been deleted`,
      });

      setDeletingTeam(null);
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete team",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Only admins can access the Teams page</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-mono text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 min-h-[60vh]">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold">Teams</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">Manage teams and assign members</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="font-mono">
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card className="animate-slide-up">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first team to organize users and manage onboarding
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="font-mono">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id} className="animate-slide-up">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-mono">{team.name}</CardTitle>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeletingTeam(team)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
                      Members ({team.members.length})
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs font-mono"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Member
                    </Button>
                  </div>

                  {team.members.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-border rounded-lg">
                      <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground font-mono">No members yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {team.members.map((email) => (
                        <div
                          key={email}
                          className="group flex items-center justify-between p-2 rounded border border-border bg-background hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{email}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(team.id, email)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team to organize users and manage their onboarding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Engineering Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (Optional)</Label>
              <Input
                id="team-description"
                placeholder="Brief description of the team"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setTeamName("");
                setTeamDescription("");
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a user to {selectedTeam?.name} by their email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email Address</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="user@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberDialog(false);
                setMemberEmail("");
                setSelectedTeam(null);
              }}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={addingMember}>
              {addingMember ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation */}
      <AlertDialog open={!!deletingTeam} onOpenChange={(open) => !open && setDeletingTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{deletingTeam?.name}</span>? 
              This will remove the team and all its members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
