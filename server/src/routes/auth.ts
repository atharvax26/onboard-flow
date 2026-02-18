import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../services/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = db.getUser(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = db.createUser(email, name, company || 'My Company', hashedPassword);

    // Log registration activity
    db.addActivity(user.email, 'Account created', 'Registered successfully');
    db.addAdminActivity(user.name, 'Registered — onboarding not started');

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        onboardingStatus: user.onboardingStatus,
        completionPercent: user.completionPercent,
        currentStep: user.currentStep,
        lastActivity: user.lastActivity,
        documentsUploaded: user.documentsUploaded
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.getUser(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Log login activity
    db.addActivity(user.email, 'Logged in', 'User session started');
    db.addAdminActivity(user.name, 'Logged in');

    // Add support notifications for non-admin users
    if (user.role !== 'admin') {
      // Check for support query responses
      const userQueries = db.getUserSupportQueries(user.email);
      const queriesWithNewResponses = userQueries.filter(q => 
        q.responses.length > 0 && 
        q.status !== 'closed' &&
        // Check if there are responses newer than last login
        q.responses.some(r => new Date(r.createdAt) > new Date(user.lastActivity || 0))
      );

      // Notify about support query responses
      queriesWithNewResponses.forEach(query => {
        const latestResponse = query.responses[query.responses.length - 1];
        db.addNotification(user.email, {
          type: 'info',
          title: 'Support Response Received',
          message: `Your support query "${query.subject}" has a new response from ${latestResponse.responderName}`,
        });
      });

      // Add welcome notification for first-time login (if no previous activity)
      const userActivities = db.getUserActivity(user.email);
      const loginCount = userActivities.filter(a => a.action === 'Logged in').length;
      
      if (loginCount === 1) {
        // First login - add welcome notification
        db.addNotification(user.email, {
          type: 'info',
          title: 'Welcome to OnboardFlow!',
          message: 'Need help? Visit the Support page to submit queries or check our FAQ section.',
        });
      }

      // Check for open support queries and remind user
      const openQueries = userQueries.filter(q => q.status === 'open' || q.status === 'in_progress');
      if (openQueries.length > 0 && loginCount > 1) {
        db.addNotification(user.email, {
          type: 'info',
          title: 'Support Queries Update',
          message: `You have ${openQueries.length} active support ${openQueries.length === 1 ? 'query' : 'queries'}. Check the Support page for updates.`,
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        onboardingStatus: user.onboardingStatus,
        completionPercent: user.completionPercent,
        currentStep: user.currentStep,
        lastActivity: user.lastActivity,
        documentsUploaded: user.documentsUploaded
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export { router as authRouter };
