# Onboard Flow - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Configuration](#configuration)
7. [Features Documentation](#features-documentation)
8. [API Documentation](#api-documentation)
9. [Troubleshooting](#troubleshooting)
10. [Development Guide](#development-guide)

---

## Overview

**Onboard Flow** is an AI-powered onboarding platform that generates personalized, adaptive onboarding steps from company documents. It uses Google Gemini AI to analyze PDF documents and create intelligent onboarding workflows.

### Key Capabilities
- 📄 PDF document parsing and analysis
- 🤖 AI-generated onboarding steps using Google Gemini
- 📊 Real-time progress tracking and analytics
- 💬 Context-aware chatbot assistant
- 📈 Maturity scoring system
- 📦 Onboarding history and archiving
- 🎉 Celebration animations on completion

---

## Features

### 1. AI-Powered Document Processing
- Upload company PDF documents
- Automatic extraction of onboarding steps
- Intelligent step sequencing and dependencies
- Detailed instructions generation

### 2. Adaptive Onboarding Workflow
- Dynamic step generation based on document content
- Status tracking (pending, in_progress, completed)
- Time tracking per step
- Dependency management between steps

### 3. Progress Tracking & Analytics
- Real-time completion percentage
- Maturity level assessment (Startup → Enterprise)
- Activity feed and history
- Admin dashboard with user statistics

### 4. Onboarding History
- Archive completed onboarding flows
- View past completions with full details
- Download PDF completion reports
- Interactive history in sidebar

### 5. AI Chatbot Assistant
- Context-aware help for current steps
- Powered by Google Gemini 2.5 Flash
- Floating chat interface
- Answers questions about steps and documents

### 6. Completion Celebration
- Animated celebration on 100% completion
- Automatic archiving of completed flows
- Trophy animation with confetti effects
- Smooth transitions to history section

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **React Router** - Navigation
- **jsPDF** - PDF generation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Google Gemini AI** - Document analysis and chat
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **File-based persistence** - JSON database storage

### Development Tools
- **ESLint** - Code linting
- **Vitest** - Testing framework
- **tsx** - TypeScript execution

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd onboard-flow
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Create `.env` in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

   Create `server/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Start the application**

   **Option A: Using the batch file (Windows)**
   ```bash
   start-dev.bat
   ```

   **Option B: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend: http://localhost:3001

### Default Credentials
- **Admin Account**
  - Email: `admin@demo.com`
  - Password: `admin123`

---

## Project Structure

```
onboard-flow/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── onboarding/          # Onboarding-specific components
│   │   │   ├── StepContent.tsx  # Step display component
│   │   │   ├── ArchivedFlows.tsx # History component
│   │   │   └── OnboardingChatbot.tsx # AI chatbot
│   │   └── ui/                  # shadcn/ui components
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities and helpers
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript types
│   │   └── utils.ts            # Utility functions
│   ├── pages/                   # Page components
│   │   ├── OnboardingPage.tsx  # Main onboarding interface
│   │   ├── UploadPage.tsx      # Document upload
│   │   ├── DashboardPage.tsx   # Admin dashboard
│   │   └── ...
│   └── index.css               # Global styles
├── server/                      # Backend source code
│   ├── src/
│   │   ├── services/           # Business logic
│   │   │   ├── gemini.ts       # AI integration
│   │   │   └── database.ts     # In-memory database
│   │   ├── routes/             # API routes
│   │   │   └── auth.ts         # Authentication routes
│   │   ├── middleware/         # Express middleware
│   │   │   └── auth.ts         # JWT authentication
│   │   └── index.ts            # Server entry point
│   └── .env                    # Backend environment variables
├── public/                      # Static assets
│   ├── favicon.svg             # Custom favicon
│   └── ...
├── start-dev.bat               # Windows startup script
├── DOCUMENTATION.md            # This file
└── package.json                # Dependencies

```

---

## Configuration

### Data Persistence

The application now uses **file-based persistence** to save all data between server restarts.

**Storage Location:**
- Database file: `server/data/database.json`
- Automatically created on first run
- Saves on every data modification

**What's Persisted:**
- ✅ User accounts and profiles
- ✅ Onboarding steps and progress
- ✅ Archived flows and history
- ✅ Activity logs
- ✅ Document uploads metadata

**Benefits:**
- No data loss on server restart
- No need to re-register accounts
- Progress is maintained
- History is preserved

**Note:** The `data/` directory is excluded from git via `.gitignore`

### Frontend Configuration

**vite.config.ts**
```typescript
server: {
  host: "::",
  port: 8080,  // Frontend port
}
```

**Environment Variables (.env)**
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend Configuration

**server/.env**
```env
GEMINI_API_KEY=your_api_key_here
PORT=3001
JWT_SECRET=your_secret_here
```

### Port Configuration
- Frontend: `8080`
- Backend: `3001`
- API Base: `http://localhost:3001/api`

---

## Features Documentation

### 1. Document Upload & AI Processing

**How it works:**
1. User uploads a PDF document
2. Backend extracts text using `pdf-parse`
3. Text is sent to Google Gemini AI
4. Gemini analyzes and generates structured onboarding steps
5. Steps are stored and associated with the user

**Generated Step Structure:**
```typescript
{
  id: number;
  title: string;              // Max 50 characters
  description: string;        // Max 100 characters
  details: string;           // Full instructions
  status: 'pending' | 'in_progress' | 'completed';
  timeSpent: string;         // e.g., "15m"
  dependencies: string[];    // Related step titles
}
```

### 2. Onboarding Workflow

**Step States:**
- `pending` - Not started yet
- `in_progress` - Currently active
- `completed` - Finished

**Progress Calculation:**
```
completionPercent = (completedSteps / totalSteps) * 100
```

**Maturity Levels:**
- 0-25%: Startup
- 26-50%: Growing
- 51-75%: Established
- 76-100%: Enterprise

### 3. Onboarding History

**Features:**
- Compact view in sidebar
- Expandable to show step details
- Download PDF reports for 100% completed flows
- Delete archived flows
- Automatic archiving on completion

**Archive Trigger:**
- Automatically archives when all steps reach 100%
- Shows celebration animation
- Adds to history after 3 seconds

### 4. AI Chatbot Assistant

**Capabilities:**
- Answers questions about current step
- Provides context from all steps
- References uploaded document
- Powered by Gemini 2.5 Flash

**Context Provided to AI:**
```typescript
{
  currentStep: {
    title, description, details
  },
  allSteps: [
    { id, title, description, status }
  ],
  documentName: string
}
```

**UI Features:**
- Floating button (bottom-right)
- Expandable chat window
- Message history
- Typing indicators
- Keyboard shortcuts (Enter to send)

### 5. Completion Celebration

**Animation Sequence:**
1. Full-screen overlay appears
2. Trophy icon with bounce animation
3. Confetti elements spinning
4. Completion stats displayed
5. 3-second duration
6. Auto-archive to history
7. Smooth fade-out

---

## API Documentation

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Acme Inc"
}

Response: {
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

### Document Upload

**Upload PDF**
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <pdf_file>
userId: <user_email>

Response: {
  "success": true,
  "document": { ... },
  "steps": [ ... ],
  "message": "Document processed successfully"
}
```

### Onboarding Steps

**Get User Steps**
```http
GET /api/steps/:userId
Authorization: Bearer <token>

Response: [
  {
    "id": 1,
    "title": "Step Title",
    "description": "Description",
    "details": "Full details",
    "status": "pending",
    "timeSpent": "",
    "dependencies": []
  }
]
```

**Update Step Status**
```http
POST /api/steps/:userId/:stepId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "timeSpent": "15m"
}

Response: { updated step }
```

### Archived Flows

**Get Archived Flows**
```http
GET /api/archived-flows/:userId
Authorization: Bearer <token>

Response: [
  {
    "id": "flow-123",
    "documentName": "Onboarding.pdf",
    "steps": [ ... ],
    "completedAt": "2024-01-01T00:00:00Z",
    "completionPercent": 100
  }
]
```

**Archive Flow**
```http
POST /api/archived-flows/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "flow-123",
  "documentName": "Onboarding.pdf",
  "documentId": "doc-123",
  "steps": [ ... ],
  "completedAt": "2024-01-01T00:00:00Z",
  "completionPercent": 100
}

Response: {
  "success": true,
  "flow": { ... }
}
```

**Delete Archived Flow**
```http
DELETE /api/archived-flows/:userId/:flowId
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Archived flow deleted successfully"
}
```

### Chatbot

**Chat with Assistant**
```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I complete this step?",
  "context": {
    "currentStep": { ... },
    "allSteps": [ ... ],
    "documentName": "Onboarding.pdf"
  }
}

Response: {
  "message": "AI-generated response"
}
```

---

## Troubleshooting

### Common Issues

**1. Backend won't start**
- Check if port 3001 is available
- Verify `server/.env` file exists
- Ensure Gemini API key is valid
- Run `npm install` in server directory

**2. Frontend won't start**
- Check if port 8080 is available
- Verify `.env` file exists in root
- Run `npm install` in root directory
- Clear browser cache

**3. Upload fails**
- Ensure backend is running
- Check file is a valid PDF
- Verify Gemini API key is set
- Check browser console for errors

**4. AI parsing returns errors**
- Verify Gemini API key is correct
- Check API quota hasn't been exceeded
- Ensure PDF contains readable text
- Check server logs for details

**5. Authentication fails**
- Clear localStorage in browser
- Check JWT_SECRET is set in server/.env
- Verify token hasn't expired (7 days)
- Try registering a new account

**6. Chatbot not responding**
- Check Gemini API key
- Verify backend is running
- Check browser console for errors
- Ensure user is authenticated

### Debug Mode

**Enable verbose logging:**

Backend (server/src/index.ts):
```typescript
console.log('Debug:', variable);
```

Frontend (browser console):
```javascript
localStorage.setItem('debug', 'true');
```

---

## Development Guide

### Adding New Features

**1. Create a new component**
```bash
# Frontend
src/components/feature/NewComponent.tsx

# Backend
server/src/services/newService.ts
```

**2. Add API endpoint**
```typescript
// server/src/index.ts
app.post('/api/new-endpoint', authenticateToken, async (req, res) => {
  // Implementation
});
```

**3. Add frontend API call**
```typescript
// src/lib/api.ts
async newApiCall(): Promise<Response> {
  const response = await fetch(`${API_BASE}/new-endpoint`, {
    headers: getHeaders(),
  });
  return response.json();
}
```

### Testing

**Run tests:**
```bash
npm run test
```

**Test coverage:**
```bash
npm run test:coverage
```

### Building for Production

**Build frontend:**
```bash
npm run build
```

**Build backend:**
```bash
cd server
npm run build
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add comments for complex logic

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For issues, questions, or contributions, please contact the development team.

**Version:** 1.0.0  
**Last Updated:** 2024
