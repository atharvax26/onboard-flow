import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  details: string;
  status: 'pending' | 'in_progress' | 'completed';
  timeSpent: string;
  dependencies: string[];
}

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelayMs: number = 2000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message.toLowerCase();
      const isRetryable =
        msg.includes('503') ||
        msg.includes('service unavailable') ||
        msg.includes('high demand') ||
        msg.includes('overloaded') ||
        msg.includes('rate limit') ||
        msg.includes('429') ||
        msg.includes('too many requests');

      if (!isRetryable || attempt === maxRetries) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
      console.log(`⚠️ Gemini attempt ${attempt} failed (${lastError.message.substring(0, 80)}). Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export async function parseDocument(fileBuffer: Buffer): Promise<OnboardingStep[]> {
  try {
    console.log('📄 Starting PDF parsing...');
    console.log('📊 File buffer size:', fileBuffer.length, 'bytes');

    // Extract text from PDF
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;

    console.log('✅ PDF text extracted successfully');
    console.log('📝 Text length:', text.length, 'characters');
    console.log('📄 Number of pages:', pdfData.numpages);

    if (!text || text.trim().length === 0) {
      console.error('❌ PDF contains no text content');
      throw new Error('PDF contains no readable text');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the following document and extract onboarding steps. 
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
    ${text.substring(0, 10000)}
    
    Return ONLY the JSON array, no additional text.`;

    console.log('🤖 Sending request to Gemini AI...');

    const result = await withRetry(() => model.generateContent(prompt));
    const response = result.response.text();

    console.log('✅ Received response from Gemini');
    console.log('📝 Response length:', response.length, 'characters');

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ Failed to extract JSON from Gemini response');
      throw new Error('Failed to parse AI response');
    }

    const parsedSteps = JSON.parse(jsonMatch[0]);
    console.log('✅ JSON parsed successfully');
    console.log('📊 Number of steps extracted:', parsedSteps.length);

    const steps: OnboardingStep[] = parsedSteps.map((step: any, index: number) => ({
      id: index + 1,
      title: step.title,
      description: step.description,
      details: step.details,
      status: 'pending' as const,
      timeSpent: '0m',
      dependencies: step.dependencies || []
    }));

    console.log('✅ Document parsing completed successfully');
    return steps;
  } catch (error) {
    console.error('❌ Gemini parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later or check your API key billing.');
    }
    if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('high demand')) {
      throw new Error('Gemini is currently experiencing high demand. Please try again in a few seconds.');
    }
    if (errorMessage.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    throw new Error(`Failed to parse document with AI: ${errorMessage}`);
  }
}
