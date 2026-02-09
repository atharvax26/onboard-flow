import { User, OnboardingStep } from "./types";

export const MOCK_ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: "Company Profile Setup", description: "Configure your organization's basic information", details: "Enter your company name, industry, size, and primary contact details. This information will be used throughout the onboarding process to customize your experience.", status: "pending", timeSpent: "0m", dependencies: [] },
  { id: 2, title: "Team Members Invitation", description: "Invite key stakeholders to the platform", details: "Add team members who will be involved in the onboarding process. Assign roles such as Admin, Manager, or Viewer to control access levels.", status: "pending", timeSpent: "0m", dependencies: ["Company Profile Setup"] },
  { id: 3, title: "Compliance Documents Review", description: "Review and acknowledge required compliance documents", details: "Read through the Terms of Service, Privacy Policy, and Data Processing Agreement. Digital signatures are required for each document.", status: "pending", timeSpent: "0m", dependencies: ["Company Profile Setup"] },
  { id: 4, title: "Integration Configuration", description: "Connect your existing tools and services", details: "Set up integrations with your CRM, email provider, and project management tools. API keys and OAuth connections will be configured here.", status: "pending", timeSpent: "0m", dependencies: ["Team Members Invitation"] },
  { id: 5, title: "Data Migration", description: "Import existing data from legacy systems", details: "Upload CSV files or connect directly to your previous platform to migrate historical data. The system will validate and map fields automatically.", status: "pending", timeSpent: "0m", dependencies: ["Integration Configuration"] },
  { id: 6, title: "Workflow Customization", description: "Tailor workflows to your business processes", details: "Configure approval chains, notification rules, and automation triggers. Set up custom fields and categories specific to your operations.", status: "pending", timeSpent: "0m", dependencies: ["Data Migration"] },
  { id: 7, title: "Training & Certification", description: "Complete platform training modules", details: "Watch training videos, complete interactive tutorials, and pass the certification quiz to ensure your team is ready to use the platform effectively.", status: "pending", timeSpent: "0m", dependencies: ["Workflow Customization"] },
  { id: 8, title: "Go-Live Checklist", description: "Final verification before launching", details: "Run through the pre-launch checklist to verify all configurations, test key workflows, and confirm that all team members have access.", status: "pending", timeSpent: "0m", dependencies: ["Training & Certification"] },
];

export const MOCK_USERS: User[] = [
  { id: "1", email: "admin@demo.com", name: "Alex Admin", company: "TechCorp", role: "admin", onboardingStatus: "completed", completionPercent: 100, currentStep: 8, lastActivity: "2024-01-15T10:30:00Z", documentsUploaded: [{ id: "d1", name: "onboarding-guide.pdf", size: "2.4 MB", uploadedAt: "2024-01-10T09:00:00Z", status: "parsed" }] },
  { id: "2", email: "jane@acme.com", name: "Jane Cooper", company: "Acme Inc", role: "user", onboardingStatus: "in_progress", completionPercent: 62, currentStep: 5, lastActivity: "2024-01-14T14:20:00Z", documentsUploaded: [{ id: "d2", name: "company-docs.pdf", size: "1.8 MB", uploadedAt: "2024-01-12T11:00:00Z", status: "parsed" }] },
  { id: "3", email: "bob@startup.io", name: "Bob Builder", company: "Startup.io", role: "user", onboardingStatus: "in_progress", completionPercent: 37, currentStep: 3, lastActivity: "2024-01-13T16:45:00Z", documentsUploaded: [{ id: "d3", name: "startup-onboard.pdf", size: "956 KB", uploadedAt: "2024-01-13T10:00:00Z", status: "parsed" }] },
  { id: "4", email: "sara@bigco.com", name: "Sara Smith", company: "BigCo", role: "user", onboardingStatus: "not_started", completionPercent: 0, currentStep: 0, lastActivity: "2024-01-11T08:00:00Z", documentsUploaded: [] },
  { id: "5", email: "mike@design.co", name: "Mike Design", company: "Design Co", role: "user", onboardingStatus: "in_progress", completionPercent: 87, currentStep: 7, lastActivity: "2024-01-15T09:15:00Z", documentsUploaded: [{ id: "d5", name: "design-process.pdf", size: "3.1 MB", uploadedAt: "2024-01-09T15:30:00Z", status: "parsed" }] },
  { id: "6", email: "lisa@corp.net", name: "Lisa Wong", company: "CorpNet", role: "user", onboardingStatus: "completed", completionPercent: 100, currentStep: 8, lastActivity: "2024-01-14T11:00:00Z", documentsUploaded: [{ id: "d6", name: "corp-handbook.pdf", size: "4.2 MB", uploadedAt: "2024-01-08T09:00:00Z", status: "parsed" }] },
];

export const MOCK_ACTIVITY = [
  { id: "a1", action: "Document uploaded", detail: "onboarding-guide.pdf", time: "2 hours ago" },
  { id: "a2", action: "Step completed", detail: "Company Profile Setup", time: "3 hours ago" },
  { id: "a3", action: "Team member invited", detail: "john@company.com", time: "5 hours ago" },
  { id: "a4", action: "Integration connected", detail: "Slack workspace", time: "1 day ago" },
  { id: "a5", action: "Document parsed", detail: "AI extracted 8 onboarding steps", time: "1 day ago" },
];

export const CHANGELOG = [
  "AI-powered document parsing for onboarding extraction",
  "Three-panel IDE workspace for step management",
  "Real-time progress tracking with property inspector",
  "Admin analytics dashboard with bottleneck analysis",
  "Drag-and-drop PDF upload with instant preview",
  "Team collaboration with role-based access",
];

export const FAQ_ITEMS = [
  { q: "How does the AI parse onboarding documents?", a: "Our system analyzes uploaded PDF documents using natural language processing to extract actionable onboarding steps, requirements, and dependencies automatically." },
  { q: "Can I customize the generated onboarding steps?", a: "Yes. After AI parsing, you can edit, reorder, add, or remove any steps. The system provides a starting point that you can fully customize." },
  { q: "What file formats are supported?", a: "Currently we support PDF documents. Upload your company's onboarding handbook, policy documents, or process guides in PDF format." },
  { q: "How does the admin analytics work?", a: "Admin users can track all users' onboarding progress, identify bottleneck steps, view completion rates, and export detailed reports." },
];
