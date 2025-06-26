// Test file for LangGraph implementation
import { langGraphWorkflow } from '../services/langGraphWorkflow';
import type { RecruitmentState } from '../types/langgraph';

// Sample test data
const sampleResumes = [
  {
    name: "John Doe Resume.pdf",
    content: "John Doe\nSoftware Engineer\nEmail: john@example.com\nPhone: 123-456-7890\nSkills: JavaScript, React, Node.js\nExperience: 3 years at Tech Corp"
  },
  {
    name: "Jane Smith Resume.pdf", 
    content: "Jane Smith\nFull Stack Developer\nEmail: jane@example.com\nPhone: 098-765-4321\nSkills: Python, Django, PostgreSQL\nExperience: 5 years at StartupXYZ"
  }
];

const sampleJobDescription = {
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  location: "Remote",
  experienceLevel: "Senior",
  requiredSkills: ["JavaScript", "React", "Node.js"],
  preferredSkills: ["Python", "AWS"],
  topNCandidates: "3"
};

// Test function
export async function testLangGraphWorkflow() {
  console.log('🧪 Starting LangGraph workflow test...');
  
  try {
    // Set up progress tracking
    const progressUpdates: RecruitmentState[] = [];
    
    const onProgress = (state: RecruitmentState) => {
      progressUpdates.push(state);
      console.log(`📊 Progress Update: ${state.currentAgent || 'Unknown'}`);
      
      // Log agent statuses
      Object.entries(state.agentStatuses).forEach(([name, status]) => {
        console.log(`  ${name}: ${status.status} (${status.progress}%) - ${status.message}`);
      });
      
      if (state.errors.length > 0) {
        console.log(`❌ Errors: ${state.errors.join(', ')}`);
      }
    };
    
    // Execute the workflow
    console.log('🚀 Executing LangGraph workflow...');
    const results = await langGraphWorkflow.execute(
      sampleResumes,
      sampleJobDescription,
      onProgress
    );
    
    // Validate results
    console.log('✅ Workflow completed successfully!');
    console.log(`📋 Results: ${results.length} candidates analyzed`);
    
    results.forEach((analysis, index) => {
      console.log(`\n👤 Candidate ${index + 1}: ${analysis.candidate.name}`);
      console.log(`   Overall Score: ${analysis.scores.overall}%`);
      console.log(`   Rank: ${analysis.rank}`);
      console.log(`   Recommendation: ${analysis.recommendation}`);
      console.log(`   Agent Feedbacks: ${analysis.agentFeedbacks.length}`);
    });
    
    // Validate workflow state
    const finalState = langGraphWorkflow.getState();
    console.log(`\n📈 Final State:`);
    console.log(`   Extracted Candidates: ${finalState.extractedCandidates.length}`);
    console.log(`   Candidate Analyses: ${finalState.candidateAnalyses.length}`);
    console.log(`   Top Candidates: ${finalState.topCandidates.length}`);
    console.log(`   Is Complete: ${finalState.isComplete}`);
    console.log(`   Errors: ${finalState.errors.length}`);
    
    // Test workflow progress methods
    const progress = langGraphWorkflow.getProgress();
    console.log(`\n📊 Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
    console.log(`🏃 Is Running: ${langGraphWorkflow.isRunning()}`);
    console.log(`🤖 Current Agent: ${langGraphWorkflow.getCurrentAgent() || 'None'}`);
    
    return {
      success: true,
      results,
      progressUpdates,
      finalState
    };
    
  } catch (error) {
    console.error('❌ LangGraph workflow test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  (window as any).testLangGraph = testLangGraphWorkflow;
  console.log('🔧 LangGraph test function available as window.testLangGraph()');
}
