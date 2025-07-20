import React, { useState, useEffect } from 'react';

import Button from '../components/common/Button';
import { getJobPositions, updateCandidateStatus } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { analyzeBulkResumes } from '../services/bulkAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';


interface JobPosition {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: string;
}

interface ResumeFile {
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysis?: AnalysisResult;
}

interface AnalysisResult {
  id: string;
  candidate_name: string;
  file_name: string;
  job_description: string;
  analysis_results: {
    matchScore: number;
    summary: string;
    skills: Record<string, number>;
    experience: Record<string, number>;
  };
  created_at: string;
  rank?: number;
  status?: 'accepted' | 'rejected';
  candidate_id?: string;
}

const BulkScreening: React.FC = () => {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([
    { id: 'software_engineer', title: 'Software Engineer', description: '', requirements: [], status: 'active' },
    { id: 'frontend_developer', title: 'Frontend Developer', description: '', requirements: [], status: 'active' },
    { id: 'backend_developer', title: 'Backend Developer', description: '', requirements: [], status: 'active' },
    { id: 'fullstack_developer', title: 'Full Stack Developer', description: '', requirements: [], status: 'active' },
    { id: 'devops_engineer', title: 'DevOps Engineer', description: '', requirements: [], status: 'active' },
    { id: 'data_scientist', title: 'Data Scientist', description: '', requirements: [], status: 'active' },
    { id: 'machine_learning_engineer', title: 'Machine Learning Engineer', description: '', requirements: [], status: 'active' },
    { id: 'product_manager', title: 'Product Manager', description: '', requirements: [], status: 'active' },
    { id: 'project_manager', title: 'Project Manager', description: '', requirements: [], status: 'active' },
    { id: 'ui_ux_designer', title: 'UI/UX Designer', description: '', requirements: [], status: 'active' },
    { id: 'qa_engineer', title: 'QA Engineer', description: '', requirements: [], status: 'active' },
    { id: 'mobile_developer', title: 'Mobile Developer', description: '', requirements: [], status: 'active' },
    { id: 'cloud_architect', title: 'Cloud Architect', description: '', requirements: [], status: 'active' },
    { id: 'security_engineer', title: 'Security Engineer', description: '', requirements: [], status: 'active' },
    { id: 'technical_lead', title: 'Technical Lead', description: '', requirements: [], status: 'active' }
  ]);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY; // Using environment variable instead

  // Load job positions on component mount
  useEffect(() => {
    const fetchJobPositions = async () => {
      try {
        const positions = await getJobPositions();
        // Only update if we have positions from the database
        if (positions && positions.length > 0) {
          setJobPositions(positions.map(pos => ({
            id: pos.id as string,
            title: pos.title as string,
            description: pos.description as string,
            requirements: pos.requirements as string[],
            status: pos.status as string
          })));
          setSelectedPosition(positions[0]?.id?.toString() || null);
        }
        // If no positions from database, keep the predefined ones
      } catch (error: any) {
        console.error('Error fetching job positions:', error);
        setError(`Failed to load job positions: ${error.message}`);
        // Keep the predefined positions on error
      }
    };

    fetchJobPositions();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setResumeFiles(files.map(file => ({
      file,
      name: file.name,
      status: 'pending',
      progress: 0
    })));
    setError(null); // Clear previous errors
  };



  const startAnalysis = async () => {
    if (!selectedPosition) {
      setError('Please select a job position');
      return;
    }

    if (!openAIApiKey) {
      setError('Please add your OpenAI API key in the settings or environment variables.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    // Update all files to analyzing status
    setResumeFiles(files => 
      files.map(file => ({
        ...file,
        status: 'analyzing',
        progress: 0, // Reset progress for analysis phase
        analysis: undefined // Clear previous analysis results
      }))
    );

    try {
      const filesToAnalyze = resumeFiles.map(f => f.file);
      const results = await analyzeBulkResumes(
        filesToAnalyze,
        selectedPosition,
        (progress) => setProgress(progress)
      );

      console.log('Bulk analysis completed. Results:', results);

      // Update files with analysis results
      setResumeFiles(files => 
        files.map(file => {
          // Find the corresponding result by file name, assuming file names are unique among successful analyses
          const result = results.find(r => r.file_name === file.name);
          
          // If analysis succeeded for this file
          if (result) {
            return {
              ...file,
              status: 'completed',
              progress: 100,
              analysis: result
            };
          } else {
            // If no result was found for this file (implies an error occurred during its processing in analyzeBulkResumes)
            // Find the corresponding error result if it was added to the results array
            const errorResult = results.find(r => r.id?.startsWith('error-') && r.file_name === file.name) as AnalysisResult | undefined;

            return {
              ...file,
              status: 'error',
              progress: 0,
              analysis: errorResult || { // Use error result if found, otherwise a generic error object
                 id: `process-error-${file.name}-${Date.now()}`,
                 candidate_name: file.name.split('.')[0],
                 file_name: file.name,
                 job_description: '',
                 analysis_results: {
                   matchScore: 0,
                   summary: `Processing failed. Check console for details.`, // Generic message
                   skills: {},
                   experience: {}
                 },
                 created_at: new Date().toISOString(),
                 rank: 0
              }
            };
          }
        })
      );

      if (results.length === 0 && resumeFiles.length > 0) {
        setError('No successful analysis results were generated. Please check console for errors.');
      }

    } catch (error: any) {
      console.error('Error during bulk analysis process:', error);
      setError(`Failed to analyze resumes: ${error.message || 'An unknown error occurred'}`);
      
      // Update all currently analyzing files to error status
      setResumeFiles(files => 
        files.map(file => 
          file.status === 'analyzing' ? { ...file, status: 'error', progress: 0 } : file
        )
      );
    } finally {
      setIsAnalyzing(false);
      // Keep progress bar at 100% on completion or reset on caught error above
    }
  };

  const handleAccept = async (e: React.MouseEvent, analysis: AnalysisResult) => {
    e.stopPropagation();
    try {
      // Assuming candidate_id is available on the analysis result
      if (analysis.candidate_id) {
        await updateCandidateStatus(analysis.candidate_id, 'accepted');
        setResumeFiles(prevFiles =>
          prevFiles.map(file =>
            file.analysis?.id === analysis.id ? { ...file, analysis: { ...file.analysis, status: 'accepted' } as AnalysisResult } : file
          )
        );
      } else {
        console.error('Candidate ID not found on analysis result:', analysis);
        alert('Cannot accept: Candidate ID is missing.');
      }
    } catch (error: any) {
      console.error('Error accepting candidate:', error);
      alert(`Failed to accept candidate: ${error.message}`);
    }
  };

  const handleReject = async (e: React.MouseEvent, analysis: AnalysisResult) => {
    e.stopPropagation();
     try {
      // Assuming candidate_id is available on the analysis result
      if (analysis.candidate_id) {
        await updateCandidateStatus(analysis.candidate_id, 'rejected');
         setResumeFiles(prevFiles =>
          prevFiles.map(file =>
            file.analysis?.id === analysis.id ? { ...file, analysis: { ...file.analysis, status: 'rejected' } as AnalysisResult } : file
          )
        );
      } else {
        console.error('Candidate ID not found on analysis result:', analysis);
        alert('Cannot reject: Candidate ID is missing.');
      }
    } catch (error: any) {
      console.error('Error rejecting candidate:', error);
      alert(`Failed to reject candidate: ${error.message}`);
    }
  };

  const selectedJobPosition = jobPositions.find(p => p.id === selectedPosition);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Resume Screening</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Position</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="jobPosition">Select Job Position</Label>
          <Select onValueChange={setSelectedPosition} value={selectedPosition || ''}>
            <SelectTrigger id="jobPosition">
              <SelectValue placeholder="Select a job position" />
            </SelectTrigger>
            <SelectContent>
              {jobPositions.map(position => (
                <SelectItem key={position.id} value={position.id}>
                  {position.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedJobPosition && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold">{selectedJobPosition.title}</h3>
              <p className="text-sm text-gray-700 mt-1">{selectedJobPosition.description}</p>
              {selectedJobPosition.requirements && selectedJobPosition.requirements.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Requirements:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {selectedJobPosition.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Resumes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="resumeFiles">Select Files (.pdf, .doc, .docx)</Label>
          <Input id="resumeFiles" type="file" multiple accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          
          {resumeFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Selected Files:</h3>
              <ul className="space-y-2">
                {resumeFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                    <span>{file.name}</span>
                    {file.status !== 'pending' && (
                       <span
                        className={`text-sm font-semibold ${
                          file.status === 'analyzing' ? 'text-blue-600' :
                          file.status === 'completed' ? 'text-green-600' :
                          file.status === 'error' ? 'text-red-600' :
                          ''
                        }`}
                      >
                        {file.status === 'analyzing' ? `Processing (${Math.round(file.progress)}%)` : file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

          <Button
            onClick={startAnalysis}
            disabled={!selectedPosition || resumeFiles.length === 0 || isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </Button>

          {isAnalyzing && ( // Show overall progress bar during analysis phase
             <div className="mt-4">
              <Label>Overall Progress</Label>
              <Progress value={progress} className="w-full mt-1" />
            </div>
          )}

        </CardContent>
      </Card>

      {/* Analysis Results Section */}
      {resumeFiles.some(f => f.status === 'completed' || f.status === 'error') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
          <div className="space-y-4">
            {resumeFiles
              .filter(f => f.status === 'completed' || f.status === 'error')
              .sort((a, b) => {
                // Sort completed files by rank, errors at the bottom
                if (a.status === 'error' && b.status !== 'error') return 1;
                if (a.status !== 'error' && b.status === 'error') return -1;
                if (a.status === 'completed' && b.status === 'completed') {
                  // Add safety checks before accessing matchScore for sorting
                   const scoreA = a.analysis?.analysis_results?.matchScore ?? 0;
                   const scoreB = b.analysis?.analysis_results?.matchScore ?? 0;
                   return scoreB - scoreA;
                }
                return 0; // Keep order for error files among themselves
              })
              .map((file, index) => {
                console.log(`Rendering result for ${file.name}:`, file);
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                      file.status === 'error' ? 'border-red-200 bg-red-50' : ''
                    }`}
                    onClick={() => file.status === 'completed' && navigate(`/analysis/${file.analysis?.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-medium text-gray-900 mr-2">
                            {file.status === 'completed' && file.analysis?.rank ? `#${file.analysis.rank}` : 'Error'}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">
                            {file.name}
                          </h3>
                        </div>
                        {file.status === 'completed' && file.analysis ? (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    // Add safety check before accessing matchScore for style width
                                    style={{ width: `${file.analysis.analysis_results?.matchScore ?? 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {/* Add safety check before calling toFixed */}
                                  {`${(file.analysis.analysis_results?.matchScore ?? 0).toFixed(1)}%`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {file.analysis.analysis_results?.summary}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {/* Add safety check before mapping skills */}
                                {file.analysis.analysis_results?.skills && Object.entries(file.analysis.analysis_results.skills)
                                  .sort(([, a], [, b]) => Number(b) - Number(a))
                                  .slice(0, 5)
                                  .map(([skill, score]) => (
                                    <span
                                      key={skill}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {skill} ({Number(score).toFixed(1)})
                                    </span>
                                  ))}
                              </div>
                            </div>
                            {/* Action buttons */} {/* Ensure candidate_id exists before showing buttons */}
                             {(file.analysis.candidate_id) && (
                               <div className="flex space-x-2 mt-4">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={(e: React.MouseEvent) => handleAccept(e, file.analysis as AnalysisResult)}
                                   disabled={file.analysis.status === 'accepted'}
                                   className={file.analysis.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                 >
                                   {file.analysis.status === 'accepted' ? 'Accepted' : 'Accept'}
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className={`text-red-600 ${file.analysis.status === 'rejected' ? 'bg-red-50 border-red-200' : ''}`}
                                   onClick={(e: React.MouseEvent) => handleReject(e, file.analysis as AnalysisResult)}
                                   disabled={file.analysis.status === 'rejected'}
                                 >
                                   {file.analysis.status === 'rejected' ? 'Rejected' : 'Reject'}
                                 </Button>
                               </div>
                             )}
                          </>
                        ) : (
                          <p className="text-sm text-red-600">
                            {file.analysis?.analysis_results?.summary || 'Failed to analyze this resume. Check console for errors.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkScreening;