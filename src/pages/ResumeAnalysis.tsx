import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getResumeAnalysis } from '../lib/supabase';
import { FileText, Check, AlertTriangle } from 'lucide-react';

const ResumeAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        if (!id) {
          throw new Error('No analysis ID provided');
        }
        const data = await getResumeAnalysis(id);
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load analysis results');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error || 'Analysis not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Sort skills by relevance score
  const sortedSkills = analysis.analysis_results?.skills?.map((skill: string) => ({
    name: skill,
    score: analysis.analysis_results?.skillScores?.[skill] || 0
  })).sort((a: any, b: any) => b.score - a.score) || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-900 text-white p-6">
          <div className="flex items-start">
            <FileText className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-xl font-bold">{analysis.file_name}</h2>
              <p className="text-blue-100 text-sm mt-1">Analysis Results</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Summary */}
          {analysis.analysis_results?.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Summary</h3>
              <p className="text-gray-700 whitespace-pre-line">{analysis.analysis_results.summary}</p>
            </div>
          )}
          
          {/* Match Score */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                {analysis.analysis_results?.relevance}%
              </div>
              Match Score
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  analysis.analysis_results?.relevance >= 80 ? 'bg-green-600' :
                  analysis.analysis_results?.relevance >= 60 ? 'bg-blue-600' :
                  analysis.analysis_results?.relevance >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${analysis.analysis_results?.relevance}%` }}
              ></div>
            </div>
          </div>

          {/* Skills Distribution Graph */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Distribution</h3>
            <div className="space-y-4">
              {sortedSkills.map((skill: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{skill.name}</span>
                    <span className="text-gray-500">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        skill.score >= 80 ? 'bg-green-600' :
                        skill.score >= 60 ? 'bg-blue-600' :
                        skill.score >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills List */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Identified Skills</h3>
              <div className="space-y-2">
                {Array.isArray(analysis.analysis_results?.skills) && analysis.analysis_results.skills.length > 0 ? (
                  analysis.analysis_results.skills.map((skill: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-gray-800">{skill}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No skills identified.</span>
                )}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Key Strengths</h3>
              <div className="space-y-2 bg-green-50 border border-green-200 rounded-md p-3">
                {Array.isArray(analysis.analysis_results?.strengths) && analysis.analysis_results.strengths.length > 0 ? (
                  analysis.analysis_results.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-1" />
                      <span className="text-gray-800">{strength}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No strengths identified.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis; 