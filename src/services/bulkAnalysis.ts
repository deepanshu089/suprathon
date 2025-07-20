import { supabase } from '../lib/supabase';
import { analyzeResumeWithHF } from '../lib/openai';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
}

export const analyzeBulkResumes = async (
  files: File[],
  jobPositionId: string,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult[]> => {
  const results: AnalysisResult[] = [];
  const totalFiles = files.length;

  // Ensure storage bucket exists and permissions are correct before starting
  try {
    await ensureStorageBucketPermissions();
  } catch (error) {
    console.error('Failed to ensure storage bucket permissions:', error);
    throw new Error('Storage initialization failed. Please check the browser console for detailed guidance.');
  }

  // Get job position details first
  const { data: jobPosition, error: jobError } = await supabase
    .from('job_positions')
    .select('*')
    .eq('id', jobPositionId)
    .single();

  if (jobError) throw jobError;

  // Process all files first to extract text
  const fileTexts: { file: File; text: string; name: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      let resumeText = '';
      
      if (file.type === 'application/pdf') {
        try {
          // First upload the file to Supabase storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          
          // Upload with retry logic
          let uploadError = null;
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const { error } = await supabase.storage
                .from('resumes')
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false
                });
              
              if (!error) break;
              
              // If it's a policy or bucket error, re-throw immediately to show guidance
              if (error.message.includes('bucket') || error.message.includes('policy')) {
                 throw error;
              }
              
              uploadError = error;
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            } catch (error) {
              // If it's already a bucket/policy error from above, just re-throw
              if (error.message.includes('bucket') || error.message.includes('policy')) {
                throw error;
              }
              uploadError = error;
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              }
            }
          }

          if (uploadError) throw uploadError;

          // Get the signed URL for the file
          const { data: { signedUrl }, error: signedUrlError } = await supabase.storage
            .from('resumes')
            .createSignedUrl(fileName, 60); // URL valid for 60 seconds

          if (signedUrlError) throw signedUrlError;

          // Load the PDF using the signed URL
          const loadingTask = pdfjsLib.getDocument(signedUrl);
          const pdf = await loadingTask.promise;
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            resumeText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }

          // Clean up the file after processing
          await supabase.storage
            .from('resumes')
            .remove([fileName]);
        } catch (pdfError) {
          console.error(`Error processing PDF ${file.name}:`, pdfError);
          throw new Error(`Failed to process PDF: ${file.name} - ${pdfError.message}`);
        }
      } else if (
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          // @ts-ignore
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          resumeText = result.value;
        } catch (docError) {
          console.error(`Error processing DOC ${file.name}:`, docError);
          throw new Error(`Failed to process DOC: ${file.name} - ${docError.message}`);
        }
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      if (!resumeText.trim()) {
        throw new Error(`No text content extracted from: ${file.name}`);
      }

      fileTexts.push({
        file,
        text: resumeText,
        name: file.name
      });

      // Update progress for text extraction
      if (onProgress) {
        onProgress((i + 1) / totalFiles * 50); // First 50% for text extraction
      }
    } catch (error) {
      console.error(`Error extracting text from ${file.name}:`, error);
      // Add error result
      results.push({
        id: `error-${i}`,
        candidate_name: file.name.split('.')[0],
        file_name: file.name,
        job_description: jobPosition.description,
        analysis_results: {
          matchScore: 0,
          summary: `Error: ${error.message}`,
          skills: {},
          experience: {}
        },
        created_at: new Date().toISOString()
      });
      // Continue with next file
    }
  }

  // Now analyze all resumes with the extracted text
  for (let i = 0; i < fileTexts.length; i++) {
    const { file, text, name } = fileTexts[i];
    try {
      // Generate a unique email placeholder
      const uniqueEmail = `${name.replace(/[^a-zA-Z0-9]/g, '_ outliers_.')}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@placeholder.com`;

      // Create candidate record
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert([
          {
            name: name.split('.')[0], // Use filename as candidate name
            status: 'new',
            email: uniqueEmail, // Use the unique placeholder email
            phone: '', // Provide default empty string for phone if it exists and is NOT NULL
          }
        ])
        .select()
        .single();

      if (candidateError) throw candidateError;

      // Analyze resume using AI service
      const analysis = await analyzeResumeWithHF(text, jobPosition.description);

      // Save analysis results
      const { data: analysisData, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert([
          {
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            file_name: name,
            job_description: jobPosition.description,
            analysis_results: analysis
          }
        ])
        .select()
        .single();

      if (analysisError) throw analysisError;

      results.push(analysisData);

      // Update progress for analysis
      if (onProgress) {
        onProgress(50 + ((i + 1) / fileTexts.length * 50)); // Last 50% for analysis
      }
    } catch (error) {
      console.error(`Error processing file ${name}:`, error);
      // Add error result
      results.push({
        id: `error-${i}`,
        candidate_name: name.split('.')[0],
        file_name: name,
        job_description: jobPosition.description,
        analysis_results: {
          matchScore: 0,
          summary: `Error: ${error.message}`,
          skills: {},
          experience: {}
        },
        created_at: new Date().toISOString()
      });
    }
  }

  // Sort results by match score and add ranking
  const sortedResults = results
    .sort((a, b) => (b.analysis_results.matchScore || 0) - (a.analysis_results.matchScore || 0))
    .map((result, index) => ({
      ...result,
      rank: index + 1
    }));

  return sortedResults;
};

export const updateCandidateStatus = async (
  candidateId: string,
  status: 'accepted' | 'rejected'
) => {
  const { data, error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', candidateId)
    .select()
    .single();

  if (error) throw error;
  return data;
}; 