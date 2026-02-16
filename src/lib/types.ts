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
  teams?: string[]; // Array of team IDs the user belongs to
  notifications?: Notification[];
}

export interface Notification {
  id: string;
  type: "team_added" | "team_removed" | "info";
  title: string;
  message: string;
  teamId?: string;
  teamName?: string;
  read: boolean;
  createdAt: string;
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

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
  createdAt: string;
  createdBy: string;
}
