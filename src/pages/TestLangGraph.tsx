import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testLangGraphWorkflow } from '../test/langGraphTest';
import type { RecruitmentState } from '../types/langgraph';
import type { CandidateAnalysis } from '../types/candidates';

const TestLangGraph = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CandidateAnalysis[] | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<RecruitmentState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);
    setProgressUpdates([]);
    setError(null);

    try {
      const testResult = await testLangGraphWorkflow();
      
      if (testResult.success) {
        setResults(testResult.results);
        setProgressUpdates(testResult.progressUpdates);
      } else {
        setError(testResult.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">LangGraph Test Dashboard</h1>
          <p className="text-xl text-gray-600">Test the LangGraph multi-agent recruitment workflow</p>
        </div>

        <div className="mb-8 text-center">
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            size="lg"
            className="px-8 py-3"
          >
            {isRunning ? 'Running Test...' : 'Run LangGraph Test'}
          </Button>
        </div>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Test Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {progressUpdates.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Progress Updates</CardTitle>
              <CardDescription>Real-time updates from the LangGraph workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressUpdates.map((update, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Update {index + 1}</span>
                      <Badge variant={update.isComplete ? 'default' : 'secondary'}>
                        {update.isComplete ? 'Complete' : 'In Progress'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(update.agentStatuses).map(([name, status]) => (
                        <div key={name} className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-gray-500">{status.message}</div>
                            <div className="text-xs text-gray-400">{status.progress}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {update.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 rounded">
                        <div className="text-sm text-red-700">
                          Errors: {update.errors.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Analysis results from the LangGraph workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.map((analysis, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{analysis.candidate.name}</h3>
                        <p className="text-gray-600">{analysis.candidate.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">Rank #{analysis.rank}</Badge>
                        <div className="text-2xl font-bold text-blue-600">{analysis.scores.overall}%</div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{analysis.scores.technical}%</div>
                        <div className="text-sm text-gray-500">Technical</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{analysis.scores.experience}%</div>
                        <div className="text-sm text-gray-500">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{analysis.scores.education}%</div>
                        <div className="text-sm text-gray-500">Education</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{analysis.scores.communication}%</div>
                        <div className="text-sm text-gray-500">Communication</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <p className="text-gray-700">{analysis.recommendation}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.strengths.map((strength, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {analysis.redFlags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Areas of Concern</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.redFlags.map((flag, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-red-100 text-red-800">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Agent Feedbacks ({analysis.agentFeedbacks.length})</h4>
                      <div className="space-y-2">
                        {analysis.agentFeedbacks.map((feedback, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{feedback.agent}</span>
                              <Badge variant="outline">{feedback.confidence}% confidence</Badge>
                            </div>
                            <p className="text-sm text-gray-700">{feedback.analysis}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestLangGraph;
