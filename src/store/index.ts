import { create } from 'zustand';
import { Candidate, Resume, ResumeAnalysis, ChatMessage, BulkUploadResult, JobPosition } from '../types';

interface AppState {
  // API Keys
  openAIApiKey: string | null;
  setOpenAIApiKey: (key: string) => void;

  // Candidates
  candidates: Candidate[];
  filteredCandidates: Candidate[];
  selectedCandidate: Candidate | null;
  setCandidates: (candidates: Candidate[]) => void;
  filterCandidates: (status?: string, searchTerm?: string) => void;
  selectCandidate: (candidate: Candidate) => void;

  // Resumes
  resumes: Resume[];
  selectedResume: Resume | null;
  setResumes: (resumes: Resume[]) => void;
  selectResume: (resume: Resume) => void;

  // Analysis
  currentAnalysis: ResumeAnalysis | null;
  setCurrentAnalysis: (analysis: ResumeAnalysis | null) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Bulk Upload
  bulkUploads: BulkUploadResult[];
  addBulkUpload: (upload: BulkUploadResult) => void;
  updateBulkUpload: (id: string, updates: Partial<BulkUploadResult>) => void;

  // Job Positions
  jobPositions: JobPosition[];
  selectedJobPosition: JobPosition | null;
  setJobPositions: (positions: JobPosition[]) => void;
  selectJobPosition: (position: JobPosition) => void;
  addJobPosition: (position: JobPosition) => void;
  updateJobPosition: (id: string, updates: Partial<JobPosition>) => void;
  deleteJobPosition: (id: string) => void;

  // Resume Analysis List
  resumeAnalyses: ResumeAnalysis[];
  setResumeAnalyses: (analyses: ResumeAnalysis[]) => void;
  addResumeAnalysis: (analysis: ResumeAnalysis) => void;
  updateResumeAnalysis: (id: string, updates: Partial<ResumeAnalysis>) => void;

  // Loading States
  loading: boolean;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

const useAppStore = create<AppState>((set) => ({
  // API Keys
  openAIApiKey: null,
  setOpenAIApiKey: (key: string) => set({ openAIApiKey: key }),

  // Candidates
  candidates: [],
  filteredCandidates: [],
  selectedCandidate: null,
  setCandidates: (candidates) => set({ 
    candidates,
    filteredCandidates: candidates 
  }),
  filterCandidates: (status, searchTerm) => set((state) => {
    let filtered = [...state.candidates];
    
    if (status) {
      filtered = filtered.filter(candidate => candidate.status === status);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term)
      );
    }
    
    return { filteredCandidates: filtered };
  }),
  selectCandidate: (candidate) => set({ selectedCandidate: candidate }),

  // Resumes
  resumes: [],
  selectedResume: null,
  setResumes: (resumes) => set({ resumes }),
  selectResume: (resume) => set({ selectedResume: resume }),

  // Analysis
  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // Bulk Upload
  bulkUploads: [],
  addBulkUpload: (upload) => set((state) => ({
    bulkUploads: [...state.bulkUploads, upload]
  })),
  updateBulkUpload: (id, updates) => set((state) => ({
    bulkUploads: state.bulkUploads.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    )
  })),

  // Job Positions
  jobPositions: [],
  selectedJobPosition: null,
  setJobPositions: (positions) => set({ jobPositions: positions }),
  selectJobPosition: (position) => set({ selectedJobPosition: position }),
  addJobPosition: (position) => set((state) => ({
    jobPositions: [...state.jobPositions, position]
  })),
  updateJobPosition: (id, updates) => set((state) => ({
    jobPositions: state.jobPositions.map(position =>
      position.id === id ? { ...position, ...updates } : position
    )
  })),
  deleteJobPosition: (id) => set((state) => ({
    jobPositions: state.jobPositions.filter(position => position.id !== id)
  })),

  // Resume Analysis List
  resumeAnalyses: [],
  setResumeAnalyses: (analyses) => set({ resumeAnalyses: analyses }),
  addResumeAnalysis: (analysis) => set((state) => ({
    resumeAnalyses: [...state.resumeAnalyses, analysis]
  })),
  updateResumeAnalysis: (id, updates) => set((state) => ({
    resumeAnalyses: state.resumeAnalyses.map(analysis =>
      analysis.id === id ? { ...analysis, ...updates } : analysis
    )
  })),

  // Loading States
  loading: false,
  isLoading: false,
  setLoading: (loading) => set({ loading }),
  setIsLoading: (loading) => set({ isLoading: loading })
}));

export default useAppStore; 