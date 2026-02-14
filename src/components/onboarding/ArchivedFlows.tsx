import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle, Trash2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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

interface ArchivedFlow {
  id: string;
  documentName: string;
  documentId: string;
  steps: any[];
  completedAt: string;
  completionPercent: number;
}

interface ArchivedFlowsProps {
  userId: string;
  flows: ArchivedFlow[];
  onFlowDeleted: (flowId: string) => void;
}

export default function ArchivedFlows({ userId, flows, onFlowDeleted }: ArchivedFlowsProps) {
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const [deletingFlow, setDeletingFlow] = useState<ArchivedFlow | null>(null);
  const { toast } = useToast();

  const handleDeleteFlow = async () => {
    if (!deletingFlow) return;

    try {
      await api.deleteArchivedFlow(userId, deletingFlow.id);
      onFlowDeleted(deletingFlow.id);
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

  const handleDownloadReport = (flow: ArchivedFlow) => {
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

      const completedSteps = flow.steps.filter(s => s.status === 'completed').length;
      const totalTime = flow.steps.reduce((total, step) => {
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

      flow.steps.forEach((step, index) => {
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

  if (flows.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Onboarding History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flows.map((flow) => (
              <div key={flow.id} className="border border-border rounded-lg overflow-hidden">
                <div className="p-3 bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-mono truncate">{flow.documentName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(flow.completedAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {flow.completionPercent}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedFlow(expandedFlow === flow.id ? null : flow.id)}
                        title="View steps"
                      >
                        {expandedFlow === flow.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      {flow.completionPercent === 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleDownloadReport(flow)}
                          title="Download completion report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingFlow(flow)}
                        title="Delete flow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedFlow === flow.id && (
                  <div className="p-3 border-t border-border bg-muted/30">
                    <p className="text-xs font-mono uppercase text-muted-foreground mb-2">Steps</p>
                    <div className="space-y-1">
                      {flow.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          {step.status === "completed" ? (
                            <CheckCircle className="w-3 h-3 text-primary shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-border shrink-0" />
                          )}
                          <span className={`font-mono ${step.status === "completed" ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.title}
                          </span>
                          {step.timeSpent && step.status === "completed" && (
                            <span className="text-muted-foreground ml-auto">{step.timeSpent}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
