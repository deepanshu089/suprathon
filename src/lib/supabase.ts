import { createClient } from '@supabase/supabase-js';

interface JobPosition {
  title: string;
  description: string;
  requirements: string[];
  status: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Export the single instance
export const supabase = getSupabaseClient();

// API functions
export const getCandidates = async (status?: string) => {
  try {
    let query = supabase.from('candidates').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCandidates:', error);
    throw error;
  }
};

export const getCandidateById = async (id: string) => {
  try {
    // First get the candidate
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError) {
      console.error('Error fetching candidate:', candidateError);
      throw candidateError;
    }

    // Then get their resume analyses
    const { data: resumeAnalyses, error: resumeError } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    if (resumeError) {
      console.error('Error fetching resume analyses:', resumeError);
      throw resumeError;
    }

    // Finally get their chat messages
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (chatError) {
      console.error('Error fetching chat messages:', chatError);
      throw chatError;
    }

    // Combine all the data
    return {
      ...candidate,
      resume_analyses: resumeAnalyses || [],
      chat_messages: chatMessages || []
    };
  } catch (error) {
    console.error('Error fetching candidate:', error);
    throw error;
  }
};

export const updateCandidateStatus = async (id: string, status: string) => {
  const { data, error } = await supabase
    .from('candidates')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating candidate status:', error);
    throw error;
  }
  
  return data;
};

export const saveChatMessage = async (sessionId: string, message: { sender: string; content: string; session_id: string }) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender: message.sender,
      content: message.content,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
  
  return data;
};

export const getJobPositions = async () => {
  try {
    // Define the initial positions array
    const initialPositions = [
      {
        title: 'Frontend Developer',
        description: 'We are looking for a Frontend Developer to join our team and help build beautiful and responsive web applications. The ideal candidate should have strong experience with modern JavaScript frameworks, particularly React, and a keen eye for design and user experience.',
        requirements: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript', '3+ years experience', 'Responsive Design', 'UI/UX principles'],
        status: 'active'
      },
      {
        title: 'Backend Developer',
        description: 'Seeking a skilled Backend Developer to design and implement scalable APIs and services. The role involves working with modern technologies to build robust server-side applications and microservices.',
        requirements: ['Node.js', 'Express', 'SQL', 'NoSQL', 'RESTful API design', '3+ years experience', 'Microservices', 'Docker', 'AWS'],
        status: 'active'
      },
      {
        title: 'Full Stack Developer',
        description: 'We need a Full Stack Developer who can work on both frontend and backend aspects of our applications. The ideal candidate should be comfortable working across the entire stack and have experience with modern web technologies.',
        requirements: ['React', 'Node.js', 'Express', 'SQL', 'JavaScript', '4+ years experience', 'TypeScript', 'Docker', 'AWS'],
        status: 'active'
      },
      {
        title: 'DevOps Engineer',
        description: 'Looking for a DevOps Engineer to help streamline our development and deployment processes. The role involves setting up and maintaining CI/CD pipelines, managing cloud infrastructure, and ensuring system reliability.',
        requirements: ['Docker', 'Kubernetes', 'AWS/Azure', 'CI/CD', 'Terraform', '3+ years experience', 'Linux', 'Shell scripting'],
        status: 'active'
      },
      {
        title: 'Data Scientist',
        description: 'We are seeking a Data Scientist to help us extract insights from our data and build predictive models. The ideal candidate should have strong analytical skills and experience with machine learning.',
        requirements: ['Python', 'R', 'Machine Learning', 'SQL', 'Data Analysis', '3+ years experience', 'TensorFlow/PyTorch', 'Statistics'],
        status: 'active'
      },
      {
        title: 'Mobile Developer',
        description: 'Looking for a Mobile Developer to build and maintain our iOS and Android applications. The ideal candidate should have experience with native mobile development and cross-platform frameworks.',
        requirements: ['React Native', 'Swift', 'Kotlin', 'Mobile UI/UX', '3+ years experience', 'REST APIs', 'Mobile testing'],
        status: 'active'
      },
      {
        title: 'QA Engineer',
        description: 'We need a QA Engineer to ensure the quality of our software products. The role involves designing and implementing test plans, automating tests, and working closely with development teams.',
        requirements: ['Test Automation', 'Selenium', 'Jest', 'Cypress', '3+ years experience', 'API Testing', 'Performance Testing'],
        status: 'active'
      },
      {
        title: 'UI/UX Designer',
        description: 'Seeking a UI/UX Designer to create beautiful and intuitive user interfaces. The ideal candidate should have a strong portfolio and experience with modern design tools and methodologies.',
        requirements: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', '3+ years experience', 'Design Systems', 'Prototyping'],
        status: 'active'
      },
      {
        title: 'Product Manager',
        description: 'Looking for a Product Manager to drive the development of our products. The role involves gathering requirements, prioritizing features, and working with cross-functional teams.',
        requirements: ['Product Strategy', 'Agile/Scrum', 'User Stories', '3+ years experience', 'Data Analysis', 'Stakeholder Management'],
        status: 'active'
      },
      {
        title: 'Security Engineer',
        description: 'We are seeking a Security Engineer to help protect our systems and data. The ideal candidate should have experience with security tools, vulnerability assessment, and incident response.',
        requirements: ['Security Tools', 'Penetration Testing', 'Network Security', '3+ years experience', 'Security Compliance', 'Incident Response'],
        status: 'active'
      }
    ];

    // First, get existing positions
    const { data: existingPositions, error: fetchError } = await supabase
      .from('job_positions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Error fetching job positions:', fetchError);
      throw fetchError;
    }

    // If no positions exist, create initial ones
    if (!existingPositions || existingPositions.length === 0) {
      const { data: newPositions, error: insertError } = await supabase
        .from('job_positions')
        .insert(initialPositions)
        .select();

      if (insertError) {
        console.error('Error creating initial job positions:', insertError);
        throw insertError;
      }

      return newPositions;
    }

    // If positions exist but are less than expected, add missing ones
    const expectedTitles = [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'DevOps Engineer',
      'Data Scientist',
      'Mobile Developer',
      'QA Engineer',
      'UI/UX Designer',
      'Product Manager',
      'Security Engineer'
    ];

    const existingTitles = (existingPositions as unknown as JobPosition[]).map(p => p.title);
    const missingTitles = expectedTitles.filter(title => !existingTitles.includes(title));

    if (missingTitles.length > 0) {
      const missingPositions = initialPositions.filter(p => missingTitles.includes(p.title));
      
      const { data: addedPositions, error: addError } = await supabase
        .from('job_positions')
        .insert(missingPositions)
        .select();

      if (addError) {
        console.error('Error adding missing job positions:', addError);
        throw addError;
      }

      return [...existingPositions, ...(addedPositions || [])];
    }
    
    return existingPositions;
  } catch (error) {
    console.error('Error in getJobPositions:', error);
    throw error;
  }
};

export const createCandidate = async (name: string, email: string = '', phone: string = '') => {
  try {
    // Generate a unique email if none provided
    const candidateEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;
    
    // First check if a candidate with this email already exists
    const { data: existingCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', candidateEmail)
      .single();

    if (existingCandidate) {
      return existingCandidate;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert([
        {
          name,
          email: candidateEmail,
          phone,
          status: 'new'
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createCandidate:', error);
    throw error;
  }
};

export async function saveResumeAnalysis({
  candidate_name,
  file_name,
  job_description,
  analysis_results
}: {
  candidate_name: string;
  file_name: string;
  job_description: string;
  analysis_results: any;
}) {
  // First create a candidate record
  const candidate = await createCandidate(candidate_name);
  
  // Then save the resume analysis
  const { data, error } = await supabase
    .from('resume_analyses')
    .insert([
      {
        candidate_name,
        file_name,
        job_description,
        analysis_results,
        candidate_id: candidate.id // Link the analysis to the candidate
      }
    ]);
  if (error) throw error;
  return data;
}

export async function fetchRecentResumeAnalyses(limit = 10) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export const getResumeAnalysis = async (analysisId: string) => {
  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('id', analysisId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching resume analysis:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Analysis not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching resume analysis:', error);
    throw error;
  }
};