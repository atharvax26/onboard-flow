import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testModel(genAI, modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello! API is working!" in one sentence.');
    const response = result.response.text();
    console.log(`✅ SUCCESS with ${modelName}`);
    console.log(`📨 Response: ${response}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with ${modelName}: ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function verifyGeminiAPI() {
  console.log('🔑 Gemini API Key Verification\n');
  console.log('═'.repeat(60));
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY not found in .env file\n');
    process.exit(1);
  }
  
  console.log(`\n✅ API Key found`);
  console.log(`📋 Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`📏 Length: ${apiKey.length} characters`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try different model versions
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest'
  ];
  
  console.log('\n🔍 Testing available models...');
  console.log('─'.repeat(60));
  
  let workingModel = null;
  
  for (const modelName of models) {
    const success = await testModel(genAI, modelName);
    if (success && !workingModel) {
      workingModel = modelName;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (workingModel) {
    console.log(`\n🎉 SUCCESS! Your API key is VALID and working!`);
    console.log(`\n✅ Recommended model: ${workingModel}`);
    console.log(`\n📝 Your gemini.ts is currently using: gemini-1.5-flash`);
    
    if (workingModel !== 'gemini-1.5-flash') {
      console.log(`\n⚠️  Consider updating to: ${workingModel}`);
    }
    
    console.log(`\n✅ You can now upload documents and get AI-generated steps!`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Server will auto-restart with new API key`);
    console.log(`   2. Login to your app`);
    console.log(`   3. Upload a PDF document`);
    console.log(`   4. See personalized AI-generated onboarding steps!\n`);
    
  } else {
    console.log(`\n❌ FAILED! None of the models worked with this API key`);
    console.log(`\n🔑 Possible issues:`);
    console.log(`   1. API key might be invalid or expired`);
    console.log(`   2. Gemini API might not be enabled in your Google Cloud project`);
    console.log(`   3. API quota might be exceeded`);
    console.log(`\n📝 To get a new API key:`);
    console.log(`   Visit: https://aistudio.google.com/app/apikey\n`);
    process.exit(1);
  }
}

verifyGeminiAPI().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});
