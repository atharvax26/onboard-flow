import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import pdf from 'pdf-parse';

dotenv.config();

async function testUploadFlow() {
  console.log('🧪 Testing Complete Upload Flow\n');
  console.log('═'.repeat(60));
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('\n❌ GEMINI_API_KEY not found\n');
    process.exit(1);
  }
  
  console.log(`\n✅ API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Test 1: Simple API call
  console.log('\n📝 Test 1: Simple API Call');
  console.log('─'.repeat(60));
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Say hello in one sentence.');
    const response = result.response.text();
    
    console.log('✅ Simple call SUCCESS');
    console.log(`📨 Response: ${response}`);
  } catch (error) {
    console.error('❌ Simple call FAILED:', error.message);
    console.log('\n🔍 This is the same error you\'re seeing during upload');
    console.log('📝 Possible causes:');
    console.log('   1. API key needs Generative Language API enabled');
    console.log('   2. API key has IP/domain restrictions');
    console.log('   3. API key quota exceeded');
    console.log('   4. API key was revoked or regenerated');
    console.log('\n🔧 Solution:');
    console.log('   1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    console.log('   2. Make sure "Generative Language API" is ENABLED');
    console.log('   3. Check API key restrictions at: https://console.cloud.google.com/apis/credentials');
    console.log('   4. Or generate a NEW API key at: https://aistudio.google.com/app/apikey\n');
    process.exit(1);
  }
  
  // Test 2: Long prompt (like document parsing)
  console.log('\n📝 Test 2: Long Prompt (Document-like)');
  console.log('─'.repeat(60));
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const longPrompt = `Analyze the following document and extract onboarding steps.
    
    Document content:
    Company Onboarding Process
    
    1. Welcome and Introduction
    - Meet the team
    - Office tour
    - Get your equipment
    
    2. HR Documentation
    - Fill out tax forms
    - Sign employment contract
    - Review company policies
    
    3. Technical Setup
    - Setup email account
    - Install required software
    - Access company systems
    
    Return the result as a JSON array with this structure:
    [
      {
        "title": "Step Title",
        "description": "Brief description",
        "details": "Detailed instructions",
        "dependencies": []
      }
    ]
    
    Return ONLY the JSON array, no additional text.`;
    
    console.log('📤 Sending long prompt (similar to document parsing)...');
    const result = await model.generateContent(longPrompt);
    const response = result.response.text();
    
    console.log('✅ Long prompt SUCCESS');
    console.log(`📨 Response length: ${response.length} characters`);
    console.log(`📋 Response preview: ${response.substring(0, 100)}...`);
    
    // Try to parse JSON
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ JSON parsing SUCCESS`);
      console.log(`📊 Extracted ${parsed.length} steps`);
    }
    
  } catch (error) {
    console.error('❌ Long prompt FAILED:', error.message);
    process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 All tests PASSED!');
  console.log('\n✅ Your API key should work for document uploads');
  console.log('✅ Try uploading a document again\n');
}

testUploadFlow().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
