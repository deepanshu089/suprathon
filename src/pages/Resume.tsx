import React, { useState, useEffect } from 'react';
import { Upload, Check, FileText, AlertTriangle } from 'lucide-react';
import ResumeUploader from '../components/resume/ResumeUploader';
import Button from '../components/common/Button';
import useAppStore from '../store';
import { analyzeResumeWithHF } from '../lib/openai';
import { getJobPositions, saveResumeAnalysis } from '../lib/supabase';
import ChatInterface from '../components/chat/ChatInterface';

const Resume: React.FC = () => {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatContext, setChatContext] = useState<string>('');
  
  const { openAIApiKey } = useAppStore();
  
  // Fetch job positions on component mount
  useEffect(() => {
    const fetchJobPositions = async () => {
      try {
        const positions = await getJobPositions();
        setJobPositions(positions);
      } catch (error) {
        console.error('Error fetching job positions:', error);
        setError('Failed to load job positions. Please try again.');
      }
    };
    fetchJobPositions();
  }, []);

  // Update job description when a position is selected
  useEffect(() => {
    if (selectedJobId) {
      const selectedJob = jobPositions.find(job => job.id === selectedJobId);
      if (selectedJob) {
        setJobDescription(selectedJob.description || '');
      }
    }
  }, [selectedJobId, jobPositions]);
  
  const handleUploadComplete = (fileUrl: string, name: string, extractedText: string) => {
    setResumeUrl(fileUrl);
    setFileName(name);
    setResumeText(extractedText);
    setAnalysisResults(null);
    setError(null);
  };
  
  const handleAnalyzeResume = async () => {
    if (!resumeUrl || (!jobDescription && !customDescription) || !resumeText) {
      setError('Please ensure you have uploaded a resume, selected a job position or entered a custom description, and that the resume text was extracted.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting resume analysis...');
      console.log('Resume text:', resumeText);
      console.log('Job description:', customDescription || jobDescription);
      
      const results = await analyzeResumeWithHF(resumeText, customDescription || jobDescription);
      console.log('Analysis results:', results);
      
      if (!results) {
        throw new Error('No results returned from analysis');
      }

      // Calculate skill scores based on relevance to job description
      const skillScores: { [key: string]: number } = {};
      if (Array.isArray(results.skills_analysis?.matching_skills)) {
        results.skills_analysis.matching_skills.forEach((skill: string) => {
          // Calculate a score based on how well the skill matches the job description
          const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const skillRegex = new RegExp(escapedSkill, 'gi');
          const matches = (customDescription || jobDescription).match(skillRegex) || [];
          const score = Math.min(100, Math.max(0, (matches.length * 20) + 40)); // Base score of 40, +20 for each match, max 100
          skillScores[skill] = score;
        });
      }
      
      // Add skill scores to results
      const resultsWithScores = {
        ...results,
        skillScores
      };
      
      setAnalysisResults(resultsWithScores);
      
      // Create chat context with candidate information
      const context = `Candidate Information:
Name: ${fileName || 'Unknown'}
Skills: ${results.skills_analysis?.matching_skills?.join(', ') || ''}
Strengths: ${results.overall_match?.strengths?.join(', ') || ''}
Gaps: ${results.overall_match?.gaps?.join(', ') || ''}
Match Score: ${results.overall_match?.score || 0}%
Job Description: ${customDescription || jobDescription}

You are an AI recruitment assistant. Use this information to help answer questions about the candidate and provide relevant interview questions.`;
      
      setChatContext(context);
      
      // Save to Supabase
      try {
        await saveResumeAnalysis({
          candidate_name: fileName || 'Unknown',
          file_name: fileName || 'Unknown',
          job_description: customDescription || jobDescription,
          analysis_results: resultsWithScores
        });
        console.log('Analysis saved to database successfully');
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Don't throw here, as the analysis was successful
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const resetAnalysis = () => {
    setResumeUrl(null);
    setFileName(null);
    setJobDescription('');
    setCustomDescription('');
    setSelectedJobId('');
    setAnalysisResults(null);
    setError(null);
  };
  
  // Helper to generate a search link for a course
  const getCourseLink = (course: string) => {
    // Try to extract title and platform
    const match = course.match(/(.+) \((Coursera|Udemy|edX)\)/i);
    if (match) {
      const title = encodeURIComponent(match[1].trim());
      const platform = match[2].toLowerCase();
      if (platform === 'coursera') return `https://www.coursera.org/search?query=${title}`;
      if (platform === 'udemy') return `https://www.udemy.com/courses/search/?q=${title}`;
      if (platform === 'edx') return `https://www.edx.org/search?q=${title}`;
    }
    // Fallback: Google search
    return `https://www.google.com/search?q=${encodeURIComponent(course)}`;
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Resume Analysis</h1>
      {(() => { console.log('Analysis Results:', analysisResults); return null; })()}
      {!analysisResults ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ResumeUploader onUploadComplete={handleUploadComplete} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description</h3>
            
            {/* Job Position Dropdown */}
            <div className="mb-4">
              <label htmlFor="jobPosition" className="block text-sm font-medium text-gray-700 mb-1">
                Select Job Position
              </label>
              <select
                id="jobPosition"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a position...</option>
                {jobPositions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Description Field */}
            <div className="mb-4">
              <label htmlFor="customDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Job Description (Optional)
              </label>
              <textarea
                id="customDescription"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Enter a custom job description or modify the selected position's description..."
                className="w-full h-40 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Selected Job Description (Read-only) */}
            {selectedJobId && !customDescription && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Position Description
                </label>
                <div className="w-full h-40 p-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
                  {jobDescription}
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={handleAnalyzeResume}
                disabled={!resumeUrl || (!jobDescription && !customDescription) || isAnalyzing}
                fullWidth
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Resume...
                  </>
                ) : (
                  <>Analyze Resume</>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-900 text-white p-6">
            <div className="flex items-start">
              <FileText className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-xl font-bold">{fileName}</h2>
                <p className="text-blue-100 text-sm mt-1">Analysis Results</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Summary */}
            {analysisResults.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Summary</h3>
                <p className="text-gray-700 whitespace-pre-line">{analysisResults.summary}</p>
              </div>
            )}
            {/* Match Score */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mr-3">
                  {analysisResults.overall_match?.score || 0}%
                </div>
                Match Score
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    analysisResults.overall_match?.score >= 80 ? 'bg-green-600' :
                    analysisResults.overall_match?.score >= 60 ? 'bg-blue-600' :
                    analysisResults.overall_match?.score >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${analysisResults.overall_match?.score}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {analysisResults.overall_match?.score >= 80 ? 'Excellent match for this position' :
                 analysisResults.overall_match?.score >= 60 ? 'Good match for this position' :
                 analysisResults.overall_match?.score >= 40 ? 'Moderate match for this position' :
                 'Low match for this position'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Identified Skills</h3>
                <div className="space-y-2">
                  {Array.isArray(analysisResults.skills_analysis?.matching_skills) && analysisResults.skills_analysis.matching_skills.length > 0 ? (
                    analysisResults.skills_analysis.matching_skills.map((skill: string, index: number) => (
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
              <div>
                {/* Strengths in green box */}
                <h3 className="text-md font-medium text-gray-900 mb-3">Key Strengths</h3>
                <div className="space-y-2 bg-green-50 border border-green-200 rounded-md p-3">
                  {Array.isArray(analysisResults.overall_match?.strengths) && analysisResults.overall_match.strengths.length > 0 ? (
                    analysisResults.overall_match.strengths.map((strength: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-800">{strength}</span>
                    </div>
                    ))
                  ) : (
                    <span className="text-gray-500">No strengths identified.</span>
                  )}
                </div>
                {/* Weaknesses in yellow/orange box */}
                <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Potential Gaps</h3>
                <div className="space-y-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  {Array.isArray(analysisResults.overall_match?.gaps) && analysisResults.overall_match.gaps.length > 0 ? (
                    analysisResults.overall_match.gaps.map((gap: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                      <span className="text-gray-800">{gap}</span>
                    </div>
                    ))
                  ) : (
                    <span className="text-gray-500">No potential gaps identified.</span>
                  )}
                </div>
                {/* Red Flags in red box */}
                {Array.isArray(analysisResults.redFlags) && analysisResults.redFlags.length > 0 && (
                  <>
                  <h3 className="text-md font-medium text-red-700 mt-6 mb-3">Red Flags</h3>
                  <div className="space-y-2 bg-red-50 border border-red-200 rounded-md p-3">
                    {analysisResults.redFlags.map((flag: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        <span className="text-red-700">{flag}</span>
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </div>
            </div>
            {/* Recommendations in blue/neutral box */}
            <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="text-md font-medium text-blue-900 mb-2">Recommendations</h3>
              {typeof analysisResults.recommendations === 'string' ? (
                <p className="text-blue-800 whitespace-pre-line">{analysisResults.recommendations}</p>
              ) : analysisResults.recommendations && typeof analysisResults.recommendations === 'object' ? (
                <div className="space-y-4">
                  {analysisResults.recommendations.interview_focus && (
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Interview Focus Areas:</h4>
                      <ul className="list-disc pl-6 text-blue-800">
                        {Array.isArray(analysisResults.recommendations.interview_focus) ? 
                          analysisResults.recommendations.interview_focus.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          )) : 
                          <li>{analysisResults.recommendations.interview_focus}</li>
                        }
                      </ul>
                    </div>
                  )}
                  {analysisResults.recommendations.development_areas && (
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Development Areas:</h4>
                      <ul className="list-disc pl-6 text-blue-800">
                        {Array.isArray(analysisResults.recommendations.development_areas) ? 
                          analysisResults.recommendations.development_areas.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          )) : 
                          <li>{analysisResults.recommendations.development_areas}</li>
                        }
                      </ul>
                    </div>
                  )}
                  {analysisResults.recommendations.risk_factors && (
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Risk Factors:</h4>
                      <ul className="list-disc pl-6 text-blue-800">
                        {Array.isArray(analysisResults.recommendations.risk_factors) ? 
                          analysisResults.recommendations.risk_factors.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          )) : 
                          <li>{analysisResults.recommendations.risk_factors}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-blue-800">No recommendations available.</p>
              )}
            </div>
            {/* Online Courses as clickable links */}
            {Array.isArray(analysisResults.onlineCourses) && analysisResults.onlineCourses.length > 0 && (
              <div className="mt-8 p-4 bg-indigo-50 rounded-md border border-indigo-200">
                <h3 className="text-md font-medium text-indigo-900 mb-2">Recommended Online Courses</h3>
                <ul className="list-disc pl-6 text-indigo-800">
                  {analysisResults.onlineCourses.map((course: string, idx: number) => (
                    <li key={idx}>
                      <a href={getCourseLink(course)} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">{course}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Suggested Interview Questions */}
            {Array.isArray(analysisResults.suggestedQuestions) && analysisResults.suggestedQuestions.length > 0 && (
              <div className="mt-8 p-4 bg-green-50 rounded-md border border-green-200">
                <h3 className="text-md font-medium text-green-900 mb-2">Suggested Interview Questions</h3>
                <ul className="list-decimal pl-6 text-green-800">
                  {analysisResults.suggestedQuestions.map((q: string, idx: number) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={resetAnalysis}
                className="mr-3"
              >
                Analyze Another Resume
              </Button>
              <Button variant="primary">Shortlist Candidate</Button>
              <Button
                variant="primary"
                onClick={() => setShowChatbot(true)}
              >
                Ask Chatbot for Interview Questions
              </Button>
            </div>
          </div>
        </div>
        {/* Chatbot interface appears below after clicking the button */}
        {showChatbot && (
          <div className="mt-8">
            <ChatInterface initialContext={chatContext} />
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default Resume;