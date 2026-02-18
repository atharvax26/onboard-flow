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
  teams?: string[]; // Array of team IDs
  notifications?: Notification[];
  documentQueue?: QueuedDocument[]; // Queue of documents to process
  activeDocumentId?: string; // Currently active document being processed
}

interface Notification {
  id: string;
  type: 'team_added' | 'team_removed' | 'info';
  title: string;
  message: string;
  teamId?: string;
  teamName?: string;
  read: boolean;
  createdAt: string;
}

interface DocumentRecord {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: 'processing' | 'parsed' | 'error' | 'queued' | 'active';
  teamId?: string;
}

interface QueuedDocument {
  documentId: string;
  documentName: string;
  teamId: string;
  queuedAt: string;
  steps: OnboardingStep[];
}

interface Activity {
  id: string;
  action: string;
  detail: string;
  time: string;
  timestamp: string; // ISO timestamp for accurate time calculation
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

interface SupportQuery {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'technical' | 'billing' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responses: QueryResponse[];
}

interface QueryResponse {
  id: string;
  queryId: string;
  responderId: string;
  responderName: string;
  message: string;
  createdAt: string;
}

interface DatabaseData {
  users: [string, User][];
  steps: [string, OnboardingStep[]][];
  archivedFlows: [string, ArchivedFlow[]][];
  activities: [string, Activity[]][];
  adminActivities: Activity[];
  teams: Team[];
  supportQueries: SupportQuery[];
}

class Database {
  private users: Map<string, User> = new Map();
  private steps: Map<string, OnboardingStep[]> = new Map();
  private archivedFlows: Map<string, ArchivedFlow[]> = new Map(); // userId -> archived flows
  private activities: Map<string, Activity[]> = new Map();
  private adminActivities: Activity[] = [];
  private teams: Team[] = [];
  private supportQueries: SupportQuery[] = [];

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

  addDocument(userId: string, doc: { name: string; size: string; teamId?: string }): DocumentRecord {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const document: DocumentRecord = {
      id: `doc-${Date.now()}`,
      name: doc.name,
      size: doc.size,
      uploadedAt: new Date().toISOString(),
      status: 'parsed',
      teamId: doc.teamId
    };

    user.documentsUploaded.push(document);
    user.lastActivity = new Date().toISOString();
    
    const teamInfo = doc.teamId ? ` for team ${this.teams.find(t => t.id === doc.teamId)?.name || doc.teamId}` : '';
    this.addActivity(userId, 'Document uploaded', `${doc.name}${teamInfo}`);
    this.addAdminActivity(user.name, `Uploaded document: ${doc.name}${teamInfo}`);
    
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
      // Complete current document and activate next one
      this.completeCurrentDocument(userId);
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
    const now = new Date().toISOString();
    activities.unshift({
      id: `act-${Date.now()}`,
      action,
      detail,
      time: this.getRelativeTime(new Date(now)),
      timestamp: now
    });
    this.activities.set(userId, activities.slice(0, 10));
  }

  addAdminActivity(userName: string, detail: string): void {
    const now = new Date().toISOString();
    this.adminActivities.unshift({
      id: `admin-act-${Date.now()}`,
      action: userName,
      detail,
      time: this.getRelativeTime(new Date(now)),
      timestamp: now
    });
    this.adminActivities = this.adminActivities.slice(0, 10);
  }

  getUserActivity(userId: string): Activity[] {
    const activities = this.activities.get(userId) || [];
    // Recalculate relative time for each activity
    return activities.map(activity => ({
      ...activity,
      time: this.getRelativeTime(new Date(activity.timestamp))
    }));
  }

  getAdminActivity(): Activity[] {
    // Recalculate relative time for each activity
    return this.adminActivities.map(activity => ({
      ...activity,
      time: this.getRelativeTime(new Date(activity.timestamp))
    }));
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
      console.error(`❌ Team not found: ${teamId}`);
      throw new Error('Team not found');
    }
    
    if (team.members.includes(email)) {
      console.error(`❌ User ${email} is already a member of team ${team.name}`);
      throw new Error('User is already a member of this team');
    }
    
    // Get user info for better logging
    const user = this.getUser(email);
    const userName = user ? user.name : email;
    
    console.log(`🔄 Adding ${userName} (${email}) to team ${team.name}...`);
    team.members.push(email);
    
    // Add user's team reference
    if (user) {
      if (!user.teams) user.teams = [];
      user.teams.push(teamId);
      console.log(`   ✅ Added team reference to user`);
      
      // Create notification for the user
      try {
        this.addNotification(email, {
          type: 'team_added',
          title: 'Added to Team',
          message: `You have been added to the team "${team.name}"`,
          teamId: team.id,
          teamName: team.name
        });
        console.log(`   ✅ Notification created for user`);
      } catch (notifError) {
        console.error(`   ⚠️ Failed to create notification:`, notifError);
        // Don't fail the whole operation if notification fails
      }
    } else {
      console.log(`   ⚠️ User ${email} not found in database`);
    }
    
    this.addAdminActivity('Admin', `Added ${userName} (${email}) to team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Successfully added member ${userName} (${email}) to team: ${team.name}`);
    return team;
  }

  removeTeamMember(teamId: string, email: string): Team {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) {
      console.error(`❌ Team not found: ${teamId}`);
      throw new Error('Team not found');
    }
    
    const index = team.members.indexOf(email);
    if (index === -1) {
      console.error(`❌ User ${email} is not a member of team ${team.name}`);
      throw new Error('User is not a member of this team');
    }
    
    console.log(`🔄 Removing ${email} from team ${team.name}...`);
    team.members.splice(index, 1);
    
    // Remove user's team reference
    const user = this.getUser(email);
    if (user) {
      if (user.teams) {
        const teamIndex = user.teams.indexOf(teamId);
        if (teamIndex !== -1) {
          user.teams.splice(teamIndex, 1);
          console.log(`   ✅ Removed team reference from user`);
        }
      }
      
      // Create notification for the user
      try {
        this.addNotification(email, {
          type: 'team_removed',
          title: 'Removed from Team',
          message: `You have been removed from the team "${team.name}"`,
          teamId: team.id,
          teamName: team.name
        });
        console.log(`   ✅ Notification created for user`);
      } catch (notifError) {
        console.error(`   ⚠️ Failed to create notification:`, notifError);
        // Don't fail the whole operation if notification fails
      }
    } else {
      console.log(`   ⚠️ User ${email} not found in database (might have been deleted)`);
    }
    
    this.addAdminActivity('Admin', `Removed ${email} from team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Successfully removed member ${email} from team: ${team.name}`);
    return team;
  }

  deleteTeam(teamId: string): boolean {
    const index = this.teams.findIndex(t => t.id === teamId);
    if (index === -1) {
      return false;
    }
    
    const team = this.teams[index];
    
    // Remove team reference from all members
    team.members.forEach(email => {
      const user = this.getUser(email);
      if (user && user.teams) {
        const teamIndex = user.teams.indexOf(teamId);
        if (teamIndex !== -1) {
          user.teams.splice(teamIndex, 1);
        }
      }
    });
    
    this.teams.splice(index, 1);
    this.addAdminActivity('Admin', `Deleted team: ${team.name}`);
    this.persistChanges();
    
    console.log(`✅ Team deleted: ${team.name}`);
    return true;
  }

  // Notification methods
  addNotification(userId: string, notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): void {
    const user = this.getUser(userId);
    if (!user) return;

    if (!user.notifications) {
      user.notifications = [];
    }

    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };

    user.notifications.unshift(newNotification);
    // Keep only last 50 notifications
    user.notifications = user.notifications.slice(0, 50);
    
    this.persistChanges();
    console.log(`📬 Notification added for user ${userId}: ${notification.title}`);
  }

  getNotifications(userId: string): Notification[] {
    const user = this.getUser(userId);
    return user?.notifications || [];
  }

  markNotificationRead(userId: string, notificationId: string): boolean {
    const user = this.getUser(userId);
    if (!user || !user.notifications) return false;

    const notification = user.notifications.find(n => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    this.persistChanges();
    return true;
  }

  clearNotifications(userId: string): void {
    const user = this.getUser(userId);
    if (!user) return;

    user.notifications = [];
    this.persistChanges();
  }

  getUserTeams(userId: string): Team[] {
    const user = this.getUser(userId);
    if (!user || !user.teams) return [];

    return this.teams.filter(team => user.teams?.includes(team.id));
  }

  // Document Queue Management
  addDocumentToQueue(userId: string, documentId: string, documentName: string, teamId: string, steps: OnboardingStep[]): void {
    const user = this.getUser(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }

    if (!user.documentQueue) {
      user.documentQueue = [];
    }

    const queuedDoc: QueuedDocument = {
      documentId,
      documentName,
      teamId,
      queuedAt: new Date().toISOString(),
      steps
    };

    user.documentQueue.push(queuedDoc);
    console.log(`📥 Document "${documentName}" added to queue for user ${userId}. Queue length: ${user.documentQueue.length}`);
    
    // If this is the first document and user has no active onboarding, activate it immediately
    if (!user.activeDocumentId && user.onboardingStatus === 'not_started') {
      this.activateNextDocument(userId);
    }
    
    this.persistChanges();
  }

  activateNextDocument(userId: string): boolean {
    const user = this.getUser(userId);
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return false;
    }

    if (!user.documentQueue || user.documentQueue.length === 0) {
      console.log(`📭 No documents in queue for user ${userId}`);
      user.activeDocumentId = undefined;
      user.onboardingStatus = 'not_started';
      this.persistChanges();
      return false;
    }

    // Get the next document from queue
    const nextDoc = user.documentQueue.shift()!;
    
    // Archive current flow if it exists and has progress
    const existingSteps = this.steps.get(userId);
    if (existingSteps && existingSteps.length > 0 && user.activeDocumentId) {
      const completedSteps = existingSteps.filter(s => s.status === 'completed').length;
      if (completedSteps > 0) {
        const oldDocument = user.documentsUploaded.find(d => d.id === user.activeDocumentId);
        const completionPercent = Math.round((completedSteps / existingSteps.length) * 100);
        
        const archivedFlow: ArchivedFlow = {
          id: `flow-${Date.now()}`,
          documentName: oldDocument?.name || 'Unknown Document',
          documentId: oldDocument?.id || '',
          steps: existingSteps,
          completedAt: new Date().toISOString(),
          completionPercent
        };
        
        const userArchive = this.archivedFlows.get(userId) || [];
        userArchive.unshift(archivedFlow);
        this.archivedFlows.set(userId, userArchive);
        
        console.log(`📦 Archived previous flow "${oldDocument?.name}"`);
      }
    }

    // Set the new document as active
    user.activeDocumentId = nextDoc.documentId;
    
    // Set first step to in_progress
    if (nextDoc.steps.length > 0) {
      nextDoc.steps[0].status = 'in_progress';
    }
    
    // Set the steps for this document
    this.steps.set(userId, nextDoc.steps);
    
    // Update user status
    user.onboardingStatus = 'in_progress';
    user.completionPercent = 0;
    user.currentStep = 1;
    user.lastActivity = new Date().toISOString();
    
    // Update document status
    const doc = user.documentsUploaded.find(d => d.id === nextDoc.documentId);
    if (doc) {
      doc.status = 'active';
    }
    
    console.log(`✅ Activated document "${nextDoc.documentName}" for user ${userId}. Remaining in queue: ${user.documentQueue.length}`);
    
    // Add notification
    this.addNotification(userId, {
      type: 'info',
      title: 'New Onboarding Started',
      message: `Started onboarding for "${nextDoc.documentName}"`
    });
    
    this.addActivity(userId, 'Onboarding started', nextDoc.documentName);
    
    this.persistChanges();
    return true;
  }

  completeCurrentDocument(userId: string): void {
    const user = this.getUser(userId);
    if (!user || !user.activeDocumentId) {
      console.log(`⚠️ No active document for user ${userId}`);
      return;
    }

    const currentSteps = this.steps.get(userId);
    if (!currentSteps) {
      console.log(`⚠️ No steps found for user ${userId}`);
      return;
    }

    // Archive the completed flow
    const completedSteps = currentSteps.filter(s => s.status === 'completed').length;
    const completionPercent = Math.round((completedSteps / currentSteps.length) * 100);
    
    const currentDocument = user.documentsUploaded.find(d => d.id === user.activeDocumentId);
    
    if (completionPercent === 100) {
      const archivedFlow: ArchivedFlow = {
        id: `flow-${Date.now()}`,
        documentName: currentDocument?.name || 'Unknown Document',
        documentId: user.activeDocumentId,
        steps: currentSteps,
        completedAt: new Date().toISOString(),
        completionPercent
      };
      
      const userArchive = this.archivedFlows.get(userId) || [];
      userArchive.unshift(archivedFlow);
      this.archivedFlows.set(userId, userArchive);
      
      console.log(`📦 Archived completed flow "${currentDocument?.name}"`);
      
      // Update document status to parsed (completed)
      if (currentDocument) {
        currentDocument.status = 'parsed';
      }
      
      // Mark as completed
      user.onboardingStatus = 'completed';
      user.completionPercent = 100;
      
      this.addActivity(userId, 'Onboarding completed', currentDocument?.name || 'Document');
      
      // Check if there are more documents in queue
      if (user.documentQueue && user.documentQueue.length > 0) {
        console.log(`📋 ${user.documentQueue.length} document(s) remaining in queue`);
        
        // Add notification about next document
        const nextDoc = user.documentQueue[0];
        this.addNotification(userId, {
          type: 'info',
          title: 'Next Document Ready',
          message: `"${nextDoc.documentName}" is ready for onboarding. It will start automatically.`
        });
        
        // Automatically activate the next document
        setTimeout(() => {
          this.activateNextDocument(userId);
        }, 1000); // Small delay to allow UI to show completion
      } else {
        console.log(`✅ All documents completed for user ${userId}`);
        user.activeDocumentId = undefined;
      }
      
      this.persistChanges();
    }
  }

  getDocumentQueue(userId: string): QueuedDocument[] {
    const user = this.getUser(userId);
    return user?.documentQueue || [];
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
        
        // Migrate activities to include timestamp if missing
        // For old activities without timestamp, try to parse from the activity ID or use a fallback
        const migratedActivities = new Map<string, Activity[]>();
        for (const [userId, activities] of parsed.activities) {
          migratedActivities.set(userId, activities.map(activity => {
            if (activity.timestamp) {
              return activity;
            }
            // Try to extract timestamp from ID (format: act-{timestamp})
            const idMatch = activity.id.match(/act-(\d+)/);
            const timestamp = idMatch ? new Date(parseInt(idMatch[1])).toISOString() : new Date().toISOString();
            return {
              ...activity,
              timestamp
            };
          }));
        }
        this.activities = migratedActivities;
        
        // Migrate admin activities to include timestamp if missing
        this.adminActivities = (parsed.adminActivities || []).map(activity => {
          if (activity.timestamp) {
            return activity;
          }
          // Try to extract timestamp from ID (format: admin-act-{timestamp})
          const idMatch = activity.id.match(/admin-act-(\d+)/);
          const timestamp = idMatch ? new Date(parseInt(idMatch[1])).toISOString() : new Date().toISOString();
          return {
            ...activity,
            timestamp
          };
        });
        
        this.teams = parsed.teams || [];
        this.supportQueries = parsed.supportQueries || [];
        
        console.log('✅ Database loaded from file');
        console.log(`   Users: ${this.users.size}`);
        console.log(`   Steps: ${this.steps.size}`);
        console.log(`   Archived flows: ${this.archivedFlows.size}`);
        console.log(`   Teams: ${this.teams.length}`);
        console.log(`   Support Queries: ${this.supportQueries.length}`);
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
        teams: this.teams,
        supportQueries: this.supportQueries
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

  // Support Query Management Methods
  createSupportQuery(
    userId: string,
    userName: string,
    userEmail: string,
    subject: string,
    category: 'technical' | 'billing' | 'feature' | 'bug' | 'other',
    priority: 'low' | 'medium' | 'high' | 'urgent',
    description: string
  ): SupportQuery {
    const query: SupportQuery = {
      id: `query-${Date.now()}`,
      userId,
      userName,
      userEmail,
      subject,
      category,
      priority,
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    this.supportQueries.unshift(query);
    this.addAdminActivity('System', `New support query: ${subject} (${priority})`);
    this.persistChanges();
    
    console.log(`📩 Support query created: ${query.id} by ${userName}`);
    return query;
  }

  getAllSupportQueries(): SupportQuery[] {
    return this.supportQueries;
  }

  getUserSupportQueries(userId: string): SupportQuery[] {
    return this.supportQueries.filter(q => q.userId === userId);
  }

  getSupportQuery(queryId: string): SupportQuery | undefined {
    return this.supportQueries.find(q => q.id === queryId);
  }

  updateQueryStatus(
    queryId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): SupportQuery | null {
    const query = this.supportQueries.find(q => q.id === queryId);
    if (!query) return null;

    query.status = status;
    query.updatedAt = new Date().toISOString();
    
    if (status === 'resolved' || status === 'closed') {
      query.resolvedAt = new Date().toISOString();
    }

    this.persistChanges();
    console.log(`✅ Query ${queryId} status updated to: ${status}`);
    return query;
  }

  addQueryResponse(
    queryId: string,
    responderId: string,
    responderName: string,
    message: string
  ): SupportQuery | null {
    const query = this.supportQueries.find(q => q.id === queryId);
    if (!query) return null;

    const response: QueryResponse = {
      id: `response-${Date.now()}`,
      queryId,
      responderId,
      responderName,
      message,
      createdAt: new Date().toISOString()
    };

    query.responses.push(response);
    query.updatedAt = new Date().toISOString();
    
    // Auto-update status to in_progress if it was open
    if (query.status === 'open') {
      query.status = 'in_progress';
    }

    this.persistChanges();
    console.log(`💬 Response added to query ${queryId} by ${responderName}`);
    return query;
  }

  deleteSupportQuery(queryId: string): boolean {
    const index = this.supportQueries.findIndex(q => q.id === queryId);
    if (index === -1) return false;

    this.supportQueries.splice(index, 1);
    this.persistChanges();
    console.log(`🗑️ Support query deleted: ${queryId}`);
    return true;
  }
}

export const db = new Database();
export type { QueuedDocument };
