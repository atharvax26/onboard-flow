import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listAvailableModels() {
  console.log('🔍 Listing Available Gemini Models\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env file\n');
    process.exit(1);
  }
  
  console.log(`✅ API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}\n`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('📡 Fetching available models...\n');
    
    // Try to list models
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to fetch models:', error);
      
      if (response.status === 400) {
        console.log('\n⚠️  API key format might be incorrect');
        console.log('   Expected format: AIza... (39 characters)');
        console.log(`   Your key length: ${apiKey.length} characters`);
      } else if (response.status === 403) {
        console.log('\n⚠️  API key might not have permission');
        console.log('   Make sure Gemini API is enabled in your Google Cloud project');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log('❌ No models available for this API key\n');
      process.exit(1);
    }
    
    console.log(`✅ Found ${data.models.length} available models:\n`);
    console.log('─'.repeat(80));
    
    for (const model of data.models) {
      console.log(`\n📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName || 'N/A'}`);
      console.log(`   Description: ${model.description || 'N/A'}`);
      
      if (model.supportedGenerationMethods) {
        console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    
    // Find models that support generateContent
    const contentModels = data.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('generateContent')
    );
    
    if (contentModels.length > 0) {
      console.log(`\n✅ Models supporting generateContent (${contentModels.length}):`);
      contentModels.forEach(m => {
        const modelId = m.name.replace('models/', '');
        console.log(`   - ${modelId}`);
      });
      
      console.log(`\n💡 Recommended: Use "${contentModels[0].name.replace('models/', '')}" in your code`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

listAvailableModels();
