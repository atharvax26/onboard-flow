import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";

type UploadState = "idle" | "selected" | "processing" | "done";

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".pdf")) return;
    setFile({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(2)} MB` });
    setState("selected");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const processFile = () => {
    setState("processing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setState("done");
          return 100;
        }
        return p + Math.random() * 15;
      });
    }, 300);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 min-h-[60vh]">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold">Document Upload</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Upload your onboarding PDF for AI parsing</p>
      </div>

      {/* Drop zone */}
      {state === "idle" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer animate-slide-up"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium">Drop your PDF here or click to browse</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">PDF files only · Max 20MB</p>
          <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* File preview */}
      {state !== "idle" && file && (
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
                <p className="text-sm font-medium font-mono">{file.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{file.size}</p>
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
                <p className="text-xs font-mono text-primary">✓ AI extracted 8 onboarding steps from document</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {state === "selected" && (
          <Button onClick={processFile} className="font-mono text-sm">Parse with AI →</Button>
        )}
        {state === "done" && (
          <Button onClick={() => navigate("/onboarding")} className="font-mono text-sm">View Onboarding Steps →</Button>
        )}
        {state !== "idle" && state !== "processing" && (
          <Button variant="outline" onClick={() => { setState("idle"); setFile(null); }} className="font-mono text-sm">Upload Another</Button>
        )}
      </div>
    </div>
  );
}
