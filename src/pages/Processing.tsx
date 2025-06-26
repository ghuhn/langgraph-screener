
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Brain, Search, FileText, Target } from "lucide-react";
import { langGraphMultiAgentSystem } from "@/services/recruitmentService";
import ProcessingError from "@/components/processing/ProcessingError";
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import ProgressOverview from "@/components/processing/ProgressOverview";
import AgentStatusGrid from "@/components/processing/AgentStatusGrid";
import type { Agent } from "@/components/processing/AgentStatusGrid";
import ProcessingInfo from "@/components/processing/ProcessingInfo";
import type { RecruitmentState, AgentStatus } from "@/types/langgraph";

const Processing = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState('');
  const [langGraphState, setLangGraphState] = useState<RecruitmentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCandidates, setTotalCandidates] = useState(0);

  const agents: Agent[] = [
    { id: 'recruiter', name: 'Recruiter Agent', icon: <Users className="h-5 w-5" />, description: 'Extracting comprehensive candidate information' },
    { id: 'analyst', name: 'Analyst Agent', icon: <Search className="h-5 w-5" />, description: 'Analyzing skills and experience match' },
    { id: 'hr', name: 'HR Agent', icon: <Brain className="h-5 w-5" />, description: 'Evaluating soft skills and cultural fit' },
    { id: 'technical', name: 'Technical Evaluator', icon: <FileText className="h-5 w-5" />, description: 'Assessing technical competency' },
    { id: 'recommender', name: 'Recommender Agent', icon: <Target className="h-5 w-5" />, description: 'Generating final recommendations' }
  ];

  useEffect(() => {
    startProcessing();
  }, []);

  // Progress callback for real-time updates from LangGraph
  const handleProgressUpdate = (state: RecruitmentState) => {
    setLangGraphState(state);

    // Calculate overall progress based on agent statuses
    const agentStatuses = Object.values(state.agentStatuses);
    const completedAgents = agentStatuses.filter(agent => agent.status === 'completed').length;
    const totalAgents = agentStatuses.length;
    const overallProgress = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

    setProgress(overallProgress);

    // Set current agent based on state
    if (state.currentAgent) {
      const currentAgentStatus = state.agentStatuses[state.currentAgent];
      if (currentAgentStatus) {
        setCurrentAgent(`${currentAgentStatus.name}: ${currentAgentStatus.message}`);
      }
    }

    // Check if processing is complete
    if (state.isComplete) {
      setIsProcessing(false);
      // Store results and navigate
      localStorage.setItem('analysisResults', JSON.stringify(state.topCandidates));
      setTimeout(() => {
        navigate('/results');
      }, 2000);
    }

    // Handle errors
    if (state.errors.length > 0) {
      console.error('LangGraph errors:', state.errors);
      setError(state.errors[state.errors.length - 1]); // Show latest error
    }
  };

  const startProcessing = async () => {
    try {
      // Get uploaded resumes and job description
      const uploadedResumes = JSON.parse(localStorage.getItem('uploadedResumes') || '[]');
      const jobDescription = JSON.parse(localStorage.getItem('jobDescription') || '{}');

      if (uploadedResumes.length === 0 || !jobDescription.jobTitle) {
        setError('Missing resume data or job description');
        return;
      }

      setTotalCandidates(uploadedResumes.length);

      // Set up progress callback
      langGraphMultiAgentSystem.setProgressCallback(handleProgressUpdate);

      // Start processing
      setCurrentAgent('Initializing LangGraph Multi-Agent System...');
      setProgress(5);

      // Process all resumes with LangGraph
      const results = await langGraphMultiAgentSystem.processMultipleResumes(uploadedResumes, jobDescription);

      // If LangGraph processing completes without progress updates, handle it here
      if (results && results.length > 0) {
        setProgress(100);
        setCurrentAgent('Processing completed successfully!');
        localStorage.setItem('analysisResults', JSON.stringify(results));

        setTimeout(() => {
          setIsProcessing(false);
          navigate('/results');
        }, 2000);
      }

    } catch (err) {
      console.error('Processing error:', err);
      
      let errorMessage = 'An unknown error occurred during processing. Please try again.';
      const error: any = err; 

      if (error && error.value && typeof error.value.message === 'string') {
        if (error.value.message.includes('404')) {
          errorMessage = 'The resume parsing service could not be reached (Error 404). The service might be temporarily unavailable. Please try again later.';
        } else {
          errorMessage = `An error occurred: ${error.value.message}. Please check the details and try again.`;
        }
      } else if (error instanceof Error) {
        errorMessage = `An error occurred: ${error.message}. Please check the details and try again.`;
      }
      
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const getAgentStatus = (agentId: string, candidateIndex: number) => {
    if (!langGraphState) return 'pending';

    // Map agent IDs to LangGraph agent names
    const agentNameMap: Record<string, string> = {
      'recruiter': 'Recruiter Agent',
      'analyst': 'Analyst Agent',
      'hr': 'HR Agent',
      'technical': 'HR Agent', // Map technical to HR for now
      'recommender': 'Recommender Agent'
    };

    const agentName = agentNameMap[agentId];
    if (!agentName || !langGraphState.agentStatuses[agentName]) {
      return 'pending';
    }

    const agentStatus = langGraphState.agentStatuses[agentName];

    // Convert LangGraph status to component status
    switch (agentStatus.status) {
      case 'completed':
        return 'completed';
      case 'running':
        return 'processing';
      case 'error':
        return 'pending'; // Show as pending for errors to avoid confusion
      default:
        return 'pending';
    }
  };

  if (error) {
    return <ProcessingError error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ProcessingHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Analysis in Progress</h1>
          <p className="text-xl text-gray-600">Our multi-agent system is analyzing candidates using advanced LLM processing</p>
        </div>

        <ProgressOverview
          progress={progress}
          currentAgent={currentAgent}
          currentCandidateIndex={langGraphState?.extractedCandidates.length || 0}
          totalCandidates={totalCandidates}
        />

        <AgentStatusGrid
          agents={agents}
          getAgentStatus={getAgentStatus}
          totalCandidates={totalCandidates}
        />

        <ProcessingInfo />
      </div>
    </div>
  );
};

export default Processing;
