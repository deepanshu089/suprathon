

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

export const generateChatResponse = async (
  messages: OpenAIMessage[],
  apiKey: string
): Promise<string> => {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const payload: ChatCompletionRequest = {
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling OpenAI API');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

export const analyzeResume = async (
  resumeText: string,
  jobDescription: string,
  apiKey: string
): Promise<{
  skills: string[];
  relevance: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}> => {
  try {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are an expert AI recruitment assistant. Analyze the resume against the job description and provide:\n1. A list of identified skills\n2. A relevance score from 0-100\n3. Key strengths of the candidate\n4. Potential weaknesses or missing qualifications\n5. Recommendations for interview questions or next steps`,
      },
      {
        role: 'user',
        content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}`,
      },
    ];

    const responseText = await generateChatResponse(messages, apiKey);
    // This is simplified - in a real app you'd do more structured parsing
    // of the AI response to extract specific sections
    const skills = responseText.includes('Skills:') 
      ? responseText.split('Skills:')[1].split('\n')[0].split(',').map(s => s.trim()) 
      : [];
    const relevance = parseInt(responseText.match(/relevance score.*?(\d+)/i)?.[1] || '0', 10);
    const strengths = responseText.includes('Strengths:')
      ? responseText.split('Strengths:')[1].split('Weaknesses:')[0].split('\n').filter(Boolean).map(s => s.trim())
      : [];
    const weaknesses = responseText.includes('Weaknesses:')
      ? responseText.split('Weaknesses:')[1].split('Recommendations:')[0].split('\n').filter(Boolean).map(s => s.trim())
      : [];
    const recommendations = responseText.includes('Recommendations:')
      ? responseText.split('Recommendations:')[1].trim()
      : '';
    return { skills, relevance, strengths, weaknesses, recommendations };
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
};

export const handleChatbotInteraction = async (
  previousMessages: OpenAIMessage[],
  newUserMessage: string,
  candidateInfo: any,
  jobDetails: any,
  apiKey: string
): Promise<string> => {
  try {
    const systemPrompt = `You are an AI recruitment assistant helping a recruiter to access the data and select the most desired person for a role.\n${jobDetails ? `Job: ${jobDetails.title}\nRequirements: ${jobDetails.requirements?.join(', ')}` : 'No specific job selected.'}\nYour goal is to assess the candidatate's potential and according to the job role help the recruiter through the chatbot to access the details of the resume in a professional way.`;
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...previousMessages,
      { role: 'user', content: newUserMessage }
    ];
    return await generateChatResponse(messages, apiKey);
  } catch (error) {
    console.error('Error in chatbot interaction:', error);
    return "I'm sorry, I'm having trouble processing your response right now. Please try again later.";
  }
};

// HUGGINGFACE API INTEGRATION
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

// HuggingFace model configuration
const HUGGINGFACE_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';

// HuggingFace chat completion
export const generateHFChatResponse = async (messages: {role: string, content: string}[]): Promise<string> => {
  try {
    const url = `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: messages.map(m => m.content).join('\n'),
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.2,
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error calling HuggingFace API');
    }

    const data = await response.json();
    return data.generated_text || '';
  } catch (error) {
    console.error('Error generating HuggingFace chat response:', error);
    throw error;
  }
};

// Resume analysis with OpenRouter
export const analyzeResumeWithHF = async (resumeText: string, jobDescription: string) => {
  try {
    const prompt = `You are an expert HR professional and technical recruiter. Your task is to analyze a candidate's resume against a specific job role and description.

Job Role and Description:
${jobDescription}

Resume:
${resumeText}

Please provide a detailed analysis in the following JSON format:
{
  "overall_match": {
    "score": number (0-100),
    "summary": "Brief summary of overall fit",
    "strengths": ["List of key strengths that match the role"],
    "gaps": ["List of potential gaps or missing requirements"]
  },
  "skills_analysis": {
    "matching_skills": ["Skills from resume that match job requirements"],
    "missing_skills": ["Required skills not found in resume"],
    "additional_skills": ["Notable skills in resume beyond requirements"]
  },
  "experience_analysis": {
    "relevant_experience": ["Key relevant experience points"],
    "experience_gaps": ["Areas where experience might be lacking"],
    "years_of_experience": number
  },
  "technical_fit": {
    "matching_technologies": ["Technologies from resume that match requirements"],
    "missing_technologies": ["Required technologies not found in resume"],
    "additional_technologies": ["Notable technologies in resume beyond requirements"]
  },
  "recommendations": {
    "interview_focus": ["Areas to focus on during interview"],
    "development_areas": ["Areas where candidate could improve"],
    "risk_factors": ["Potential concerns or red flags"]
  },
  "interview_questions": [
    {
      "question": "Technical question to assess skills",
      "purpose": "What this question aims to evaluate"
    },
    {
      "question": "Behavioral question to assess experience",
      "purpose": "What this question aims to evaluate"
    },
    {
      "question": "Problem-solving question",
      "purpose": "What this question aims to evaluate"
    }
  ]
}

Focus on:
1. Technical skills and technologies required for the role
2. Relevant experience and projects
3. Years of experience in key areas
4. Specific achievements that demonstrate capability
5. Potential gaps that need to be addressed in the interview
6. Customized interview questions based on the candidate's background

Provide a thorough analysis that helps in making an informed hiring decision.`;

    console.log('Sending request to OpenRouter API...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Recruitment Platform'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert HR professional and technical recruiter. Respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Received response from OpenRouter API');
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('Invalid response format from OpenRouter API:', result);
      throw new Error('Invalid response format from OpenRouter API');
    }

    // Extract the content and clean it
    let content = result.choices[0].message.content;
    
    // Remove any markdown code block indicators
    content = content.replace(/```json\n?|\n?```/g, '');
    
    // Try to parse the response as JSON
    try {
      const analysis = JSON.parse(content);
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
};

// Chatbot interaction with Hugging Face
export const handleHFChatbotInteraction = async (
  messageHistory: { role: string; content: string }[],
  currentMessage: string,
  candidate: any,
  job: any
) => {
  try {
    console.log('Starting Hugging Face interaction with:', {
      messageHistory,
      currentMessage,
      candidate,
      job
    });

    // Create system message based on whether we have candidate data
    let systemMessage = '';
    if (candidate) {
      systemMessage = `You are an AI recruitment assistant with access to candidate data. Be concise and direct in your responses.

      CANDIDATE DATA:
      - Name: ${candidate.name}
      - Email: ${candidate.email}
      - Phone: ${candidate.phone || 'Not provided'}
      - Status: ${candidate.status}
      - Created: ${new Date(candidate.created_at).toLocaleDateString()}
      
      ${job ? `JOB CONTEXT:
      - Title: ${job.title}
      - Requirements: ${job.requirements?.join(', ')}
      - Responsibilities: ${job.responsibilities?.join(', ')}
      - Required Skills: ${job.requiredSkills?.join(', ')}
      - Preferred Skills: ${job.preferredSkills?.join(', ')}` : ''}
      
      RESPONSE GUIDELINES:
      1. Answer ONLY what is asked - be direct and concise
      2. Use bullet points for lists
      3. Keep responses under 3-4 sentences unless more detail is specifically requested
      4. If asked about specific data, provide only that data
      5. No need to explain what you're doing - just answer the question
      6. If asked about resume analysis, skills, or match score, respond with "No resume analysis available for this candidate"
      
      IMPORTANT: Be brief and to the point. Don't add unnecessary explanations or context unless specifically asked.`;
    } else {
      systemMessage = `You are an AI recruitment assistant. Be concise and direct in your responses.
      
      RESPONSE GUIDELINES:
      1. Answer ONLY what is asked
      2. Keep responses brief and to the point
      3. Use bullet points for lists
      4. No need for lengthy explanations
      5. Focus on practical, actionable information`;
    }

    // Add the current message to the history
    const updatedHistory = [
      { role: 'system', content: systemMessage },
      ...messageHistory,
      { role: 'user', content: currentMessage }
    ];

    // Format the messages for the API
    const messages = updatedHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('Formatted messages for API:', messages);

    // Make the API call
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RecruitAI'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500  // Reduced from 1000 to encourage shorter responses
      })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    console.log('API Response data:', data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const responseText = data.choices[0].message.content;
    console.log('Extracted response text:', responseText);

    return responseText;
  } catch (error) {
    console.error('Error in handleHFChatbotInteraction:', error);
    throw error;
  }
};

/*
// =====================
// OPENAI CODE (commented out)
// =====================
// ... existing OpenAI code here ...
*/