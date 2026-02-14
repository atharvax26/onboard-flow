import { db } from './src/services/database.js';

console.log('🔍 Checking Database Contents...\n');

// Get all users
const users = db.getAllUsers();
console.log('👥 Total Users:', users.length);
console.log('─'.repeat(80));

users.forEach(user => {
  console.log(`\n📧 Email: ${user.email}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Company: ${user.company}`);
  console.log(`   Status: ${user.onboardingStatus}`);
  console.log(`   Documents: ${user.documentsUploaded.length}`);
  
  // Get steps for this user
  const steps = db.getUserSteps(user.email);
  console.log(`   Steps: ${steps.length}`);
  
  if (steps.length > 0) {
    console.log(`   📋 First step: "${steps[0].title}"`);
    console.log(`   📋 Last step: "${steps[steps.length - 1].title}"`);
  } else {
    console.log(`   ⚠️  No steps found for this user`);
  }
});

console.log('\n' + '═'.repeat(80));
console.log('\n💡 Summary:');
console.log(`   - If you see 0 steps for your user, you need to upload a document`);
console.log(`   - The frontend will show mock data when no real steps exist`);
console.log(`   - Upload a PDF to generate AI steps\n`);
