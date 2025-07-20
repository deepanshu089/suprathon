import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, MessageSquare, User, CheckCircle, X, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import CandidateList from '../components/candidate/CandidateList';
import Button from '../components/common/Button';
import ChatInterface from '../components/chat/ChatInterface';
import useAppStore from '../store';
import { updateCandidateStatus, getCandidateById, getResumeAnalysis } from '../lib/supabase';

const Candidates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const { selectedCandidate, selectCandidate } = useAppStore();
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadCandidate = async () => {
      if (id) {
        try {
          const candidate = await getCandidateById(id);
          selectCandidate(candidate);
          
          // Fetch resume analysis
          const analysis = await getResumeAnalysis(id);
          setResumeAnalysis(analysis);
        } catch (error) {
          console.error('Error loading candidate:', error);
          navigate('/candidates');
        }
      }
    };
    
    loadCandidate();
  }, [id, selectCandidate, navigate]);
  
  const handleBack = () => {
    selectCandidate(null);
    navigate('/candidates');
  };
  
  const handleStatusChange = async (status: 'shortlisted' | 'rejected') => {
    if (!selectedCandidate) return;
    
    try {
      await updateCandidateStatus(selectedCandidate.id, status);
      
      // Update the local state
      selectCandidate({
        ...selectedCandidate,
        status,
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
    }
  };
  
  return (
    <div>
      {selectedCandidate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6 flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              icon={<ArrowLeft size={16} />}
              className="mr-4"
            >
              Back to List
            </Button>
            
            <h1 className="text-2xl font-bold text-gray-900 flex-1">Candidate Details</h1>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit size={16} />}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Trash2 size={16} />}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-3xl font-medium mb-4">
                    {selectedCandidate.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                  <p className="text-gray-500 mt-1">{selectedCandidate.email}</p>
                  
                  {selectedCandidate.phone && (
                    <p className="text-gray-500 mt-1">{selectedCandidate.phone}</p>
                  )}
                  
                  <div className="mt-4">
                    {selectedCandidate.status === 'new' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        New
                      </span>
                    )}
                    
                    {selectedCandidate.status === 'screening' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Screening
                      </span>
                    )}
                    
                    {selectedCandidate.status === 'shortlisted' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Shortlisted
                      </span>
                    )}
                    
                    {selectedCandidate.status === 'rejected' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <X className="w-3 h-3 mr-1" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
                  
                  <div className="space-y-2">
                    {selectedCandidate.status !== 'shortlisted' && (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleStatusChange('shortlisted')}
                        icon={<CheckCircle size={16} />}
                      >
                        Shortlist Candidate
                      </Button>
                    )}
                    
                    {selectedCandidate.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => handleStatusChange('rejected')}
                        icon={<X size={16} />}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                      >
                        Reject Candidate
                      </Button>
                    )}
                    
                    <Button
                      variant={activeTab === 'chat' ? 'secondary' : 'outline'}
                      size="sm"
                      fullWidth
                      onClick={() => setActiveTab('chat')}
                      icon={<MessageSquare size={16} />}
                    >
                      Chat History
                    </Button>
                  </div>
                </div>
                
                {selectedCandidate.score !== undefined && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Match Score</h3>
                    
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <span className={`text-lg font-bold ${
                          selectedCandidate.score >= 80 ? 'text-green-600' :
                          selectedCandidate.score >= 60 ? 'text-blue-600' :
                          selectedCandidate.score >= 40 ? 'text-yellow-500' : 'text-red-600'
                        }`}>
                          {selectedCandidate.score}%
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              selectedCandidate.score >= 80 ? 'bg-green-600' :
                              selectedCandidate.score >= 60 ? 'bg-blue-600' :
                              selectedCandidate.score >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${selectedCandidate.score}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedCandidate.score >= 80 ? 'Excellent match' :
                          selectedCandidate.score >= 60 ? 'Good match' :
                          selectedCandidate.score >= 40 ? 'Moderate match' : 'Low match'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      className={`py-4 px-6 focus:outline-none ${
                        activeTab === 'details'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('details')}
                    >
                      <User className="inline-block mr-2 h-5 w-5" />
                      Profile Details
                    </button>
                    <button
                      className={`py-4 px-6 focus:outline-none ${
                        activeTab === 'chat'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('chat')}
                    >
                      <MessageSquare className="inline-block mr-2 h-5 w-5" />
                      Chat History
                    </button>
                  </nav>
                </div>
                
                <div className="p-6">
                  {activeTab === 'details' ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Candidate Information</h3>
                      
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Resume</h4>
                          
                          {/* This would display actual resume data from the database */}
                          <div className="p-4 border border-gray-200 rounded-md flex items-center">
                            <FileText className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">resume_john_smith.pdf</p>
                              <p className="text-xs text-gray-500">Uploaded on {new Date(selectedCandidate.created_at).toLocaleDateString()}</p>
                            </div>
                            <Button variant="outline" size="sm" className="ml-auto">
                              View
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Skills</h4>
                          
                          <div className="flex flex-wrap gap-2">
                            {/* These would be actual skills from the resume */}
                            {['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML', 'Node.js', 'Git', 'REST API'].map((skill, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Experience</h4>
                          
                          {/* These would be actual experiences from the resume */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Senior Frontend Developer</p>
                              <p className="text-sm text-gray-600">Tech Company</p>
                              <p className="text-xs text-gray-500">2020 - Present</p>
                              <p className="text-sm text-gray-700 mt-1">
                                Developed responsive web applications using React, TypeScript, and TailwindCSS.
                                Led a team of developers to deliver features on time.
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-900">Junior Developer</p>
                              <p className="text-sm text-gray-600">Startup Inc.</p>
                              <p className="text-xs text-gray-500">2018 - 2020</p>
                              <p className="text-sm text-gray-700 mt-1">
                                Built UI components using JavaScript and CSS.
                                Collaborated with designers to implement interfaces.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Education</h4>
                          
                          {/* This would be actual education from the resume */}
                          <div>
                            <p className="text-sm font-medium text-gray-900">Bachelor of Science in Computer Science</p>
                            <p className="text-sm text-gray-600">State University</p>
                            <p className="text-xs text-gray-500">2014 - 2018</p>
                          </div>
                        </div>
                        
                        {selectedCandidate.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Notes</h4>
                            
                            <div className="p-4 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-700 whitespace-pre-line">{selectedCandidate.notes}</p>
                            </div>
                          </div>
                        )}

                        {resumeAnalysis && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Resume Analysis</h4>
                            
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">Job Description</h5>
                                  <p className="text-sm text-gray-600">{resumeAnalysis.job_description}</p>
                                </div>
                                
                                {resumeAnalysis.analysis_results && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Analysis Results</h5>
                                    <div className="space-y-4">
                                      {resumeAnalysis.analysis_results.summary && (
                                        <div>
                                          <h6 className="text-xs font-medium text-gray-500 uppercase mb-1">Summary</h6>
                                          <p className="text-sm text-gray-600">{resumeAnalysis.analysis_results.summary}</p>
                                        </div>
                                      )}
                                      
                                      {resumeAnalysis.analysis_results.matchScore && (
                                        <div>
                                          <h6 className="text-xs font-medium text-gray-500 uppercase mb-1">Match Score</h6>
                                          <div className="flex items-center">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                              <div 
                                                className={`h-2.5 rounded-full ${
                                                  resumeAnalysis.analysis_results.matchScore >= 80 ? 'bg-green-600' :
                                                  resumeAnalysis.analysis_results.matchScore >= 60 ? 'bg-yellow-500' :
                                                  'bg-red-600'
                                                }`}
                                                style={{ width: `${resumeAnalysis.analysis_results.matchScore}%` }}
                                              ></div>
                                            </div>
                                            <span className={`text-sm font-medium ${
                                              resumeAnalysis.analysis_results.matchScore >= 80 ? 'text-green-600' :
                                              resumeAnalysis.analysis_results.matchScore >= 60 ? 'text-yellow-600' :
                                              'text-red-600'
                                            }`}>
                                              {resumeAnalysis.analysis_results.matchScore}%
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {resumeAnalysis.analysis_results.skills && (
                                        <div>
                                          <h6 className="text-xs font-medium text-gray-500 uppercase mb-1">Skills Analysis</h6>
                                          <div className="space-y-2">
                                            {Object.entries(resumeAnalysis.analysis_results.skills).map(([skill, match]: [string, any]) => (
                                              <div key={skill} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{skill}</span>
                                                <span className={`text-sm font-medium ${
                                                  match >= 0.8 ? 'text-green-600' :
                                                  match >= 0.6 ? 'text-yellow-600' :
                                                  'text-red-600'
                                                }`}>
                                                  {Math.round(match * 100)}%
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {resumeAnalysis.analysis_results.experience && (
                                        <div>
                                          <h6 className="text-xs font-medium text-gray-500 uppercase mb-1">Experience Analysis</h6>
                                          <div className="space-y-2">
                                            {Object.entries(resumeAnalysis.analysis_results.experience).map(([exp, match]: [string, any]) => (
                                              <div key={exp} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{exp}</span>
                                                <span className={`text-sm font-medium ${
                                                  match >= 0.8 ? 'text-green-600' :
                                                  match >= 0.6 ? 'text-yellow-600' :
                                                  'text-red-600'
                                                }`}>
                                                  {Math.round(match * 100)}%
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ChatInterface candidateId={selectedCandidate.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Candidates</h1>
          <CandidateList />
        </div>
      )}
    </div>
  );
};

export default Candidates;