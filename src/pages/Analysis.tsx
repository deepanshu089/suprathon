import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Button from '../components/common/Button';
import { getResumeAnalysis } from '../lib/supabase';
import { getSkillCategoriesForAnalysis, SkillCategory } from '../services/skillCategorization';
import { getAnalysisResult, updateCandidateStatus } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Analysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [skillCategories, setSkillCategories] = useState<CategorizedSkills | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const openAIApiKey = process.env.REACT_APP_OPENAI_API_KEY;

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const data = await getResumeAnalysis(id!);
        console.log('Analysis data:', data);
        console.log('Analysis results:', data?.analysis_results);
        if (!data || !data.analysis_results) {
          throw new Error('Invalid analysis data');
        }
        setAnalysis(data);
        
        // Get categorized skills
        const categories = await getSkillCategoriesForAnalysis(id!);
        setSkillCategories(categories);
      } catch (error) {
        console.error('Error loading analysis:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [id, navigate]);

  const handleAccept = async () => {
    if (!analysis?.candidate_id) {
      alert('Candidate ID is missing.');
      return;
    }
    try {
      await updateCandidateStatus(analysis.candidate_id, 'accepted');
      setAnalysis(prev => prev ? { ...prev, status: 'accepted' } : null);
      alert('Candidate status updated to Accepted.');
    } catch (error: any) {
      console.error('Error accepting candidate:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleReject = async () => {
    if (!analysis?.candidate_id) {
      alert('Candidate ID is missing.');
      return;
    }
    try {
      await updateCandidateStatus(analysis.candidate_id, 'rejected');
      setAnalysis(prev => prev ? { ...prev, status: 'rejected' } : null);
      alert('Candidate status updated to Rejected.');
    } catch (error: any) {
      console.error('Error rejecting candidate:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Not Found</h2>
        <p className="text-gray-600 mb-6">The requested analysis could not be found.</p>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const renderSkillsPieChart = (categories: SkillCategory[], title: string) => (
    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">{title}</h3>
      <div className="flex justify-center items-center">
        <div className="w-full max-w-[500px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories.map(category => ({
                  name: category.category,
                  value: category.skills.length,
                  skills: category.skills,
                  description: category.description
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  '#22c55e', // Green
                  '#3b82f6', // Blue
                  '#f59e0b', // Orange
                  '#8b5cf6', // Purple
                  '#6b7280', // Gray
                  '#ef4444', // Red
                  '#10b981', // Emerald
                  '#6366f1', // Indigo
                  '#ec4899', // Pink
                  '#14b8a6'  // Teal
                ].map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  <div key="tooltip" className="p-2 bg-white shadow-lg rounded-lg">
                    <div className="font-medium text-gray-900">{name}</div>
                    <div className="text-sm text-gray-600">{value} skills</div>
                    <div className="text-xs text-gray-500 mb-2">{props.payload.description}</div>
                    <div className="mt-2 text-sm text-gray-500 max-h-40 overflow-y-auto">
                      {props.payload.skills.map((skill: string, i: number) => (
                        <div key={i} className="flex items-center py-1">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderLanguages = (languages: LanguageSkill[]) => (
    <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Language Proficiency</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((lang, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">{lang.language}</h5>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                lang.proficiency === 'Native' ? 'bg-green-100 text-green-800' :
                lang.proficiency === 'Fluent' ? 'bg-blue-100 text-blue-800' :
                lang.proficiency === 'Advanced' ? 'bg-purple-100 text-purple-800' :
                lang.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lang.proficiency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{analysis.candidate_name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
              <p>File: {analysis.file_name}</p>
              <span className="hidden sm:inline">•</span>
              <p>Analyzed on {new Date(analysis.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {analysis.analysis_results && (
            <div className="space-y-8">
              {/* Summary */}
              {analysis.analysis_results.summary && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{analysis.analysis_results.summary}</p>
                </div>
              )}

              {/* Match Score */}
              {analysis.analysis_results && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Match Score</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {typeof analysis.analysis_results.relevance === 'number' 
                        ? `${Math.round(analysis.analysis_results.relevance)}%`
                        : typeof analysis.analysis_results.matchScore === 'number'
                        ? `${Math.round(analysis.analysis_results.matchScore)}%`
                        : 'N/A'}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            (analysis.analysis_results.relevance || analysis.analysis_results.matchScore) >= 80 ? 'bg-green-600' :
                            (analysis.analysis_results.relevance || analysis.analysis_results.matchScore) >= 60 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ 
                            width: `${Math.min(100, Math.max(0, 
                              analysis.analysis_results.relevance || 
                              analysis.analysis_results.matchScore || 
                              0
                            ))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Skills */}
              {skillCategories?.technicalSkills.length > 0 && (
                renderSkillsPieChart(skillCategories.technicalSkills, 'Technical Skills Distribution')
              )}

              {/* Soft Skills */}
              {skillCategories?.softSkills.length > 0 && (
                renderSkillsPieChart(skillCategories.softSkills, 'Soft Skills Distribution')
              )}

              {/* Languages */}
              {skillCategories?.languages.length > 0 && (
                renderLanguages(skillCategories.languages)
              )}

              {/* Topics Distribution */}
              {analysis.analysis_results.topics && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Topic Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(analysis.analysis_results.topics).map(([topic, relevance]: [string, any]) => {
                      const relevanceValue = typeof relevance === 'number' ? relevance : parseFloat(relevance);
                      const percentage = !isNaN(relevanceValue) ? Math.round(relevanceValue * 100) : 0;
                      
                      return (
                        <div key={topic} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{topic}</span>
                            <span className={`text-sm font-medium ${
                              percentage >= 80 ? 'text-green-600' :
                              percentage >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                percentage >= 80 ? 'bg-green-600' :
                                percentage >= 60 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysis.analysis_results.strengths && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Key Strengths</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysis.analysis_results.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {analysis.analysis_results.weaknesses && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Areas for Improvement</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysis.analysis_results.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="text-gray-700">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.analysis_results.recommendations && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h3>
                  <p className="text-gray-700 leading-relaxed">{analysis.analysis_results.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex space-x-2">
        <Button 
          variant="outline" 
          onClick={handleAccept}
          disabled={analysis.status === 'accepted'}
          className={analysis.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' : ''}
        >
          {analysis.status === 'accepted' ? 'Accepted' : 'Accept'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleReject}
          disabled={analysis.status === 'rejected'}
          className={analysis.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-200' : ''}
        >
          {analysis.status === 'rejected' ? 'Rejected' : 'Reject'}
        </Button>
      </div>
    </div>
  );
};

export default Analysis; 