import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CHANGELOG, FAQ_ITEMS } from "@/lib/mock-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MousePointer2 } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="scrollbar-custom">
      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
        <div className="animate-slide-up">
          <span className="inline-block px-2 py-0.5 text-xs font-mono font-semibold bg-primary/10 text-primary rounded animate-pulse-tag mb-4">
            v2.0 RELEASED
          </span>
          <h1 className="text-5xl md:text-7xl font-semibold leading-[0.9] tracking-tight text-foreground mb-6">
            Customer<br />Onboarding<br />
            <span className="text-primary">Agent</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-md">
            AI-powered onboarding that parses your documents and generates guided steps. Upload, track, complete.
          </p>
          <Button
            size="lg"
            className="font-mono text-sm"
            onClick={() => navigate(user ? "/dashboard" : "/login")}
          >
            {user ? "Go to Dashboard" : "Get Started →"}
          </Button>
        </div>

        {/* Simulated UI window */}
        <div className="relative bg-background rounded-lg border border-border p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] animate-slide-up">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-destructive/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
            <span className="ml-2 text-[10px] font-mono text-muted-foreground">inspector.view</span>
          </div>
          <div className="space-y-3">
            {["div.onboard-card", "section.steps", "span.progress"].map((el, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded border border-border bg-card hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-mono text-[10px]">{"<>"}</span>
                </div>
                <div>
                  <p className="font-mono text-xs text-primary">{el}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">width: 100% · padding: 16px</p>
                </div>
              </div>
            ))}
          </div>
          {/* Animated cursor */}
          <div className="absolute bottom-8 right-8 animate-cursor-move">
            <MousePointer2 className="w-4 h-4 text-primary" />
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-16 right-16 bg-dark text-dark-foreground px-2 py-1 rounded text-[10px] font-mono shadow-lg">
            <span className="text-primary">color:</span> #06B6D4
          </div>
        </div>
      </section>

      {/* Release Notes */}
      <section className="border-t border-border p-8 md:p-12">
        <div className="grid md:grid-cols-[200px_1fr] gap-8">
          <div>
            <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Changelog</h2>
          </div>
          <ul className="space-y-2">
            {CHANGELOG.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-mono font-bold">+</span>
                <span className="font-mono text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* README Manifesto */}
      <section className="mx-8 md:mx-12 mb-8 rounded-lg overflow-hidden border border-border" style={{ background: "hsl(215 28% 8%)" }}>
        <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          <span className="font-mono text-xs text-muted-foreground/60">README.md</span>
        </div>
        <div className="p-6 font-mono text-sm leading-relaxed" style={{ color: "hsl(210 40% 85%)" }}>
          <p className="text-muted-foreground/60 mb-3"># Customer Onboarding Agent</p>
          <p className="mb-3">Streamline your customer onboarding with AI-powered document parsing. Upload your company handbook, and our system extracts actionable steps — turning static documents into interactive workflows.</p>
          <p className="text-muted-foreground/60 mb-3">### Quick Start</p>
          <div className="bg-black/30 rounded p-3 mt-2">
            <code className="text-primary text-xs">$ npx onboard-agent init --template=default</code>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="p-8 md:p-12 border-t border-border max-w-2xl mx-auto">
        <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-6">Technical FAQ</h2>
        <Accordion type="single" collapsible>
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-sm font-medium text-left">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
