import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, Loader2, Eye, Trash2, Calendar, HardDrive, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UploadState = "idle" | "selected" | "processing" | "done";

interface DocumentRecord {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: "processing" | "parsed" | "error";
  teamId?: string;
  teamName?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
}

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [extractedSteps, setExtractedSteps] = useState<number>(0);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [deletingDoc, setDeletingDoc] = useState<DocumentRecord | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [loadingTeams, setLoadingTeams] = useState(true);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  // Load teams on mount (for admin only)
  useEffect(() => {
    async function loadTeams() {
      if (!user) {
        setLoadingTeams(false);
        return;
      }

      // Only load teams for admin users
      if (user.role !== 'admin') {
        console.log('👤 Regular user - will use user\'s teams automatically');
        setLoadingTeams(false);
        return;
      }

      // Don't reload if we already have teams
      if (teams.length > 0) {
        console.log('👥 Teams already loaded, skipping reload');
        setLoadingTeams(false);
        return;
      }

      try {
        console.log('👥 Loading all teams for admin:', user.email);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const url = `${apiUrl}/teams`;
        console.log('👥 Fetching from:', url);
        
        const authToken = localStorage.getItem('authToken');
        console.log('👥 Auth token exists:', !!authToken);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('👥 Response status:', response.status);
        console.log('👥 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('👥 Error response:', errorText);
          
          // If it's a 403, the user might not have admin access
          if (response.status === 403) {
            throw new Error('Admin access required to view teams');
          }
          
          throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
        }

        const teamsData = await response.json();
        console.log('👥 Teams loaded successfully:', teamsData);
        console.log('👥 Number of teams:', teamsData.length);
        
        if (!Array.isArray(teamsData)) {
          console.error('👥 Teams data is not an array:', teamsData);
          throw new Error('Invalid teams data format');
        }
        
        setTeams(teamsData);
        
        // Auto-select first team if only one available
        if (teamsData.length === 1 && !selectedTeam) {
          setSelectedTeam(teamsData[0].id);
          console.log('👥 Auto-selected team:', teamsData[0].name);
        }
      } catch (error) {
        console.error('❌ Failed to load teams:', error);
        toast({
          title: "Failed to load teams",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        setLoadingTeams(false);
      }
    }

    loadTeams();
  }, [user, toast]); // Removed teams and selectedTeam from dependencies to prevent re-loading

  // Load documents after teams are loaded
  useEffect(() => {
    async function loadDocuments() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Wait for teams to load first (for admin)
      if (user.role === 'admin' && loadingTeams) {
        return;
      }

      try {
        console.log('📄 Loading documents for user:', user.email, 'Role:', user.role);
        
        let allDocuments: DocumentRecord[] = [];
        
        if (user.role === 'admin') {
          // Admin: Fetch all users and collect all documents
          console.log('👑 Admin user - fetching all documents from all users');
          const usersResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });

          if (usersResponse.ok) {
            const allUsers = await usersResponse.json();
            console.log('👥 All users fetched:', allUsers.length);
            
            // Collect documents from all users
            allUsers.forEach((u: any) => {
              if (u.documentsUploaded && u.documentsUploaded.length > 0) {
                allDocuments.push(...u.documentsUploaded);
              }
            });
            
            console.log('📚 Total documents from all users:', allDocuments.length);
          }
        } else {
          // Regular user: Fetch documents for their teams
          console.log('👤 Regular user - fetching team documents');
          
          if (!user.teams || user.teams.length === 0) {
            console.log('⚠️ User has no teams assigned');
            setDocuments([]);
            setLoading(false);
            return;
          }
          
          const teamDocsResponse = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/user/${user.email}/team-documents`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            }
          );

          if (teamDocsResponse.ok) {
            allDocuments = await teamDocsResponse.json();
            console.log('📚 Team documents fetched:', allDocuments.length);
          } else {
            console.error('❌ Failed to fetch team documents:', teamDocsResponse.status);
            throw new Error('Failed to fetch team documents');
          }
        }
        
        console.log('📚 Documents to display:', allDocuments.length);
        
        // Enrich documents with team names
        const enrichedDocs = allDocuments.map((doc: DocumentRecord) => {
          if (doc.teamId) {
            const team = teams.find(t => t.id === doc.teamId);
            return {
              ...doc,
              teamName: team?.name
            };
          }
          return doc;
        });
        
        // Sort by upload date (newest first)
        enrichedDocs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        
        setDocuments(enrichedDocs);
      } catch (error) {
        console.error('❌ Failed to load documents:', error);
        toast({
          title: "Failed to load documents",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [user, toast, teams, loadingTeams]);

  const handleFile = useCallback((f: File) => {
    // For admin, require team selection
    if (user?.role === 'admin' && !selectedTeam) {
      toast({
        title: "No team selected",
        description: "Please select a team before uploading a document",
        variant: "destructive"
      });
      return;
    }
    
    // For regular users, check if they have a team
    if (user?.role !== 'admin' && (!user?.teams || user.teams.length === 0)) {
      toast({
        title: "No team assigned",
        description: "You need to be added to a team before uploading documents",
        variant: "destructive"
      });
      return;
    }
    
    if (!f.name.endsWith(".pdf")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }
    setFile(f);
    setFileInfo({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)} MB` });
    setState("selected");
  }, [toast, selectedTeam, user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const processFile = async () => {
    if (!file || !user) {
      return;
    }

    // For admin, require team selection
    if (user.role === 'admin' && !selectedTeam) {
      toast({
        title: "Missing information",
        description: "Please select a team before uploading",
        variant: "destructive"
      });
      return;
    }

    // For regular users, use their first team or require team selection if they have multiple
    let teamIdToUse = selectedTeam;
    if (user.role !== 'admin') {
      if (!user.teams || user.teams.length === 0) {
        toast({
          title: "No team assigned",
          description: "You need to be added to a team before uploading documents",
          variant: "destructive"
        });
        return;
      }
      // Use the first team for regular users
      teamIdToUse = user.teams[0];
    }

    setState("processing");
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 10, 90));
      }, 500);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.email);
      formData.append('teamId', teamIdToUse);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.details || errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setProgress(100);
      setExtractedSteps(data.steps?.length || 0);
      setState("done");

      // Add document to list with team info
      const teamName = user.role === 'admin' 
        ? teams.find(t => t.id === teamIdToUse)?.name 
        : 'Your Team';
      
      setDocuments(prev => [{
        ...data.document,
        teamId: teamIdToUse,
        teamName: teamName
      }, ...prev]);

      toast({
        title: "Document processed successfully",
        description: `AI extracted ${data.steps?.length || 0} onboarding steps${teamName ? ` for ${teamName}` : ''}`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      setState("selected");
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process document";
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingDoc || !user) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/document/${user.email}/${deletingDoc.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setDocuments(docs => docs.filter(d => d.id !== deletingDoc.id));
      
      // Refresh user data to update onboarding status
      await refreshUser();
      
      toast({
        title: "Document deleted",
        description: `${deletingDoc.name} and associated onboarding steps have been removed`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setDeletingDoc(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parsed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Document Upload</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Upload your onboarding PDF for AI parsing</p>
      </div>

      {/* Team Selection Section - Admin Only */}
      {user?.role === 'admin' && (
        <Card className="animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Select Team (Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeams ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono">Loading teams...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                  <p className="text-sm text-yellow-800 font-mono mb-2">
                    ⚠️ No teams available
                  </p>
                  <p className="text-xs text-yellow-700 font-mono">
                    Create teams first before uploading documents. Make sure the server is running on port 3001.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/teams')}
                    className="font-mono text-xs"
                  >
                    Go to Teams Page →
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="font-mono text-xs"
                  >
                    Retry Loading
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Choose which team to upload document for..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id} className="font-mono">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">{team.name}</span>
                          {team.description && (
                            <span className="text-xs text-muted-foreground mt-0.5">{team.description}</span>
                          )}
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTeam && (
                  <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <p className="text-xs text-primary font-mono">
                      Documents will be uploaded to {teams.find(t => t.id === selectedTeam)?.name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Upload Section */}
        <div className="space-y-6">
          {/* Drop zone */}
          {state === "idle" && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed border-border rounded-lg p-12 text-center transition-colors ${
                (user?.role === 'admin' && selectedTeam) || (user?.role !== 'admin' && user?.teams && user.teams.length > 0)
                  ? 'hover:border-primary/50 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              } animate-slide-up`}
              onClick={() => {
                const canUpload = (user?.role === 'admin' && selectedTeam) || (user?.role !== 'admin' && user?.teams && user.teams.length > 0);
                if (canUpload) {
                  document.getElementById("file-input")?.click();
                }
              }}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium">
                {user?.role === 'admin' && !selectedTeam
                  ? 'Select a team first to enable upload'
                  : user?.role !== 'admin' && (!user?.teams || user.teams.length === 0)
                  ? 'You need to be added to a team to upload documents'
                  : 'Drop your PDF here or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">PDF files only · Max 20MB</p>
              <input 
                id="file-input" 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                disabled={user?.role === 'admin' ? !selectedTeam : (!user?.teams || user.teams.length === 0)}
              />
            </div>
          )}

          {/* File preview */}
          {state !== "idle" && fileInfo && (
            <Card className="animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">File Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium font-mono">{fileInfo.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{fileInfo.size}</p>
                  </div>
                  {state === "done" && <CheckCircle className="w-5 h-5 text-primary" />}
                  {state === "processing" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                </div>

                {state === "processing" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                      <span>AI Parsing Document...</span>
                      <span>{Math.min(100, Math.round(progress))}%</span>
                    </div>
                    <Progress value={Math.min(100, progress)} className="h-2" />
                  </div>
                )}

                {state === "done" && (
                  <div className="mt-4 p-3 rounded bg-primary/5 border border-primary/20">
                    <p className="text-xs font-mono text-primary">✓ AI extracted {extractedSteps} onboarding steps from document</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            {state === "selected" && (
              <Button onClick={processFile} className="font-mono text-sm">Parse with AI →</Button>
            )}
            {state === "done" && user?.role !== 'admin' && (
              <Button onClick={() => navigate("/onboarding")} className="font-mono text-sm">View Onboarding Steps →</Button>
            )}
            {state !== "idle" && state !== "processing" && (
              <Button variant="outline" onClick={() => { setState("idle"); setFile(null); setFileInfo(null); }} className="font-mono text-sm">Upload Another</Button>
            )}
          </div>
        </div>

        {/* Right Column - Uploaded Documents */}
        <div className="space-y-6">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> {user?.role === 'admin' ? 'All Documents (All Teams)' : 'Uploaded Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground font-mono">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-mono">
                    {user?.role === 'admin' ? 'No documents uploaded yet across all teams' : 'No documents uploaded yet'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">Upload a PDF to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user?.role === 'admin' && (
                    <div className="text-xs text-muted-foreground font-mono mb-2">
                      Showing {documents.length} document{documents.length !== 1 ? 's' : ''} from all teams
                    </div>
                  )}
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="group border border-border rounded-lg p-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono truncate">{doc.name}</p>
                          {doc.teamName && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-mono">{doc.teamName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {doc.size}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(doc.uploadedAt)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setViewingDoc(doc)}
                            title="View document details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingDoc(doc)}
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-mono font-semibold">{deletingDoc?.name}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Details Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">Document Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              View information about your uploaded document
            </DialogDescription>
          </DialogHeader>
          
          {viewingDoc && (
            <div className="space-y-4">
              {/* Document Header */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono font-semibold text-lg truncate">{viewingDoc.name}</h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs font-mono px-2 py-1 rounded border capitalize ${getStatusColor(viewingDoc.status)}`}>
                      {viewingDoc.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">File Size</span>
                  </div>
                  <p className="font-mono font-semibold">{viewingDoc.size}</p>
                </div>
                
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Uploaded</span>
                  </div>
                  <p className="font-mono font-semibold text-sm">{formatDate(viewingDoc.uploadedAt)}</p>
                </div>
              </div>

              {/* Team Information */}
              {viewingDoc.teamName && (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Team</span>
                  </div>
                  <p className="font-mono font-semibold">{viewingDoc.teamName}</p>
                </div>
              )}

              {/* Document ID */}
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Document ID
                </div>
                <p className="font-mono text-xs text-muted-foreground break-all">{viewingDoc.id}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {user?.role !== 'admin' && (
                  <Button 
                    onClick={() => {
                      setViewingDoc(null);
                      navigate("/onboarding");
                    }}
                    className="flex-1 font-mono"
                  >
                    View Onboarding Steps →
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setViewingDoc(null)}
                  className={`font-mono ${user?.role === 'admin' ? 'flex-1' : ''}`}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
