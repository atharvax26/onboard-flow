import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseDocument } from './services/gemini.js';
import { db } from './services/database.js';
import { authRouter } from './routes/auth.js';
import { authenticateToken, AuthRequest } from './middleware/auth.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Auth routes (no authentication required)
app.use('/api/auth', authRouter);

// Test endpoint to verify Gemini API connection
app.get('/api/test-gemini', async (req, res) => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('🧪 Testing Gemini API connection...');
    const result = await model.generateContent('Say "Hello, Gemini is working!" in a friendly way.');
    const response = result.response.text();
    
    console.log('✅ Gemini API test successful');
    console.log('Response:', response);
    
    res.json({
      success: true,
      message: 'Gemini API is working correctly',
      response: response,
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...'
    });
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.GEMINI_API_KEY
    });
  }
});

// Upload and parse document (requires authentication)
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('User:', req.user?.email);
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📄 File details:');
    console.log('  - Name:', req.file.originalname);
    console.log('  - Size:', req.file.size, 'bytes');
    console.log('  - MIME type:', req.file.mimetype);
    console.log('  - Buffer length:', req.file.buffer.length);

    const uploaderId = req.user!.email;
    const teamId = req.body.teamId;
    
    if (!teamId) {
      console.error('❌ No team ID provided');
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    console.log('👥 Team ID:', teamId);
    
    // Get team information
    const team = db.getAllTeams().find(t => t.id === teamId);
    if (!team) {
      console.error('❌ Team not found:', teamId);
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log('👥 Team found:', team.name, 'with', team.members.length, 'members');
    
    console.log('🤖 Starting Gemini parsing...');
    
    let steps;
    try {
      steps = await parseDocument(req.file.buffer);
      console.log('✅ Parsing completed, extracted', steps.length, 'steps');
    } catch (parseError) {
      console.error('❌ Gemini parsing failed:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse document with AI',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });
    }
    
    if (!steps || steps.length === 0) {
      console.error('❌ No steps extracted from document');
      return res.status(400).json({ 
        error: 'No onboarding steps could be extracted from the document',
        details: 'The document may not contain suitable content for onboarding steps'
      });
    }
    
    // Create document record for the uploader (admin)
    const document = db.addDocument(uploaderId, {
      name: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      teamId: teamId
    });

    console.log('✅ Document saved to uploader\'s account:', uploaderId);
    
    // Distribute document to all team members
    let distributedCount = 0;
    for (const memberEmail of team.members) {
      const member = db.getUser(memberEmail);
      if (!member) {
        console.warn(`⚠️ Team member not found: ${memberEmail}`);
        continue;
      }
      
      // Add document to member's uploaded documents list
      const memberDoc = {
        id: document.id,
        name: document.name,
        size: document.size,
        uploadedAt: document.uploadedAt,
        status: 'queued' as const,
        teamId: teamId
      };
      
      // Add to member's documents if not already there
      if (!member.documentsUploaded.find(d => d.id === document.id)) {
        member.documentsUploaded.push(memberDoc);
      }
      
      // Add document to member's queue
      db.addDocumentToQueue(memberEmail, document.id, document.name, teamId, JSON.parse(JSON.stringify(steps)));
      
      distributedCount++;
      console.log(`✅ Document queued for team member: ${memberEmail}`);
    }

    console.log(`✅ Document distributed to ${distributedCount} team member(s)`);
    console.log('✅ Upload process completed successfully');

    res.json({ 
      success: true, 
      document,
      steps,
      distributedTo: distributedCount,
      message: `AI extracted ${steps.length} onboarding steps and distributed to ${distributedCount} team member(s)` 
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user data (requires authentication)
app.get('/api/user/:userId', authenticateToken, (req, res) => {
  const user = db.getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get onboarding steps (requires authentication)
app.get('/api/steps/:userId', authenticateToken, (req, res) => {
  const steps = db.getUserSteps(req.params.userId);
  res.json(steps);
});

// Update step status (requires authentication)
app.post('/api/steps/:userId/:stepId', authenticateToken, (req, res) => {
  const { userId, stepId } = req.params;
  const { status, timeSpent } = req.body;
  
  const updated = db.updateStepStatus(userId, parseInt(stepId), status, timeSpent);
  res.json(updated);
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const users = db.getAllUsers();
  res.json(users);
});

// Get activity feed (requires authentication)
app.get('/api/activity/:userId', authenticateToken, (req, res) => {
  const activity = db.getUserActivity(req.params.userId);
  res.json(activity);
});

// Get admin activity (admin only)
app.get('/api/admin/activity', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const activity = db.getAdminActivity();
  res.json(activity);
});

// Delete document (requires authentication)
app.delete('/api/document/:userId/:documentId', authenticateToken, (req: AuthRequest, res) => {
  const { userId, documentId } = req.params;
  
  // Users can only delete their own documents, admins can delete any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const deleted = db.deleteDocument(userId, documentId);
  if (!deleted) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  res.json({ success: true, message: 'Document deleted successfully' });
});

// Clear user steps (for testing/reset)
app.delete('/api/steps/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only clear their own steps, admins can clear any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.clearUserSteps(userId);
  console.log(`🗑️ Cleared steps for user: ${userId}`);
  
  res.json({ success: true, message: 'Steps cleared successfully' });
});

// Clear all database data (admin only)
app.delete('/api/admin/clear-database', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  db.clearAllData();
  console.log('🗑️ Database cleared by admin');
  
  res.json({ success: true, message: 'Database cleared successfully' });
});

// Delete user (admin only)
app.delete('/api/user/:userId', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  
  // Prevent deleting admin account
  const user = db.getUser(userId);
  if (user && user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin account' });
  }
  
  const deleted = db.deleteUser(userId);
  
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  console.log(`🗑️ User deleted by admin: ${userId}`);
  res.json({ success: true, message: 'User deleted successfully' });
});

// Get archived onboarding flows (requires authentication)
app.get('/api/archived-flows/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only view their own archived flows, admins can view any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const archivedFlows = db.getArchivedFlows(userId);
  res.json(archivedFlows);
});

// Get document queue (requires authentication)
app.get('/api/document-queue/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only view their own queue, admins can view any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const queue = db.getDocumentQueue(userId);
  const user = db.getUser(userId);
  
  res.json({
    queue,
    activeDocumentId: user?.activeDocumentId,
    queueLength: queue.length
  });
});

// Manually activate next document (requires authentication)
app.post('/api/activate-next-document/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only activate their own documents, admins can activate any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const activated = db.activateNextDocument(userId);
  
  if (!activated) {
    return res.status(404).json({ error: 'No documents in queue' });
  }
  
  res.json({ success: true, message: 'Next document activated' });
});

// Migrate existing documents to queue (admin only)
app.post('/api/admin/migrate-queue', authenticateToken, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    console.log('🔄 Starting document queue migration via API...');
    
    const users = db.getAllUsers();
    const teams = db.getAllTeams();
    
    let migratedCount = 0;
    const results: any[] = [];
    
    // For each team
    for (const team of teams) {
      const teamResult: any = {
        teamName: team.name,
        members: []
      };
      
      // Get all documents uploaded for this team
      const teamDocuments: any[] = [];
      
      for (const user of users) {
        if (user.documentsUploaded && user.documentsUploaded.length > 0) {
          const userTeamDocs = user.documentsUploaded.filter(doc => doc.teamId === team.id);
          teamDocuments.push(...userTeamDocs.map(doc => ({
            ...doc,
            uploadedBy: user.email
          })));
        }
      }
      
      if (teamDocuments.length === 0) continue;
      
      // Sort by upload date
      const sortedDocs = [...teamDocuments].sort((a, b) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
      
      // For each team member
      for (const memberEmail of team.members) {
        const member = db.getUser(memberEmail);
        if (!member) continue;
        
        const memberResult: any = {
          email: memberEmail,
          name: member.name,
          queued: []
        };
        
        // Add documents to member's uploaded list
        for (const doc of sortedDocs) {
          const alreadyHas = member.documentsUploaded?.find(d => d.id === doc.id);
          if (!alreadyHas) {
            if (!member.documentsUploaded) {
              member.documentsUploaded = [];
            }
            member.documentsUploaded.push({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              uploadedAt: doc.uploadedAt,
              status: 'queued' as const,
              teamId: doc.teamId
            });
          }
        }
        
        // Determine which documents to queue
        let documentsToQueue = sortedDocs;
        
        if (member.onboardingStatus === 'completed') {
          const archivedFlows = db.getArchivedFlows(memberEmail);
          const completedDocIds = archivedFlows.map(f => f.documentId);
          documentsToQueue = sortedDocs.filter(d => !completedDocIds.includes(d.id));
        } else if (member.activeDocumentId) {
          const activeDocIndex = sortedDocs.findIndex(d => d.id === member.activeDocumentId);
          if (activeDocIndex !== -1) {
            documentsToQueue = sortedDocs.slice(activeDocIndex + 1);
          }
        }
        
        // Queue the documents
        for (const doc of documentsToQueue) {
          const alreadyQueued = member.documentQueue?.find(q => q.documentId === doc.id);
          if (alreadyQueued) continue;
          
          // Get steps from admin who uploaded
          const uploaderSteps = db.getUserSteps(doc.uploadedBy);
          if (!uploaderSteps || uploaderSteps.length === 0) continue;
          
          db.addDocumentToQueue(
            memberEmail,
            doc.id,
            doc.name,
            doc.teamId,
            JSON.parse(JSON.stringify(uploaderSteps))
          );
          
          memberResult.queued.push(doc.name);
          migratedCount++;
        }
        
        if (memberResult.queued.length > 0) {
          teamResult.members.push(memberResult);
        }
      }
      
      if (teamResult.members.length > 0) {
        results.push(teamResult);
      }
    }
    
    console.log(`✅ Migration complete! Queued ${migratedCount} document(s)`);
    
    res.json({
      success: true,
      message: `Successfully queued ${migratedCount} document(s)`,
      migratedCount,
      results
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Archive a completed onboarding flow (requires authentication)
app.post('/api/archived-flows/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  const flowData = req.body;
  
  // Users can only archive their own flows, admins can archive any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const archivedFlow = db.archiveFlow(userId, flowData);
    res.json({ success: true, flow: archivedFlow });
  } catch (error) {
    console.error('Error archiving flow:', error);
    res.status(500).json({ error: 'Failed to archive flow' });
  }
});

// Chat with onboarding assistant (requires authentication)
app.post('/api/chat', authenticateToken, async (req: AuthRequest, res) => {
  const { message, context } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context-aware prompt
    let contextInfo = '';
    
    if (context?.currentStep) {
      contextInfo += `\n\nCurrent Step:\nTitle: ${context.currentStep.title}\nDescription: ${context.currentStep.description}\nDetails: ${context.currentStep.details}`;
    }
    
    if (context?.allSteps && context.allSteps.length > 0) {
      contextInfo += `\n\nAll Onboarding Steps:\n${context.allSteps.map((s: any, i: number) => 
        `${i + 1}. ${s.title} (${s.status})`
      ).join('\n')}`;
    }
    
    if (context?.documentName) {
      contextInfo += `\n\nDocument: ${context.documentName}`;
    }

    const prompt = `You are a helpful onboarding assistant. A user is going through an onboarding process and needs help.
    
Context:${contextInfo}

User Question: ${message}

Provide a helpful, concise, and friendly response. If the question is about a specific step, reference the step details. Keep your response under 200 words and be encouraging.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    res.json({ message: responseText });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Delete archived flow (requires authentication)
app.delete('/api/archived-flows/:userId/:flowId', authenticateToken, (req: AuthRequest, res) => {
  const { userId, flowId } = req.params;
  
  // Users can only delete their own archived flows, admins can delete any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const deleted = db.deleteArchivedFlow(userId, flowId);
  if (!deleted) {
    return res.status(404).json({ error: 'Archived flow not found' });
  }
  
  res.json({ success: true, message: 'Archived flow deleted successfully' });
});

// Teams endpoints (admin only)

// Get all teams
app.get('/api/teams', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const teams = db.getAllTeams();
  res.json(teams);
});

// Create team
app.post('/api/teams', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { name, description } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Team name is required' });
  }
  
  const team = db.createTeam(name.trim(), description?.trim() || '', req.user!.email);
  res.json(team);
});

// Add member to team
app.post('/api/teams/:teamId/members', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { teamId } = req.params;
  const { email } = req.body;
  
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  
  // Check if user with this email exists
  const user = db.getUser(email.trim());
  if (!user) {
    return res.status(404).json({ error: 'User not found. Only registered users can be added to teams.' });
  }
  
  try {
    const team = db.addTeamMember(teamId, email.trim());
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add member' });
  }
});

// Remove member from team
app.delete('/api/teams/:teamId/members/:email', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { teamId, email } = req.params;
  const decodedEmail = decodeURIComponent(email);
  
  console.log(`🔄 Remove member request: teamId=${teamId}, email=${decodedEmail}`);
  
  try {
    const team = db.removeTeamMember(teamId, decodedEmail);
    console.log(`✅ Member removed successfully`);
    res.json(team);
  } catch (error) {
    console.error('❌ Remove member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
    res.status(400).json({ error: errorMessage });
  }
});

// Delete team
app.delete('/api/teams/:teamId', authenticateToken, (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { teamId } = req.params;
  
  const deleted = db.deleteTeam(teamId);
  if (!deleted) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json({ success: true, message: 'Team deleted successfully' });
});

// Get documents for user's teams
app.get('/api/user/:userId/team-documents', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only view their own team documents, admins can view any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const user = db.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Get all users
  const allUsers = db.getAllUsers();
  const teamDocuments: any[] = [];
  
  // Collect documents from all users that belong to this user's teams
  allUsers.forEach(u => {
    if (u.documentsUploaded && u.documentsUploaded.length > 0) {
      u.documentsUploaded.forEach(doc => {
        // Include document if it belongs to one of the user's teams
        if (doc.teamId && user.teams?.includes(doc.teamId)) {
          teamDocuments.push(doc);
        }
      });
    }
  });
  
  res.json(teamDocuments);
});

// Get user's teams
app.get('/api/user/:userId/teams', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only view their own teams, admins can view any
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const teams = db.getUserTeams(userId);
  res.json(teams);
});

// Get user notifications
app.get('/api/notifications/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only view their own notifications
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const notifications = db.getNotifications(userId);
  res.json(notifications);
});

// Mark notification as read
app.post('/api/notifications/:userId/:notificationId/read', authenticateToken, (req: AuthRequest, res) => {
  const { userId, notificationId } = req.params;
  
  // Users can only mark their own notifications
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const success = db.markNotificationRead(userId, notificationId);
  if (!success) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  
  res.json({ success: true });
});

// Clear all notifications
app.delete('/api/notifications/:userId', authenticateToken, (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  // Users can only clear their own notifications
  if (req.user!.email !== userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  db.clearNotifications(userId);
  res.json({ success: true, message: 'Notifications cleared' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
