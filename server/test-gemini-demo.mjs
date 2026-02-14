import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sample onboarding document content
const sampleDocumentText = `
EMPLOYEE ONBOARDING GUIDE
Welcome to TechCorp!

This guide will help you get started with your new role at TechCorp.

STEP 1: COMPLETE YOUR PROFILE
Please fill out your employee profile in our HR system. This includes:
- Personal information (name, address, emergency contacts)
- Banking details for payroll
- Tax information (W-4 form)
- Benefits enrollment

STEP 2: SET UP YOUR WORKSTATION
Your IT department will help you:
- Receive your laptop and accessories
- Set up email account (firstname.lastname@techcorp.com)
- Install required software (Slack, Microsoft Office, VPN)
- Configure security settings and two-factor authentication

STEP 3: ATTEND ORIENTATION SESSIONS
You must attend the following mandatory sessions:
- Company culture and values (Day 1, 9 AM)
- HR policies and procedures (Day 1, 2 PM)
- Safety and security training (Day 2, 10 AM)
- Department-specific training (Day 2, 2 PM)

STEP 4: MEET YOUR TEAM
Schedule one-on-one meetings with:
- Your direct manager
- Team members in your department
- Key stakeholders you'll work with
- Your assigned mentor/buddy

STEP 5: COMPLETE COMPLIANCE TRAINING
All employees must complete these online courses within 30 days:
- Information Security Awareness
- Anti-Harassment and Discrimination
- Code of Conduct
- Data Privacy (GDPR/CCPA)

STEP 6: SET UP DEVELOPMENT ENVIRONMENT (For Technical Roles)
- Access to GitHub repositories
- Set up local development environment
- Review coding standards and best practices
- Complete sample project to familiarize with codebase

STEP 7: REVIEW COMPANY POLICIES
Read and acknowledge:
- Employee handbook
- Remote work policy
- Expense reimbursement policy
- Time-off and vacation policy

STEP 8: 30-DAY CHECK-IN
Schedule a meeting with your manager to:
- Review your progress
- Discuss any challenges or questions
- Set goals for the next 60 days
- Provide feedback on the onboarding process
`;

async function testGeminiParsing() {
  try {
    console.log('🚀 Starting Gemini AI Demo...\n');
    console.log('📄 Sample Document: Employee Onboarding Guide');
    console.log('📊 Document length:', sampleDocumentText.length, 'characters\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Analyze the following onboarding document and extract structured onboarding steps. 
    For each step, provide:
    - A clear title (max 50 characters)
    - A brief description (max 100 characters)
    - Detailed instructions
    - Any dependencies on other steps (by title)
    
    Return the result as a JSON array with this structure:
    [
      {
        "title": "Step Title",
        "description": "Brief description",
        "details": "Detailed instructions",
        "dependencies": ["Previous Step Title"]
      }
    ]
    
    Document content:
    ${sampleDocumentText}
    
    Return ONLY the JSON array, no additional text.`;

    console.log('🤖 Sending request to Gemini AI...\n');
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    console.log('✅ Received response from Gemini\n');
    console.log('📝 Raw Response:');
    console.log('─'.repeat(80));
    console.log(response);
    console.log('─'.repeat(80));
    console.log();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ Failed to extract JSON from response');
      return;
    }
    
    const parsedSteps = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Successfully parsed', parsedSteps.length, 'onboarding steps\n');
    console.log('📋 EXTRACTED ONBOARDING STEPS:');
    console.log('═'.repeat(80));
    
    parsedSteps.forEach((step, index) => {
      console.log(`\n${index + 1}. ${step.title}`);
      console.log(`   Description: ${step.description}`);
      console.log(`   Details: ${step.details}`);
      if (step.dependencies && step.dependencies.length > 0) {
        console.log(`   Dependencies: ${step.dependencies.join(', ')}`);
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n✨ Demo completed successfully!');
    console.log('\nThese are the AI-generated steps that would be shown in your app');
    console.log('when a real document is uploaded and processed.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('API key')) {
      console.log('\n⚠️  Note: The Gemini API key needs to be valid for this to work.');
      console.log('Current API key status: Invalid or expired');
      console.log('\nTo fix this:');
      console.log('1. Get a valid API key from https://makersuite.google.com/app/apikey');
      console.log('2. Update the GEMINI_API_KEY in server/.env file');
    }
  }
}

testGeminiParsing();
