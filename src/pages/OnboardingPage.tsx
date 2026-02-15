import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { OnboardingStep } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StepContent from "@/components/onboarding/StepContent";
import ArchivedFlows from "@/components/onboarding/ArchivedFlows";
import OnboardingChatbot from "@/components/onboarding/OnboardingChatbot";
import jsPDF from "jspdf";
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
  CheckCircle, Circle, Play, Clock, GitBranch, Sparkles, Brain,
  Building2, FileText, BarChart3, Shield, Info, Loader2, Upload,
  ChevronDown, ChevronUp, Download, Trash2, PartyPopper, Trophy
} from "lucide-react";

const MATURITY_LEVELS = [
  { label: "Startup", range: [0, 25], color: "text-destructive", bg: "bg-destructive/10" },
  { label: "Growing", range: [26, 50], color: "text-yellow-600", bg: "bg-yellow-100" },
  { label: "Established", range: [51, 75], color: "text-primary", bg: "bg-primary/10" },
  { label: "Enterprise", range: [76, 100], color: "text-primary", bg: "bg-primary/10" },
];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock');
  const [archivedFlows, setArchivedFlows] = useState<any[]>([]);
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<any | null>(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [completedFlowData, setCompletedFlowData] = useState<any | null>(null);

  // Fetch real steps from backend
  useEffect(() => {
    async function loadSteps() {
      if (!user) {
        console.log('❌ No user logged in');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching steps for user:', user.email);
      setLoading(true); // Ensure loading state is set

      try {
        const [fetchedSteps, archived] = await Promise.all([
          api.getSteps(user.email),
          api.getArchivedFlows(user.email)
        ]);
        
        console.log('📦 Received steps from API:', fetchedSteps);
        console.log('📊 Number of steps:', fetchedSteps?.length);
        console.log('📚 Archived flows:', archived?.length);
        
        setArchivedFlows(archived || []);
        
        if (fetchedSteps && fetchedSteps.length > 0) {
          console.log('✅ Using REAL Gemini-generated steps');
          console.log('📋 First step title:', fetchedSteps[0].title);
          console.log('📊 Total steps:', fetchedSteps.length);
          setDataSource('real');
          // Use real Gemini-generated steps with their saved status
          setSteps(fetchedSteps);
          // Set active step to first in-progress or pending step
          const activeIdx = fetchedSteps.findIndex(s => s.status === "in_progress");
          if (activeIdx !== -1) {
            setActiveStep(activeIdx);
          } else {
            const pendingIdx = fetchedSteps.findIndex(s => s.status === "pending");
            setActiveStep(pendingIdx !== -1 ? pendingIdx : 0);
          }
        } else {
          console.log('⚠️ No steps found - user needs to upload document');
          setDataSource('mock');
          // No fallback - user must upload document
          setSteps([]);
        }
      } catch (error) {
        console.error('❌ Failed to load steps:', error);
        console.log('⚠️ Error loading steps - showing empty state');
        setDataSource('mock');
        // No fallback on error - show empty state
        setSteps([]);
      } finally {
        setLoading(false);
      }
    }

    loadSteps();
  }, [user]);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percent = Math.round((completedCount / steps.length) * 100);

  const maturity = useMemo(() => {
    return MATURITY_LEVELS.find((m) => percent >= m.range[0] && percent <= m.range[1]) || MATURITY_LEVELS[0];
  }, [percent]);

  const completeStep = async (id: number) => {
    if (!user) return;

    const timeSpent = `${Math.floor(Math.random() * 20 + 5)}m`;
    
    try {
      // Update backend first
      await api.updateStepStatus(user.email, id, "completed", timeSpent);
      
      // Then update local state
      setSteps((prev) => {
        const updated = prev.map((s) => {
          if (s.id === id) return { ...s, status: "completed" as const, timeSpent };
          return s;
        });
        
        // Check if all steps are now completed
        const allCompleted = updated.every(s => s.status === "completed");
        
        if (allCompleted) {
          // Trigger completion animation
          setShowCompletionAnimation(true);
          
          // Prepare the completed flow data
          const mostRecentDoc = user.documentsUploaded && user.documentsUploaded.length > 0 
            ? user.documentsUploaded[user.documentsUploaded.length - 1] 
            : null;
          
          const flowData = {
            id: `flow-${Date.now()}`,
            documentName: mostRecentDoc?.name || "Onboarding.pdf",
            documentId: mostRecentDoc?.id || "doc-" + Date.now(),
            steps: updated,
            completedAt: new Date().toISOString(),
            completionPercent: 100
          };
          setCompletedFlowData(flowData);
          
          // Archive the flow after animation (3 seconds)
          setTimeout(async () => {
            try {
              // Try to archive via API
              await api.archiveFlow(user.email, flowData);
              console.log('✅ Flow archived successfully via API');
            } catch (error) {
              console.error('⚠️ Failed to archive flow via API, adding locally:', error);
              // Continue anyway - add to local state even if API fails
            } finally {
              // Always add to local state and hide animation
              setArchivedFlows(prev => [flowData, ...prev]);
              setShowCompletionAnimation(false);
              setCompletedFlowData(null);
              
              toast({
                title: "Onboarding Complete!",
                description: "Your completion report has been added to history",
              });
            }
          }, 3000);
        } else {
          const nextIdx = updated.findIndex((s) => s.status === "pending");
          if (nextIdx !== -1) {
            updated[nextIdx] = { ...updated[nextIdx], status: "in_progress" };
            setActiveStep(nextIdx);
            // Update next step status in backend
            api.updateStepStatus(user.email, updated[nextIdx].id, "in_progress").catch(console.error);
          }
        }
        
        return updated;
      });

      // Refresh user data to update progress everywhere
      await refreshUser();

      toast({
        title: "Progress Saved",
        description: "Your progress has been saved successfully",
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFlow = async () => {
    if (!deletingFlow || !user) return;

    try {
      await api.deleteArchivedFlow(user.email, deletingFlow.id);
      setArchivedFlows(flows => flows.filter(f => f.id !== deletingFlow.id));
      toast({
        title: "Flow deleted",
        description: "Archived onboarding flow has been removed",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete archived flow",
        variant: "destructive"
      });
    } finally {
      setDeletingFlow(null);
    }
  };

  const handleDownloadReport = (flow: any) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Title
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('Onboarding Completion Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Date
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Divider
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Summary
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0);
      doc.text('Summary', margin, yPosition);
      yPosition += 10;

      const completedSteps = flow.steps.filter((s: any) => s.status === 'completed').length;
      const totalTime = flow.steps.reduce((total: number, step: any) => {
        const time = parseInt(step.timeSpent) || 0;
        return total + time;
      }, 0);

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Document: ${flow.documentName}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Total Steps: ${flow.steps.length}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Completed Steps: ${completedSteps}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Progress: ${flow.completionPercent}%`, margin, yPosition);
      yPosition += 7;
      doc.text(`Total Time: ${totalTime} minutes`, margin, yPosition);
      yPosition += 7;
      doc.text(`Completed: ${new Date(flow.completedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      })}`, margin, yPosition);
      yPosition += 15;

      // Steps Section
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Completed Steps', margin, yPosition);
      yPosition += 10;

      flow.steps.forEach((step: any, index: number) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 100, 200);
        doc.text(`Step ${index + 1}`, margin, yPosition);
        doc.setTextColor(100);
        doc.text(`${step.timeSpent}`, pageWidth - margin - 20, yPosition);
        yPosition += 6;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0);
        const titleLines = doc.splitTextToSize(step.title, pageWidth - 2 * margin);
        doc.text(titleLines, margin, yPosition);
        yPosition += titleLines.length * 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);
        const descLines = doc.splitTextToSize(step.description, pageWidth - 2 * margin);
        doc.text(descLines, margin, yPosition);
        yPosition += descLines.length * 5 + 8;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('AI-Generated Onboarding Report', pageWidth / 2, pageHeight - 10, { align: 'center' });

      doc.save(`onboarding-${flow.documentName.replace('.pdf', '')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Onboarding completion report has been downloaded",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    }
  };

  const active = steps[activeStep];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-mono text-muted-foreground">Loading onboarding steps...</p>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-md">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Onboarding Steps Yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your company document to generate personalized AI-powered onboarding steps.
            </p>
            <Button 
              onClick={() => navigate("/upload")}
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </div>
        
        {/* Show archived flows even when no active steps */}
        {user && archivedFlows.length > 0 && (
          <div className="max-w-4xl mx-auto px-4">
            <ArchivedFlows 
              userId={user.email} 
              flows={archivedFlows}
              onFlowDeleted={(flowId) => setArchivedFlows(flows => flows.filter(f => f.id !== flowId))}
            />
          </div>
        )}

        {/* Chatbot for general questions even without steps */}
        <OnboardingChatbot 
          allSteps={[]}
          documentName={user?.documentsUploaded?.[user.documentsUploaded.length - 1]?.name}
        />
      </div>
    );
  }

  return (
    <>
    {/* Completion Animation Overlay */}
    {showCompletionAnimation && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
        <div className="text-center max-w-2xl px-6 animate-slide-up">
          {/* Animated Trophy Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-bounce-slow">
              <Trophy className="w-16 h-16 text-primary animate-pulse" />
            </div>
            {/* Confetti Effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <PartyPopper className="w-8 h-8 text-yellow-500 absolute -top-4 -left-4 animate-spin-slow" />
              <Sparkles className="w-6 h-6 text-primary absolute -top-2 right-8 animate-pulse" />
              <Sparkles className="w-5 h-5 text-yellow-500 absolute bottom-4 -left-8 animate-pulse delay-100" />
              <PartyPopper className="w-7 h-7 text-primary absolute -bottom-2 right-4 animate-spin-slow delay-200" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold mb-4 animate-fade-in">
            🎉 Onboarding Complete! 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-6 animate-fade-in delay-100">
            AI-driven workflow finished. All {steps.length} adaptive steps completed based on your company profile.
          </p>

          {/* Stats Card */}
          <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-6 inline-block animate-fade-in delay-200">
            <p className="text-lg font-mono text-primary font-semibold">
              {steps.length}/{steps.length} steps • 100% • Enterprise Ready
            </p>
          </div>

          {/* Info Text */}
          <p className="text-sm text-muted-foreground mt-6 animate-fade-in delay-300">
            Your completion report is being added to the Onboarding History...
          </p>

          {/* Progress Indicator */}
          <div className="mt-4 flex justify-center gap-2 animate-fade-in delay-400">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )}

    <div className="flex flex-col md:flex-row min-h-[60vh]">
      {/* Data Source Indicator */}
      <div className="absolute top-2 right-2 z-10">
        {dataSource === 'real' ? (
          <div className="bg-primary/10 border border-primary/30 rounded px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">AI-Generated Steps</span>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-600" />
            <span className="text-xs font-mono text-yellow-700">Demo Mode - Upload your document for AI steps</span>
          </div>
        )}
      </div>

      {/* Left sidebar - AI Workflow Explorer */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-4 bg-chrome/50">
        {/* AI Engine Banner */}
        <div className="mb-4 p-2.5 rounded-md bg-dark text-dark-foreground">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary">AI Workflow Engine</span>
          </div>
          <p className="text-[10px] font-mono text-dark-foreground/60 leading-relaxed">
            Steps dynamically generated from company profile &amp; document analysis
          </p>
        </div>

        {/* Maturity Assessment */}
        <div className="mb-4 p-2.5 rounded-md border border-border bg-card">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">Maturity Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold font-mono ${maturity.color}`}>{percent}%</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${maturity.bg} ${maturity.color}`}>
              {maturity.label}
            </span>
          </div>
          <Progress value={percent} className="h-1.5 mt-2" />
          <p className="text-[10px] font-mono text-muted-foreground mt-1.5">{completedCount}/{steps.length} steps completed</p>
        </div>

        {/* Steps */}
        <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Adaptive Steps
        </p>
        <div className="space-y-0.5">
          {steps.map((step, i) => {
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-xs text-left transition-all duration-200 group ${
                  i === activeStep
                    ? "bg-card border border-primary/30 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50 hover:translate-x-0.5"
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : step.status === "in_progress" ? (
                  <Play className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse-tag" />
                ) : (
                  <Circle className="w-3.5 h-3.5 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-mono text-[11px]">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Archived Flows in Sidebar */}
        {user && archivedFlows.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Onboarding History
            </p>
            <div className="space-y-2">
              {archivedFlows.map((flow) => {
                const isExpanded = expandedFlow === flow.id;
                return (
                  <div key={flow.id} className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/30 transition-colors">
                    <div className="p-2">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-[11px] font-medium font-mono truncate flex-1">{flow.documentName}</p>
                        <button
                          onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                          className="shrink-0 hover:bg-muted rounded p-0.5 transition-colors"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>{flow.completionPercent}%</span>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-border space-y-1">
                          {flow.steps.slice(0, 3).map((step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 text-[10px]">
                              {step.status === "completed" ? (
                                <CheckCircle className="w-2 h-2 text-primary shrink-0" />
                              ) : (
                                <Circle className="w-2 h-2 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate text-muted-foreground">{step.title}</span>
                            </div>
                          ))}
                          {flow.steps.length > 3 && (
                            <p className="text-[9px] text-muted-foreground pl-3">+{flow.steps.length - 3} more</p>
                          )}
                          
                          <div className="flex gap-1 pt-2">
                            {flow.completionPercent === 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] flex-1 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleDownloadReport(flow)}
                                title="Download report"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeletingFlow(flow)}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Center - AI-Enhanced Step Details */}
      <div className="flex-1 p-6 md:p-8">
        {percent === 100 && (
          <div className="animate-slide-up max-w-4xl mx-auto space-y-6">
            {/* Completion Header */}
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Onboarding Complete!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                AI-driven workflow finished. All {steps.length} adaptive steps completed based on your company profile.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 inline-block">
                <p className="text-sm font-mono text-primary">{completedCount}/{steps.length} steps • 100% • Enterprise Ready</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                View your completion report in the Onboarding History section below.
              </p>
            </div>
          </div>
        )}
        {percent < 100 && active && (
          <StepContent step={active} onComplete={completeStep} />
        )}
      </div>

      {/* Right sidebar - AI Property Inspector */}
      <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border p-4 bg-chrome/50">
        <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-3">Properties</p>
        {active && (
          <div className="space-y-3">
            {[
              { label: "Status", value: active.status.replace("_", " ") },
              { label: "Time Spent", value: active.timeSpent },
              { label: "Step ID", value: `#${active.id}` },
            ].map((prop) => (
              <div key={prop.label} className="grid grid-cols-[80px_1fr] gap-2 items-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{prop.label}</span>
                <span className="text-xs font-mono bg-card rounded px-2 py-1 border border-border capitalize">{prop.value}</span>
              </div>
            ))}

            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <GitBranch className="w-3 h-3" /> Dependencies
              </span>
              {active.dependencies.length > 0 ? (
                active.dependencies.map((d, i) => (
                  <span key={i} className="inline-block text-[10px] font-mono bg-card rounded px-2 py-0.5 border border-border mr-1 mb-1">{d}</span>
                ))
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground">None</span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Time Spent
              </span>
              <span className="text-xs font-mono">{active.timeSpent}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={!!deletingFlow} onOpenChange={(open) => !open && setDeletingFlow(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Archived Flow?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the onboarding history for{" "}
            <span className="font-mono font-semibold">{deletingFlow?.documentName}</span>? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteFlow}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Onboarding Chatbot Assistant */}
    {steps.length > 0 && (
      <OnboardingChatbot 
        currentStep={active}
        allSteps={steps}
        documentName={user?.documentsUploaded?.[user.documentsUploaded.length - 1]?.name}
      />
    )}
  </>
  );
}
