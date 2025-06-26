import { Candidate, CandidateAnalysis, Scores, AgentFeedback } from './candidates';

// LangGraph State Interface
export interface RecruitmentState {
  // Input data
  resumes: any[];
  jobDescription: any;
  
  // Processing state
  currentResumeIndex: number;
  currentCandidate?: Candidate;
  
  // Agent outputs
  extractedCandidates: Candidate[];
  candidateAnalyses: CandidateAnalysis[];
  
  // Progress tracking
  agentStatuses: Record<string, AgentStatus>;
  currentAgent?: string;
  
  // Final results
  topCandidates: CandidateAnalysis[];
  isComplete: boolean;
  
  // Error handling
  errors: string[];
}

// Agent Status for progress tracking
export interface AgentStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: Date;
  endTime?: Date;
}

// Node function type
export type NodeFunction = (state: RecruitmentState) => Promise<Partial<RecruitmentState>>;

// Edge condition type
export type EdgeCondition = (state: RecruitmentState) => string;

// Agent node types
export interface AgentNode {
  name: string;
  description: string;
  execute: NodeFunction;
}

// Specific agent interfaces
export interface RecruiterAgent extends AgentNode {
  extractCandidate: (resume: any) => Promise<Candidate>;
}

export interface AnalystAgent extends AgentNode {
  analyzeCandidate: (candidate: Candidate, jobDescription: any) => Promise<Partial<CandidateAnalysis>>;
}

export interface HRAgent extends AgentNode {
  evaluateCandidate: (candidate: Candidate, analysis: Partial<CandidateAnalysis>) => Promise<AgentFeedback>;
}

export interface RecommenderAgent extends AgentNode {
  rankCandidates: (analyses: CandidateAnalysis[]) => Promise<CandidateAnalysis[]>;
}

// Graph configuration
export interface GraphConfig {
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
}

// Progress callback type
export type ProgressCallback = (state: RecruitmentState) => void;

// LangGraph workflow interface
export interface RecruitmentWorkflow {
  execute: (
    resumes: any[], 
    jobDescription: any, 
    onProgress?: ProgressCallback
  ) => Promise<CandidateAnalysis[]>;
  getState: () => RecruitmentState;
}
