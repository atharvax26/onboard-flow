import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Rocket } from "lucide-react";

interface WelcomeAnimationProps {
  userName: string;
  onComplete: () => void;
}

export default function WelcomeAnimation({ userName, onComplete }: WelcomeAnimationProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2500),
      setTimeout(() => onComplete(), 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="text-center space-y-8 px-4">
        {/* Main welcome message */}
        <div className={`transition-all duration-700 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2" />
              </div>
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-primary/60 rounded-full -translate-x-1/2" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome, {userName}!
          </h1>
          <p className="text-lg text-muted-foreground font-mono">
            Your account has been created successfully
          </p>
        </div>

        {/* Feature highlights */}
        <div className={`grid md:grid-cols-3 gap-6 max-w-3xl mx-auto transition-all duration-700 delay-300 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">AI-Powered</h3>
            <p className="text-xs text-muted-foreground text-center">
              Upload documents and get instant onboarding steps
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">Track Progress</h3>
            <p className="text-xs text-muted-foreground text-center">
              Monitor your onboarding journey in real-time
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm">24/7 Assistant</h3>
            <p className="text-xs text-muted-foreground text-center">
              Get help anytime with our AI chatbot
            </p>
          </div>
        </div>

        {/* Getting started message */}
        <div className={`transition-all duration-700 delay-500 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <p className="text-sm font-mono text-primary">
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
