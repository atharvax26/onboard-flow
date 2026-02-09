export interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: "user" | "admin";
  onboardingStatus: "not_started" | "in_progress" | "completed";
  completionPercent: number;
  currentStep: number;
  lastActivity: string;
  documentsUploaded: DocumentRecord[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: "processing" | "parsed" | "error";
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  details: string;
  status: "pending" | "in_progress" | "completed";
  timeSpent: string;
  dependencies: string[];
}
