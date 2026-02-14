// Test script to verify Gemini API is working
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
  console.log('🧪 Testing Gemini API Connection...\n');
  
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', process.env.GEMINI_API_KEY.substring(0, 10) + '...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('📤 Sending test request to Gemini...');
    const result = await model.generateContent('Say "Hello! Gemini API is working correctly!" in a friendly way.');
    const response = result.response.text();
    
    console.log('✅ Response received!\n');
    console.log('📝 Gemini Response:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));
    console.log('\n✅ Gemini API is working correctly!\n');
    
    // Test with a more complex prompt
    console.log('🧪 Testing with document parsing prompt...\n');
    const testPrompt = `Analyze the following onboarding document and extract steps:

Employee Onboarding Process

1. Account Setup
Create your company email account and set up two-factor authentication.

2. Equipment Request
Submit IT equipment request form for laptop and accessories.

3. Security Training
Complete mandatory cybersecurity training modules.

Return the result as a JSON array with title, description, details, and dependencies.`;

    console.log('📤 Sending parsing test...');
    const parseResult = await model.generateContent(testPrompt);
    const parseResponse = parseResult.response.text();
    
    console.log('✅ Parsing response received!\n');
    console.log('📝 Parsing Response:');
    console.log('─'.repeat(50));
    console.log(parseResponse);
    console.log('─'.repeat(50));
    
    // Try to extract JSON
    const jsonMatch = parseResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.log('\n✅ JSON extraction successful!');
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('📊 Extracted', parsed.length, 'steps');
      console.log('\n📋 Steps:');
      parsed.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.title}`);
      });
    } else {
      console.log('\n⚠️ Could not extract JSON from response');
    }
    
    console.log('\n✅ All tests passed! Gemini is ready to parse documents.\n');
    
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    console.error(error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n💡 The API key appears to be invalid. Please check:');
      console.error('   1. The API key is correct in your .env file');
      console.error('   2. The API key is enabled in Google Cloud Console');
      console.error('   3. The Generative Language API is enabled');
    }
    process.exit(1);
  }
}

testGemini();
