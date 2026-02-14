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

    const userId = req.user!.email;
    
    console.log('🤖 Starting Gemini parsing...');
    
    let steps;
    try {
      steps = await parseDocument(req.file.buffer);
      console.log('✅ Parsing completed, extracted', steps.length, 'steps');
    } catch (parseError) {
      console.error('❌ Gemini parsing failed:', parseError);
      // Return more specific error
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
    
    const document = db.addDocument(userId, {
      name: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    });

    db.setUserSteps(userId, steps);

    console.log('✅ Document saved to database');
    console.log('✅ Upload process completed successfully');

    res.json({ 
      success: true, 
      document,
      steps,
      message: `AI extracted ${steps.length} onboarding steps` 
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
