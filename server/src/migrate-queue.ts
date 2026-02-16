import { db } from './services/database.js';

/**
 * Migration script to queue existing documents for team members
 * Run this once to fix existing data
 */
async function migrateExistingDocuments() {
  console.log('🔄 Starting document queue migration...');
  
  const users = db.getAllUsers();
  const teams = db.getAllTeams();
  
  console.log(`📊 Found ${users.length} users and ${teams.length} teams`);
  
  let migratedCount = 0;
  
  // For each team
  for (const team of teams) {
    console.log(`\n👥 Processing team: ${team.name} (${team.members.length} members)`);
    
    // Get all documents uploaded for this team
    const teamDocuments: any[] = [];
    
    // Check all users for documents with this teamId
    for (const user of users) {
      if (user.documentsUploaded && user.documentsUploaded.length > 0) {
        const userTeamDocs = user.documentsUploaded.filter(doc => doc.teamId === team.id);
        if (userTeamDocs.length > 0) {
          console.log(`  📄 Found ${userTeamDocs.length} document(s) from ${user.email}`);
          teamDocuments.push(...userTeamDocs.map(doc => ({
            ...doc,
            uploadedBy: user.email
          })));
        }
      }
    }
    
    if (teamDocuments.length === 0) {
      console.log(`  ⚠️ No documents found for team ${team.name}`);
      continue;
    }
    
    console.log(`  📚 Total documents for team: ${teamDocuments.length}`);
    
    // For each team member
    for (const memberEmail of team.members) {
      const member = db.getUser(memberEmail);
      if (!member) {
        console.log(`  ⚠️ Member not found: ${memberEmail}`);
        continue;
      }
      
      console.log(`\n  👤 Processing member: ${member.name} (${memberEmail})`);
      console.log(`     Current status: ${member.onboardingStatus}`);
      console.log(`     Active document: ${member.activeDocumentId || 'none'}`);
      console.log(`     Queue length: ${member.documentQueue?.length || 0}`);
      
      // Get member's current steps to determine which documents they've completed
      const memberSteps = db.getUserSteps(memberEmail);
      const hasActiveOnboarding = memberSteps && memberSteps.length > 0;
      
      // Sort documents by upload date
      const sortedDocs = [...teamDocuments].sort((a, b) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
      
      console.log(`     Sorted documents (${sortedDocs.length}):`);
      sortedDocs.forEach((doc, idx) => {
        console.log(`       ${idx + 1}. ${doc.name} (${doc.uploadedAt})`);
      });
      
      // Add documents to member's uploaded list if not already there
      for (const doc of sortedDocs) {
        const alreadyHas = member.documentsUploaded?.find(d => d.id === doc.id);
        if (!alreadyHas) {
          if (!member.documentsUploaded) {
            member.documentsUploaded = [];
          }
          member.documentsUploaded.push({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            uploadedAt: doc.uploadedAt,
            status: 'queued' as const,
            teamId: doc.teamId
          });
          console.log(`     ✅ Added document to uploaded list: ${doc.name}`);
        }
      }
      
      // Determine which documents to queue
      let documentsToQueue = sortedDocs;
      
      // If member has active onboarding, skip the first document (it's already active)
      if (hasActiveOnboarding && member.activeDocumentId) {
        console.log(`     ℹ️ Member has active onboarding, checking which document...`);
        
        // Find which document is currently active
        const activeDocIndex = sortedDocs.findIndex(d => d.id === member.activeDocumentId);
        
        if (activeDocIndex !== -1) {
          console.log(`     ✓ Active document found at index ${activeDocIndex}: ${sortedDocs[activeDocIndex].name}`);
          // Queue all documents after the active one
          documentsToQueue = sortedDocs.slice(activeDocIndex + 1);
        } else {
          // Active document not in team docs, queue all
          console.log(`     ⚠️ Active document not in team docs, queuing all`);
        }
      } else if (member.onboardingStatus === 'completed') {
        console.log(`     ℹ️ Member completed onboarding, checking archived flows...`);
        
        // Get archived flows to see which documents were completed
        const archivedFlows = db.getArchivedFlows(memberEmail);
        const completedDocIds = archivedFlows.map(f => f.documentId);
        
        console.log(`     📦 Completed documents: ${completedDocIds.length}`);
        completedDocIds.forEach(id => {
          const doc = sortedDocs.find(d => d.id === id);
          if (doc) {
            console.log(`       - ${doc.name}`);
          }
        });
        
        // Queue documents that haven't been completed
        documentsToQueue = sortedDocs.filter(d => !completedDocIds.includes(d.id));
        console.log(`     📋 Documents to queue: ${documentsToQueue.length}`);
      }
      
      if (documentsToQueue.length === 0) {
        console.log(`     ✓ No documents to queue for ${memberEmail}`);
        continue;
      }
      
      console.log(`     📥 Queuing ${documentsToQueue.length} document(s)...`);
      
      // Queue the documents
      for (const doc of documentsToQueue) {
        // Get the uploader to fetch the steps
        const uploader = users.find(u => u.email === doc.uploadedBy);
        if (!uploader) {
          console.log(`       ⚠️ Uploader not found for ${doc.name}, skipping`);
          continue;
        }
        
        // Get steps from the uploader's account (admin who uploaded)
        const uploaderSteps = db.getUserSteps(doc.uploadedBy);
        
        if (!uploaderSteps || uploaderSteps.length === 0) {
          console.log(`       ⚠️ No steps found for ${doc.name}, skipping`);
          continue;
        }
        
        // Check if already in queue
        const alreadyQueued = member.documentQueue?.find(q => q.documentId === doc.id);
        if (alreadyQueued) {
          console.log(`       ⏭️ Already queued: ${doc.name}`);
          continue;
        }
        
        // Add to queue with fresh steps
        db.addDocumentToQueue(
          memberEmail,
          doc.id,
          doc.name,
          doc.teamId,
          JSON.parse(JSON.stringify(uploaderSteps)) // Deep clone steps
        );
        
        console.log(`       ✅ Queued: ${doc.name}`);
        migratedCount++;
      }
    }
  }
  
  console.log(`\n✅ Migration complete! Queued ${migratedCount} document(s)`);
  console.log('\n📊 Final state:');
  
  // Show final state
  for (const team of teams) {
    console.log(`\n👥 Team: ${team.name}`);
    for (const memberEmail of team.members) {
      const member = db.getUser(memberEmail);
      if (member) {
        console.log(`  👤 ${member.name}:`);
        console.log(`     Status: ${member.onboardingStatus}`);
        console.log(`     Active: ${member.activeDocumentId || 'none'}`);
        console.log(`     Queue: ${member.documentQueue?.length || 0} document(s)`);
        if (member.documentQueue && member.documentQueue.length > 0) {
          member.documentQueue.forEach((q, idx) => {
            console.log(`       ${idx + 1}. ${q.documentName}`);
          });
        }
      }
    }
  }
}

// Run migration
migrateExistingDocuments().catch(console.error);
