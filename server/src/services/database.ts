import { OnboardingStep } from './gemini.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/database.json');

interface User {
  id: string;
  email: string;
  name: string;
  company: string;
  role: 'user' | 'admin';
  password?: string; // Hashed password
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  completionPercent: number;
  currentStep: number;
  lastActivity: string;
  documentsUploaded: DocumentRecord[];
}

interface DocumentRecord {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: 'processing' | 'parsed' | 'error';
}

interface Activity {
  id: string;
  action: string;
  detail: string;
  time: string;
}

interface ArchivedFlow {
  id: string;
  documentName: string;
  documentId: string;
  steps: OnboardingStep[];
  completedAt: string;
  completionPercent: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // Array of email addresses
  createdAt: string;
  createdBy: string;
}

interface DatabaseData {
  users: [string, User][];
  steps: [string, OnboardingStep[]][];
  archivedFlows: [string, ArchivedFlow[]][];
  activities: [string, Activity[]][];
  adminActivities: Activity[];
  teams: Team[];
}

class Database {
  private users: Map<string, User> = new Map();
  private steps: Map<string, OnboardingStep[]> = new Map();
  private archivedFlows: Map<string, ArchivedFlow[]> = new Map(); // userId -> archived flows
  private activities: Map<string, Activity[]> = new Map();
  private adminActivities: Activity[] = [];
  private teams: Team[] = [];

  constructor() {
    // Load data from file if it exists
    this.loadFromFile();
    
    // Ensure admin user exists
    if (!this.users.has('admin@demo.com')) {
      this.users.set('admin@demo.com', {
        id: 'admin',
        email: 'admin@demo.com',
        name: 'Admin User',
        company: 'Demo Company',
        role: 'admin',
        password: '$2b$10$onq3idDnEvfICgWeHIJBDOAN/8ipJQOACQBx5301EKxeOYBc.skhu', // admin123
        onboardingStatus: 'completed',
        completionPercent: 100,
        currentStep: 0,
        lastActivity: new Date().toISOString(),
        documentsUploaded: []
      });
    }
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  createUser(email: string, name: string, company: string, hashedPassword: string): User {
    const user: User = {
      id: email,
      email,
      name,
      company,
      role: 'user',
      password: hashedPassword,
      onboardingStatus: 'not_started',
      completionPercent: 0,
      currentStep: 0,
      lastActivity: new Date().toISOString(),
      documentsUploaded: []
    };
    this.users.set(email, user);
    this.persistChanges();
    return user;
  }

  addDocument(userId: string, doc: { name: string; size: string }): DocumentRecord {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const document: DocumentRecord = {
      id: `doc-${Date.now()}`,
      name: doc.name,
      size: doc.size,
      uploadedAt: new Date().toISOString(),
      status: 'parsed'
    };

    user.documentsUploaded.push(document);
    user.lastActivity = new Date().toISOString();
    
    this.addActivity(userId, 'Document uploaded', doc.name);
    this.addAdminActivity(user.name, `Uploaded document: ${doc.name}`);
    
    this.persistChanges();
    return document;
  }

  deleteDocument(userId: string, documentId: string): boolean {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const docIndex = user.documentsUploaded.findIndex(d => d.id === documentId);
    if (docIndex === -1) return false;

    const doc = user.documentsUploaded[docIndex];
    user.documentsUploaded.splice(docIndex, 1);
    user.lastActivity = new Date().toISOString();

    // Clear user's onboarding steps when document is deleted
    this.steps.delete(userId);
    user.onboardingStatus = 'not_started';
    user.completionPercent = 0;
    user.currentStep = 0;

    this.addActivity(userId, 'Document deleted', doc.name);
    this.addAdminActivity(user.name, `Deleted document: ${doc.name}`);

    console.log(`🗑️ Document deleted and steps cleared for user: ${userId}`);

    this.persistChanges();
    return true;
  }

  getUserSteps(userId: string): OnboardingStep[] {
    console.log(`📊 getUserSteps called for: ${userId}`);
    const userSteps = this.steps.get(userId);
    console.log(`   User-specific steps: ${userSteps?.length || 0}`);
    
    if (userSteps && userSteps.length > 0) {
      console.log(`   ✅ Returning ${userSteps.length} Gemini-generated steps`);
      return userSteps;
    }
    
    console.log(`   ⚠️ No steps found - user needs to upload a document`);
    return [];
  }

  setUserSteps(userId: string, steps: OnboardingStep[], newDocumentName?: string): void {
    const user = this.users.get(userId);
    console.log(`📝 setUserSteps called for: ${userId}, steps count: ${steps.length}`);
    
    // Archive previous flow if it was completed
    const existingSteps = this.steps.get(userId);
    if (existingSteps && existingSteps.length > 0 && user) {
      const completedSteps = existingSteps.filter(s => s.status === 'completed').length;
      const completionPercent = Math.round((completedSteps / existingSteps.length) * 100);
      
      // Only archive if there was significant progress (at least 1 step completed)
      if (completedSteps > 0) {
        // Get the document that was associated with these steps (second to last, since new one was just added)
        const documentIndex = user.documentsUploaded.length >= 2 ? user.documentsUploaded.length - 2 : 0;
        const oldDocument = user.documentsUploaded[documentIndex];
        
        const archivedFlow: ArchivedFlow = {
          id: `flow-${Date.now()}`,
          documentName: oldDocument?.name || 'Unknown Document',
          documentId: oldDocument?.id || '',
          steps: existingSteps,
          completedAt: new Date().toISOString(),
          completionPercent
        };
        
        const userArchive = this.archivedFlows.get(userId) || [];
        userArchive.unshift(archivedFlow); // Add to beginning
        this.archivedFlows.set(userId, userArchive);
        
        console.log(`📦 Archived previous flow "${oldDocument?.name}" with ${completedSteps}/${existingSteps.length} completed steps`);
      }
    }
    
    // Set first step to in_progress
    if (steps.length > 0) {
      steps[0].status = 'in_progress';
    }
    
    // Store steps for the specific user
    this.steps.set(userId, steps);
    console.log(`   ✅ ${steps.length} Gemini-generated steps stored for user: ${userId}`);
    
    if (user && user.onboardingStatus === 'not_started') {
      user.onboardingStatus = 'in_progress';
      user.currentStep = 1;
      console.log(`   ✅ User onboarding status updated to: in_progress`);
    } else if (user) {
      // Reset status for new flow
      user.onboardingStatus = 'in_progress';
      user.completionPercent = 0;
      user.currentStep = 1;
      console.log(`   ✅ User onboarding status reset for new flow`);
    }
    
    this.persistChanges();
  }

  clearUserSteps(userId: string): void {
    console.log(`🗑️ Clearing steps for user: ${userId}`);
    this.steps.delete(userId);
    const user = this.users.get(userId);
    if (user) {
      user.onboardingStatus = 'not_started';
      user.completionPercent = 0;
      user.currentStep = 0;
      console.log(`   ✅ User onboarding status reset`);
    }
    this.persistChanges();
  }

  clearAllData(): void {
    console.log('🗑️ Clearing all database data...');
    
    // Clear all users except admin
    const adminUser = this.users.get('admin@demo.com');
    this.users.clear();
    if (adminUser) {
      this.users.set('admin@demo.com', adminUser);
    }
    
    // Clear all steps
    this.steps.clear();
    
    // Clear all archived flows
    this.archivedFlows.clear();
    
    // Clear all activities
    this.activities.clear();
    this.adminActivities = [];
    
    console.log('✅ All data cleared (admin user preserved)');
    this.persistChanges();
  }

  deleteUser(userId: string): boolean {
    console.log(`🗑️ Deleting user: ${userId}`);
    
    const user = this.users.get(userId);
    if (!user) {
      console.log(`   ❌ User not found`);
      return false;
    }
    
    // Prevent deleting admin
    if (user.role === 'admin') {
      console.log(`   ❌ Cannot delete admin user`);
      return false;
    }
    
    // Delete user
    this.users.delete(userId);
    
    // Delete user's steps
    this.steps.delete(userId);
    
    // Delete user's archived flows
    this.archivedFlows.delete(userId);
    
    // Delete user's activities
    this.activities.delete(userId);
    
    // Add admin activity
    this.addAdminActivity('Admin', `Deleted user: ${user.name} (${user.email})`);
    
    console.log(`   ✅ User and all associated data deleted`);
    this.persistChanges();
    return true;
  }

  getArchivedFlows(userId: string): ArchivedFlow[] {
    return this.archivedFlows.get(userId) || [];
  }

  archiveFlow(userId: string, flowData: any): ArchivedFlow {
    const archivedFlow: ArchivedFlow = {
      id: flowData.id || `flow-${Date.now()}`,
      documentName: flowData.documentName,
      documentId: flowData.documentId,
      steps: flowData.steps,
      completedAt: flowData.completedAt || new Date().toISOString(),
      completionPercent: flowData.completionPercent
    };

    const userArchive = this.archivedFlows.get(userId) || [];
    userArchive.unshift(archivedFlow); // Add to beginning
    this.archivedFlows.set(userId, userArchive);

    console.log(`📦 Archived flow "${flowData.documentName}" for user: ${userId}`);
    
    this.persistChanges();
    return archivedFlow;
  }

  deleteArchivedFlow(userId: string, flowId: string): boolean {
    const userArchive = this.archivedFlows.get(userId);
    if (!userArchive) return false;

    const index = userArchive.findIndex(f => f.id === flowId);
    if (index === -1) return false;

    userArchive.splice(index, 1);
    this.archivedFlows.set(userId, userArchive);
    
    console.log(`🗑️ Deleted archived flow ${flowId} for user: ${userId}`);
    this.persistChanges();
    return true;
  }

  updateStepStatus(userId: string, stepId: number, status: string, timeSpent?: string): OnboardingStep | null {
    const steps = this.steps.get(userId);
    const user = this.users.get(userId);
    
    if (!steps || !user) return null;

    const step = steps.find(s => s.id === stepId);
    if (!step) return null;

    step.status = status as any;
    if (timeSpent) step.timeSpent = timeSpent;

    // Update user progress
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    user.completionPercent = Math.round((completedSteps / steps.length) * 100);
    user.currentStep = stepId;
    user.lastActivity = new Date().toISOString();

    if (user.completionPercent === 100) {
      user.onboardingStatus = 'completed';
    } else if (user.completionPercent > 0) {
      user.onboardingStatus = 'in_progress';
    }

    this.addActivity(userId, 'Step completed', step.title);
    this.addAdminActivity(user.name, `Completed step: ${step.title}`);

    this.persistChanges();
    return step;
  }

  addActivity(userId: string, action: string, detail: string): void {
    const activities = this.activities.get(userId) || [];
    activities.unshift({
      id: `act-${Date.now()}`,
      action,
      detail,
      time: this.getRelativeTime(new Date())
    });
    this.activities.set(userId, activities.slice(0, 10));
  }

  addAdminActivity(userName: string, detail: string): void {
    this.adminActivities.unshift({
      id: `admin-act-${Date.now()}`,
      action: userName,
      detail,
      time: this.getRelativeTime(new Date())
    });
    this.adminActivities = this.adminActivities.slice(0, 10);
  }

  getUserActivity(userId: string): Activity[] {
    return this.activities.get(userId) || [];
  }

  getAdminActivity(): Activity[] {
    return this.adminActivities;
  }

  private getRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  // Team management methods
  getAllTeams(): Team[] {
    return this.teams;
  }

  createTeam(name: string, description: string, createdBy: string): Team {
    const team: Team = {
      id: `team-${Date.now()}`,
      name,
      description,
      members: [],
      createdAt: new Date().toISOString(),
      createdBy
    };
    
    this.teams.push(team);
    this.addAdminActivity('Admin', `Created team: ${name}`);
    this.persistChanges();
    
    console.log(`✅ Team created: ${name}`);
    return team;
  }

  addTeamMember(teamId: string, email: string): Team {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    if (team.members.includes(email)) {
      throw new Error('User is already a member of this team');
    }
    
    // Get user info for better logging
    const user = this.getUser(email);
    const userName = user ? user.name : email;
    
    team.members.push(email);
    this.addAdminActivity('Admin', `Added ${userName} (${email}) to team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Added member ${userName} (${email}) to team: ${team.name}`);
    return team;
  }

  removeTeamMember(teamId: string, email: string): Team {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const index = team.members.indexOf(email);
    if (index === -1) {
      throw new Error('User is not a member of this team');
    }
    
    team.members.splice(index, 1);
    this.addAdminActivity('Admin', `Removed ${email} from team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Removed member ${email} from team: ${team.name}`);
    return team;
  }

  deleteTeam(teamId: string): boolean {
    const index = this.teams.findIndex(t => t.id === teamId);
    if (index === -1) {
      return false;
    }
    
    const team = this.teams[index];
    this.teams.splice(index, 1);
    this.addAdminActivity('Admin', `Deleted team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Team deleted: ${team.name}`);
    return true;
  }

  // Persistence methods
  private loadFromFile(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseData = JSON.parse(data);
        
        // Restore Maps from arrays
        this.users = new Map(parsed.users);
        this.steps = new Map(parsed.steps);
        this.archivedFlows = new Map(parsed.archivedFlows);
        this.activities = new Map(parsed.activities);
        this.adminActivities = parsed.adminActivities || [];
        this.teams = parsed.teams || [];
        
        console.log('✅ Database loaded from file');
        console.log(`   Users: ${this.users.size}`);
        console.log(`   Steps: ${this.steps.size}`);
        console.log(`   Archived flows: ${this.archivedFlows.size}`);
        console.log(`   Teams: ${this.teams.length}`);
      } else {
        console.log('📝 No existing database file, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      console.log('   Starting with empty database');
    }
  }

  private saveToFile(): void {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Convert Maps to arrays for JSON serialization
      const data: DatabaseData = {
        users: Array.from(this.users.entries()),
        steps: Array.from(this.steps.entries()),
        archivedFlows: Array.from(this.archivedFlows.entries()),
        activities: Array.from(this.activities.entries()),
        adminActivities: this.adminActivities,
        teams: this.teams
      };

      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log('💾 Database saved to file');
    } catch (error) {
      console.error('❌ Error saving database:', error);
    }
  }

  // Call saveToFile after any data modification
  private persistChanges(): void {
    this.saveToFile();
  }
}

export const db = new Database();
