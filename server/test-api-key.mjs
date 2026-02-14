import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPIKey() {
  console.log('🧪 Testing Gemini API Key...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file');
    console.log('\n📝 Please add your API key to server/.env:');
    console.log('   GEMINI_API_KEY=your_api_key_here\n');
    process.exit(1);
  }
  
  console.log('✅ API Key found in .env');
  console.log(`📋 Key prefix: ${apiKey.substring(0, 10)}...`);
  console.log(`📏 Key length: ${apiKey.length} characters\n`);
  
  try {
    console.log('🤖 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    console.log('📤 Sending test request...');
    const result = await model.generateContent('Say "Hello! The API key is working correctly." in a friendly way.');
    const response = result.response.text();
    
    console.log('\n✅ SUCCESS! Gemini API is working!\n');
    console.log('📨 Response from Gemini:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));
    console.log('\n🎉 Your API key is valid and ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ FAILED! Gemini API test failed\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('\n🔑 Your API key is INVALID');
      console.log('\n📝 To get a valid API key:');
      console.log('   1. Visit: https://aistudio.google.com/app/apikey');
      console.log('   2. Sign in with your Google account');
      console.log('   3. Click "Create API Key"');
      console.log('   4. Copy the key and update server/.env\n');
    } else if (error.message.includes('quota')) {
      console.log('\n⚠️  API quota exceeded');
      console.log('   Wait a few minutes and try again\n');
    } else {
      console.log('\n🔍 Check the error message above for details\n');
    }
    
    process.exit(1);
  }
}

testGeminiAPIKey();
