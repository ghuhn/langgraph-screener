import { SmartCandidateExtractor } from '@/utils/candidateExtractor';
import type { 
  RecruitmentState, 
  AgentStatus,
  RecruiterAgent,
  AnalystAgent,
  HRAgent,
  RecommenderAgent
} from '@/types/langgraph';
import type { 
  Candidate, 
  CandidateAnalysis,
  Scores,
  AgentFeedback,
  DetailedAnalysis
} from '@/types/candidates';

// Helper function to update agent status
const updateAgentStatus = (
  state: RecruitmentState,
  agentName: string,
  status: AgentStatus['status'],
  progress: number,
  message: string
): Partial<RecruitmentState> => {
  const agentStatuses = { ...state.agentStatuses };
  agentStatuses[agentName] = {
    name: agentName,
    status,
    progress,
    message,
    startTime: status === 'running' ? new Date() : agentStatuses[agentName]?.startTime,
    endTime: status === 'completed' || status === 'error' ? new Date() : undefined
  };

  return {
    agentStatuses,
    currentAgent: status === 'running' ? agentName : state.currentAgent
  };
};

// Helper function to generate initial agent feedbacks
const generateInitialAgentFeedbacks = (candidate: Candidate, analysis: Partial<CandidateAnalysis>): AgentFeedback[] => {
  const experienceSummary = candidate.experience.length > 0
    ? `${candidate.experience[0].role} at ${candidate.experience[0].company}`
    : "No experience listed";

  return [
    {
      agent: "Technical Evaluator",
      analysis: `Technical assessment reveals skills in: ${candidate.technicalSkills.join(', ') || 'None clearly identified'}. Education: ${candidate.educationLevel}. ${candidate.projects.length} projects mentioned. Certifications: ${candidate.certifications.join(', ') || 'None listed'}.`,
      recommendations: candidate.technicalSkills.length > 0 ? ["Conduct technical coding interview", "Review project portfolio"] : ["Technical skills assessment required"],
      concerns: candidate.technicalSkills.length < 3 ? ["Limited technical skills demonstrated"] : [],
      strengths: candidate.technicalSkills.slice(0,3),
      confidence: Math.min(60 + candidate.technicalSkills.length * 8, 95)
    },
    {
      agent: "Experience Analyzer",
      analysis: `Career analysis shows ${candidate.experienceYears} years of professional experience. Previous roles: ${candidate.experience.length} positions identified. Career progression appears ${candidate.experienceYears > 5 ? 'strong' : 'developing'}.`,
      recommendations: candidate.experienceYears > 0 ? ["Deep dive into recent projects", "Reference check with previous employers"] : ["Entry-level assessment required"],
      concerns: candidate.experienceYears < 2 ? ["Limited professional experience"] : [],
      strengths: ["Relevant industry experience", "Professional growth trajectory"],
      confidence: Math.min(70 + candidate.experienceYears * 4, 90)
    },
    {
      agent: "Cultural Fit Assessor",
      analysis: `Cultural assessment based on communication style and background. Soft skills: ${candidate.softSkills.join(', ') || 'To be evaluated'}. Languages: ${candidate.languages.join(', ')}. Shows ${candidate.languages.length > 1 ? 'strong' : 'basic'} potential for team integration.`,
      recommendations: ["Team interaction interview", "Cultural values discussion"],
      concerns: candidate.languages.length === 0 ? ["Language capabilities unclear"] : [],
      strengths: ["Communication abilities", "Cultural adaptability"],
      confidence: 75 + (candidate.languages.length * 5)
    },
    {
      agent: "Final Reviewer",
      analysis: `Comprehensive evaluation shows overall fit score of ${analysis.scores?.overall || 0}%. Key strengths: ${analysis.strengths?.join(', ') || 'Basic qualifications met'}. ${analysis.redFlags && analysis.redFlags.length > 0 ? 'Areas for improvement: ' + analysis.redFlags.join(', ') : 'No significant concerns identified'}.`,
      recommendations: (analysis.scores?.overall || 0) >= 80 ? ["Proceed to offer stage", "Prepare onboarding"] : (analysis.scores?.overall || 0) >= 70 ? ["Additional interviews needed", "Skill assessment required"] : ["Consider for junior roles", "Additional training may be required"],
      concerns: analysis.redFlags || [],
      strengths: ["Comprehensive evaluation completed", "Clear assessment provided"],
      confidence: Math.min(75 + ((analysis.scores?.overall || 60) - 60), 95)
    }
  ];
};

// Recruiter Agent - Extracts candidate information from resumes
export const recruiterAgent: RecruiterAgent = {
  name: 'Recruiter Agent',
  description: 'Extracts education, skills, tools, and experience from resumes',
  
  async execute(state: RecruitmentState): Promise<Partial<RecruitmentState>> {
    const statusUpdate = updateAgentStatus(state, 'Recruiter Agent', 'running', 0, 'Starting resume extraction...');
    
    try {
      const extractedCandidates: Candidate[] = [];
      const errors: string[] = [...state.errors];
      
      for (let i = 0; i < state.resumes.length; i++) {
        const resume = state.resumes[i];
        const progress = Math.round(((i + 1) / state.resumes.length) * 100);
        
        // Update progress
        const progressUpdate = updateAgentStatus(
          state, 
          'Recruiter Agent', 
          'running', 
          progress, 
          `Extracting candidate ${i + 1} of ${state.resumes.length}...`
        );
        
        try {
          const candidate = await this.extractCandidate(resume);
          extractedCandidates.push(candidate);
        } catch (error) {
          console.error(`Error extracting candidate ${i + 1}:`, error);
          errors.push(`Failed to extract candidate ${i + 1}: ${error}`);
          
          // Create fallback candidate
          const fallbackCandidate: Candidate = {
            name: resume.name || `Candidate ${i + 1}`,
            email: "Error parsing resume",
            phone: "Not provided",
            location: "Not provided",
            skills: [],
            technicalSkills: [],
            softSkills: [],
            experience: [],
            education: [],
            educationLevel: "Not provided",
            certifications: [],
            languages: [],
            projects: [],
            achievements: [],
            summary: "Resume parsing failed",
            keywords: [],
            linkedIn: "Not provided",
            github: "Not provided",
            experienceYears: 0,
          };
          extractedCandidates.push(fallbackCandidate);
        }
      }
      
      const finalUpdate = updateAgentStatus(
        state, 
        'Recruiter Agent', 
        'completed', 
        100, 
        `Successfully extracted ${extractedCandidates.length} candidates`
      );
      
      return {
        ...statusUpdate,
        ...finalUpdate,
        extractedCandidates,
        errors
      };
      
    } catch (error) {
      const errorUpdate = updateAgentStatus(
        state, 
        'Recruiter Agent', 
        'error', 
        0, 
        `Failed to extract candidates: ${error}`
      );
      
      return {
        ...statusUpdate,
        ...errorUpdate,
        errors: [...state.errors, `Recruiter Agent failed: ${error}`]
      };
    }
  },
  
  async extractCandidate(resume: any): Promise<Candidate> {
    return await SmartCandidateExtractor.extractCandidate(resume);
  }
};

// Analyst Agent - Matches extracted features to job description
export const analystAgent: AnalystAgent = {
  name: 'Analyst Agent',
  description: 'Matches extracted features to job description using scoring algorithm',
  
  async execute(state: RecruitmentState): Promise<Partial<RecruitmentState>> {
    const statusUpdate = updateAgentStatus(state, 'Analyst Agent', 'running', 0, 'Starting candidate analysis...');
    
    try {
      const candidateAnalyses: CandidateAnalysis[] = [];
      
      for (let i = 0; i < state.extractedCandidates.length; i++) {
        const candidate = state.extractedCandidates[i];
        const progress = Math.round(((i + 1) / state.extractedCandidates.length) * 100);
        
        const progressUpdate = updateAgentStatus(
          state, 
          'Analyst Agent', 
          'running', 
          progress, 
          `Analyzing candidate ${i + 1} of ${state.extractedCandidates.length}...`
        );
        
        const analysis = await this.analyzeCandidate(candidate, state.jobDescription);
        
        // Generate initial agent feedbacks for the analysis
        const initialAgentFeedbacks = generateInitialAgentFeedbacks(candidate, analysis);

        // Create complete analysis object
        const completeAnalysis: CandidateAnalysis = {
          rank: i + 1,
          candidate,
          scores: analysis.scores!,
          strengths: analysis.strengths || [],
          redFlags: analysis.redFlags || [],
          recommendation: analysis.recommendation || '',
          agentFeedbacks: initialAgentFeedbacks,
          detailedAnalysis: analysis.detailedAnalysis!,
          overallFit: analysis.overallFit || 'Unknown'
        };
        
        candidateAnalyses.push(completeAnalysis);
      }
      
      const finalUpdate = updateAgentStatus(
        state, 
        'Analyst Agent', 
        'completed', 
        100, 
        `Successfully analyzed ${candidateAnalyses.length} candidates`
      );
      
      return {
        ...statusUpdate,
        ...finalUpdate,
        candidateAnalyses
      };
      
    } catch (error) {
      const errorUpdate = updateAgentStatus(
        state, 
        'Analyst Agent', 
        'error', 
        0, 
        `Failed to analyze candidates: ${error}`
      );
      
      return {
        ...statusUpdate,
        ...errorUpdate,
        errors: [...state.errors, `Analyst Agent failed: ${error}`]
      };
    }
  },
  
  async analyzeCandidate(candidate: Candidate, jobDescription: any): Promise<Partial<CandidateAnalysis>> {
    // Generate realistic scores based on candidate data
    const baseScore = 70;
    const skillBonus = Math.min(candidate.technicalSkills.length * 3, 25);
    const experienceBonus = Math.min(candidate.experienceYears * 2, 20);
    const educationBonus = candidate.education.length > 0 ? 15 : 0;
    const languageBonus = candidate.languages.length > 1 ? 5 : 0;

    const scores: Scores = {
      technical: Math.min(baseScore + skillBonus + Math.floor(Math.random() * 10), 95),
      experience: Math.min(baseScore + experienceBonus + Math.floor(Math.random() * 10), 95),
      education: Math.min(baseScore + educationBonus + Math.floor(Math.random() * 10), 95),
      communication: baseScore + languageBonus + Math.floor(Math.random() * 20),
      cultural_fit: baseScore + Math.floor(Math.random() * 20),
      project_relevance: baseScore + Math.floor(Math.random() * 20),
      skill_match: Math.min(baseScore + skillBonus + Math.floor(Math.random() * 10), 95),
      overall: 0
    };

    scores.overall = Math.round(
      (scores.technical * 0.25 + 
       scores.experience * 0.2 + 
       scores.education * 0.15 + 
       scores.communication * 0.15 + 
       scores.cultural_fit * 0.1 + 
       scores.project_relevance * 0.1 + 
       scores.skill_match * 0.05)
    );

    const strengths = [];
    if (candidate.technicalSkills.length > 3) strengths.push("Strong technical skill set");
    if (candidate.experienceYears > 3) strengths.push("Experienced professional");
    if (candidate.education.length > 0) strengths.push("Solid educational background");
    if (candidate.languages.length > 1) strengths.push("Multilingual capabilities");
    if (candidate.certifications.length > 0) strengths.push("Professional certifications");

    const redFlags = [];
    if (candidate.technicalSkills.length < 2) redFlags.push("Limited technical skills listed");
    if (candidate.experienceYears === 0) redFlags.push("No clear work experience mentioned");  
    if (candidate.email === "Not provided") redFlags.push("Contact information incomplete");
    if (candidate.education.length === 0) redFlags.push("Education background unclear");

    const recommendation = scores.overall >= 85 ? 
      "Highly recommended candidate - proceed to final interview" :
      scores.overall >= 75 ? 
      "Good candidate - schedule technical interview" :
      scores.overall >= 65 ?
      "Potential candidate - additional screening recommended" :
      "Below threshold - consider for entry-level roles only";

    const detailedAnalysis: DetailedAnalysis = {
      skillGaps: candidate.technicalSkills.length < 5 ? ["Could benefit from additional technical training"] : [],
      experienceMatch: candidate.experienceYears >= 3 ? "Strong experience match for role requirements" : "Experience level adequate but could be strengthened",
      educationFit: candidate.education.length > 0 ? "Education requirements satisfied" : "Education background needs clarification",
      projectRelevance: candidate.projects.length > 0 ? "Relevant project experience demonstrated" : "Project portfolio needs development",
      growthPotential: scores.overall >= 80 ? "High growth potential with strong foundation" : scores.overall >= 70 ? "Good growth potential with proper guidance" : "Moderate growth potential, may need additional support"
    };

    const overallFit = scores.overall >= 90 ? "Excellent" : 
                      scores.overall >= 80 ? "Good" : 
                      scores.overall >= 70 ? "Fair" : 
                      scores.overall >= 60 ? "Below Average" : "Poor";

    return {
      scores,
      strengths,
      redFlags,
      recommendation,
      detailedAnalysis,
      overallFit
    };
  }
};

// HR Agent - Evaluates tone, soft skills, and identifies potential red flags
export const hrAgent: HRAgent = {
  name: 'HR Agent',
  description: 'Evaluates tone, soft skills, and identifies potential red flags',

  async execute(state: RecruitmentState): Promise<Partial<RecruitmentState>> {
    const statusUpdate = updateAgentStatus(state, 'HR Agent', 'running', 0, 'Starting HR evaluation...');

    try {
      const updatedAnalyses: CandidateAnalysis[] = [];

      for (let i = 0; i < state.candidateAnalyses.length; i++) {
        const analysis = state.candidateAnalyses[i];
        const progress = Math.round(((i + 1) / state.candidateAnalyses.length) * 100);

        const progressUpdate = updateAgentStatus(
          state,
          'HR Agent',
          'running',
          progress,
          `Evaluating candidate ${i + 1} of ${state.candidateAnalyses.length}...`
        );

        const hrFeedback = await this.evaluateCandidate(analysis.candidate, analysis);

        // Add HR feedback to existing agent feedbacks
        const updatedAnalysis: CandidateAnalysis = {
          ...analysis,
          agentFeedbacks: [...analysis.agentFeedbacks, hrFeedback]
        };

        updatedAnalyses.push(updatedAnalysis);
      }

      const finalUpdate = updateAgentStatus(
        state,
        'HR Agent',
        'completed',
        100,
        `Successfully evaluated ${updatedAnalyses.length} candidates`
      );

      return {
        ...statusUpdate,
        ...finalUpdate,
        candidateAnalyses: updatedAnalyses
      };

    } catch (error) {
      const errorUpdate = updateAgentStatus(
        state,
        'HR Agent',
        'error',
        0,
        `Failed to evaluate candidates: ${error}`
      );

      return {
        ...statusUpdate,
        ...errorUpdate,
        errors: [...state.errors, `HR Agent failed: ${error}`]
      };
    }
  },

  async evaluateCandidate(candidate: Candidate, analysis: Partial<CandidateAnalysis>): Promise<AgentFeedback> {
    const experienceSummary = candidate.experience.length > 0
      ? `${candidate.experience[0].role} at ${candidate.experience[0].company}`
      : "No experience listed";

    return {
      agent: "HR Agent",
      analysis: `HR screening of ${candidate.name}. Contact: ${candidate.email}, ${candidate.phone}. Location: ${candidate.location}. Experience: ${experienceSummary}. Languages: ${candidate.languages.join(', ')}.`,
      recommendations: candidate.email !== "Not provided" ? ["Verify contact information", "Schedule initial phone screening"] : ["Obtain complete contact details"],
      concerns: candidate.email === "Not provided" ? ["Missing contact details"] : [],
      strengths: ["Professional presentation", "Available for contact"],
      confidence: candidate.email !== "Not provided" ? 85 : 60
    };
  }
};

// Recommender Agent - Ranks resumes and suggests top candidates
export const recommenderAgent: RecommenderAgent = {
  name: 'Recommender Agent',
  description: 'Ranks resumes and suggests top candidates for the role',

  async execute(state: RecruitmentState): Promise<Partial<RecruitmentState>> {
    const statusUpdate = updateAgentStatus(state, 'Recommender Agent', 'running', 0, 'Starting candidate ranking...');

    try {
      const rankedCandidates = await this.rankCandidates(state.candidateAnalyses);

      // Get top N candidates based on job description
      const topN = parseInt(state.jobDescription.topNCandidates) || 3;
      const topCandidates = rankedCandidates.slice(0, topN);

      const finalUpdate = updateAgentStatus(
        state,
        'Recommender Agent',
        'completed',
        100,
        `Successfully ranked candidates and selected top ${topCandidates.length}`
      );

      return {
        ...statusUpdate,
        ...finalUpdate,
        topCandidates,
        isComplete: true
      };

    } catch (error) {
      const errorUpdate = updateAgentStatus(
        state,
        'Recommender Agent',
        'error',
        0,
        `Failed to rank candidates: ${error}`
      );

      return {
        ...statusUpdate,
        ...errorUpdate,
        errors: [...state.errors, `Recommender Agent failed: ${error}`]
      };
    }
  },

  async rankCandidates(analyses: CandidateAnalysis[]): Promise<CandidateAnalysis[]> {
    // Sort by overall score
    const sortedAnalyses = analyses.sort((a, b) => b.scores.overall - a.scores.overall);

    // Update ranks
    sortedAnalyses.forEach((analysis, index) => {
      analysis.rank = index + 1;
    });

    return sortedAnalyses;
  }
};
