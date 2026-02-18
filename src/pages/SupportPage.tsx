import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { 
  MessageSquare, 
  Send, 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  Search,
  User,
  Calendar,
  Reply,
  CheckCheck,
  Loader2
} from "lucide-react";

export default function SupportPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  });
  
  // Admin state
  const [queries, setQueries] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [responseText, setResponseText] = useState("");

  // Load queries on mount
  useEffect(() => {
    if (isAdmin) {
      loadAllQueries();
    } else if (user) {
      loadUserQueries();
    }
  }, [isAdmin, user]);

  const loadAllQueries = async () => {
    try {
      setLoadingQueries(true);
      const data = await api.getAllSupportQueries();
      setQueries(data);
    } catch (error) {
      console.error('Failed to load queries:', error);
      toast({
        title: "Error",
        description: "Failed to load support queries",
        variant: "destructive",
      });
    } finally {
      setLoadingQueries(false);
    }
  };

  const loadUserQueries = async () => {
    if (!user) return;
    try {
      setLoadingQueries(true);
      const data = await api.getUserSupportQueries(user.email);
      setQueries(data);
    } catch (error) {
      console.error('Failed to load user queries:', error);
    } finally {
      setLoadingQueries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createSupportQuery(
        formData.subject,
        formData.category,
        formData.priority,
        formData.description
      );

      toast({
        title: "Query Submitted",
        description: "We've received your query and will respond shortly.",
      });

      // Reset form
      setFormData({
        subject: "",
        category: "",
        priority: "medium",
        description: "",
      });

      // Reload queries
      if (user) {
        loadUserQueries();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (queryId: string, newStatus: string) => {
    try {
      await api.updateQueryStatus(queryId, newStatus);
      setQueries(prev => prev.map(q => 
        q.id === queryId ? { ...q, status: newStatus } : q
      ));
      
      // Clear selection if status is resolved or closed
      if (newStatus === 'resolved' || newStatus === 'closed') {
        setSelectedQuery(null);
        setResponseText("");
      }
      
      toast({
        title: "Status Updated",
        description: `Query marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleSendResponse = async (queryId: string) => {
    if (!responseText.trim()) return;

    try {
      const result = await api.addQueryResponse(queryId, responseText);
      setQueries(prev => prev.map(q => 
        q.id === queryId ? result.query : q
      ));
      setResponseText("");
      
      // Clear selection and hide query details after sending response
      setSelectedQuery(null);
      
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      open: { variant: "destructive", icon: AlertCircle },
      in_progress: { variant: "default", icon: Clock },
      resolved: { variant: "secondary", icon: CheckCircle2 },
      closed: { variant: "outline", icon: CheckCheck }
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500/10 text-red-500 border-red-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20"
    };
    return (
      <Badge variant="outline" className={colors[priority] || colors.medium}>
        {priority}
      </Badge>
    );
  };

  const filteredQueries = queries.filter(q => {
    const matchesStatus = filterStatus === "all" || q.status === filterStatus;
    const matchesSearch = q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedQueryData = queries.find(q => q.id === selectedQuery);

  // Admin View - Query Management Dashboard
  if (isAdmin) {
    if (loadingQueries) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm font-mono text-muted-foreground">Loading support queries...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 md:p-8 space-y-6 pattern-grid min-h-[60vh]">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-semibold">Support Query Management</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Manage and respond to customer support queries
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-red-500/50 cursor-pointer group">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider group-hover:text-red-500 transition-colors">
                Open Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-500 group-hover:scale-110 transition-transform">
                {queries.filter(q => q.status === "open").length}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer group" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider group-hover:text-primary transition-colors">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-primary group-hover:scale-110 transition-transform">
                {queries.filter(q => q.status === "in_progress").length}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-green-500/50 cursor-pointer group" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider group-hover:text-green-500 transition-colors">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-500 group-hover:scale-110 transition-transform">
                {queries.filter(q => q.status === "resolved").length}
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer group" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider group-hover:text-primary transition-colors">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">~2h</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Query List */}
          <Card className="md:col-span-1 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Query Inbox</CardTitle>
                <Badge variant="outline">{filteredQueries.length}</Badge>
              </div>
              <div className="space-y-2 mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 font-mono text-xs h-8"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="font-mono text-xs h-8">
                    <Filter className="w-3.5 h-3.5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queries</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredQueries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-mono">No queries found</p>
                </div>
              ) : (
                filteredQueries.map((query) => (
                  <div
                    key={query.id}
                    onClick={() => setSelectedQuery(query.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedQuery === query.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold line-clamp-1">{query.subject}</h3>
                      {getPriorityBadge(query.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <User className="w-3 h-3" />
                      <span className="font-mono">{query.userName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(query.status)}
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Query Details */}
          <Card className="md:col-span-2 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <CardHeader>
              <CardTitle className="text-sm">Query Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedQueryData ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground font-mono">
                    Select a query to view details
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Query Header */}
                  <div className="space-y-3 pb-4 border-b">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-lg font-semibold">{selectedQueryData.subject}</h2>
                      <div className="flex gap-2">
                        {getPriorityBadge(selectedQueryData.priority)}
                        {getStatusBadge(selectedQueryData.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="font-mono">{selectedQueryData.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span className="font-mono text-xs">{selectedQueryData.userId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="font-mono text-xs">
                          {new Date(selectedQueryData.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedQueryData.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Query Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Description</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {selectedQueryData.description}
                    </p>
                  </div>

                  {/* Conversation Thread */}
                  {selectedQueryData.responses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Conversation</h3>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {selectedQueryData.responses.map((response) => (
                          <div key={response.id} className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-primary">
                                {response.responderName}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {new Date(response.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Form */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Send Response</h3>
                      <Select
                        value={selectedQueryData.status}
                        onValueChange={(value) => handleStatusChange(selectedQueryData.id, value)}
                      >
                        <SelectTrigger className="w-[180px] font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Type your response here..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="font-mono text-sm resize-none"
                    />
                    <Button
                      onClick={() => handleSendResponse(selectedQueryData.id)}
                      disabled={!responseText.trim()}
                      className="w-full font-mono"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Customer View - Submit Query Form
  return (
    <div className="p-6 md:p-8 space-y-6 pattern-grid min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Support Center</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Get help with your onboarding journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Information Cards */}
        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Mail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-sm">Email Support</CardTitle>
            <CardDescription className="text-xs">We'll respond within 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">support@onboardflow.com</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer group" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Phone className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-sm">Phone Support</CardTitle>
            <CardDescription className="text-xs">Mon-Fri, 9AM-5PM EST</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">+1 (555) 123-4567</p>
          </CardContent>
        </Card>

        <Card className="animate-slide-up transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 cursor-pointer group" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Clock className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <CardTitle className="text-sm">Response Time</CardTitle>
            <CardDescription className="text-xs">Average response time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">~2 hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Submit Query Form */}
        <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <CardTitle>Submit a Query</CardTitle>
            </div>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs font-mono">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  required
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-mono">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
                    <SelectTrigger id="category" className="font-mono text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-xs font-mono">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleChange("priority", value)}>
                    <SelectTrigger id="priority" className="font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-mono">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your query..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  required
                  rows={6}
                  className="font-mono text-sm resize-none"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full font-mono">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Query
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">How do I upload a document?</h3>
              <p className="text-xs text-muted-foreground">
                Navigate to the Upload page, click "Choose File", select your PDF document, and click "Upload & Process". 
                The AI will automatically generate onboarding steps.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Can I edit generated steps?</h3>
              <p className="text-xs text-muted-foreground">
                Currently, steps are AI-generated and cannot be manually edited. However, you can upload a new document 
                to generate fresh steps.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">How do teams work?</h3>
              <p className="text-xs text-muted-foreground">
                Teams allow you to organize users and assign team-specific documents. Admins can create teams, 
                add members, and upload documents for specific teams.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">What file formats are supported?</h3>
              <p className="text-xs text-muted-foreground">
                Currently, we support PDF files only. Make sure your PDF contains readable text (not just scanned images) 
                for best results.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">How do I track my progress?</h3>
              <p className="text-xs text-muted-foreground">
                Your progress is automatically tracked as you complete steps. View your completion percentage on the 
                Dashboard and Onboarding pages.
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Can't find what you're looking for? Submit a query using the form and we'll help you out!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query History Section */}
      <Card className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <CardHeader>
          <CardTitle>Your Query History</CardTitle>
          <CardDescription>Track the status of your submitted queries</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingQueries ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-mono">Loading your queries...</p>
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground font-mono">No queries submitted yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your submitted queries will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queries.map((query) => (
                <div key={query.id} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">{query.subject}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{query.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(query.status)}
                      {getPriorityBadge(query.priority)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-mono">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {query.category}
                    </Badge>
                    {query.responses.length > 0 && (
                      <div className="flex items-center gap-1 text-primary">
                        <Reply className="w-3 h-3" />
                        <span>{query.responses.length} response{query.responses.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Show responses if any */}
                  {query.responses.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Latest Response:</p>
                      {query.responses.slice(-1).map((response: any) => (
                        <div key={response.id} className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-primary">
                              {response.responderName}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(response.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{response.message}</p>
                        </div>
                      ))}
                      {query.responses.length > 1 && (
                        <p className="text-xs text-muted-foreground text-center">
                          + {query.responses.length - 1} more response{query.responses.length - 1 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
