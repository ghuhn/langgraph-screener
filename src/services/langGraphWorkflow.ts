import {
  recruiterAgent,
  analystAgent,
  hrAgent,
  recommenderAgent
} from './langGraphAgents';
import type {
  RecruitmentState,
  RecruitmentWorkflow,
  ProgressCallback,
  GraphConfig
} from '@/types/langgraph';
import type { CandidateAnalysis } from '@/types/candidates';

// Default graph configuration
const DEFAULT_CONFIG: GraphConfig = {
  maxConcurrency: 1,
  timeout: 300000, // 5 minutes
  retryAttempts: 3
};

// Initialize state function
const initializeState = (resumes: any[], jobDescription: any): RecruitmentState => {
  return {
    resumes,
    jobDescription,
    currentResumeIndex: 0,
    extractedCandidates: [],
    candidateAnalyses: [],
    agentStatuses: {
      'Recruiter Agent': { name: 'Recruiter Agent', status: 'pending', progress: 0, message: 'Waiting to start...' },
      'Analyst Agent': { name: 'Analyst Agent', status: 'pending', progress: 0, message: 'Waiting to start...' },
      'HR Agent': { name: 'HR Agent', status: 'pending', progress: 0, message: 'Waiting to start...' },
      'Recommender Agent': { name: 'Recommender Agent', status: 'pending', progress: 0, message: 'Waiting to start...' }
    },
    topCandidates: [],
    isComplete: false,
    errors: []
  };
};

// Custom workflow implementation (LangGraph-inspired)
class LangGraphRecruitmentWorkflow implements RecruitmentWorkflow {
  private currentState: RecruitmentState;
  private config: GraphConfig;

  constructor(config: Partial<GraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentState = this.initializeEmptyState();
  }

  private initializeEmptyState(): RecruitmentState {
    return {
      resumes: [],
      jobDescription: {},
      currentResumeIndex: 0,
      extractedCandidates: [],
      candidateAnalyses: [],
      agentStatuses: {},
      topCandidates: [],
      isComplete: false,
      errors: []
    };
  }
  
  async execute(
    resumes: any[],
    jobDescription: any,
    onProgress?: ProgressCallback
  ): Promise<CandidateAnalysis[]> {
    console.log('Starting custom LangGraph-inspired workflow...');

    // Initialize state
    this.currentState = initializeState(resumes, jobDescription);

    try {
      // Execute agents in sequence
      console.log('Step 1: Executing Recruiter Agent...');
      const recruiterResult = await recruiterAgent.execute(this.currentState);
      this.currentState = { ...this.currentState, ...recruiterResult };
      if (onProgress) onProgress(this.currentState);

      console.log('Step 2: Executing Analyst Agent...');
      const analystResult = await analystAgent.execute(this.currentState);
      this.currentState = { ...this.currentState, ...analystResult };
      if (onProgress) onProgress(this.currentState);

      console.log('Step 3: Executing HR Agent...');
      const hrResult = await hrAgent.execute(this.currentState);
      this.currentState = { ...this.currentState, ...hrResult };
      if (onProgress) onProgress(this.currentState);

      console.log('Step 4: Executing Recommender Agent...');
      const recommenderResult = await recommenderAgent.execute(this.currentState);
      this.currentState = { ...this.currentState, ...recommenderResult };
      if (onProgress) onProgress(this.currentState);

      console.log('Workflow completed successfully');
      console.log('Top candidates:', this.currentState.topCandidates);

      return this.currentState.topCandidates;

    } catch (error) {
      console.error('Error in workflow:', error);

      // Update state with error
      this.currentState.errors.push(`Workflow failed: ${error}`);

      // Call progress callback with error state
      if (onProgress) {
        onProgress(this.currentState);
      }

      throw error;
    }
  }
  
  getState(): RecruitmentState {
    return this.currentState;
  }
  
  // Method to get workflow progress
  getProgress(): { completed: number; total: number; percentage: number } {
    const agents = Object.values(this.currentState.agentStatuses);
    const completed = agents.filter(agent => agent.status === 'completed').length;
    const total = agents.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }
  
  // Method to check if workflow is running
  isRunning(): boolean {
    return Object.values(this.currentState.agentStatuses).some(
      agent => agent.status === 'running'
    );
  }
  
  // Method to get current agent
  getCurrentAgent(): string | undefined {
    return this.currentState.currentAgent;
  }
  
  // Method to get errors
  getErrors(): string[] {
    return this.currentState.errors;
  }
}

// Export the workflow class and a default instance
export { LangGraphRecruitmentWorkflow };
export const langGraphWorkflow = new LangGraphRecruitmentWorkflow();
