import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, FileText, Briefcase, GraduationCap, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import useAppStore from '../../store';
import { handleHFChatbotInteraction } from '../../lib/openai';
import { saveChatMessage, getCandidateById } from '../../lib/supabase';
import Button from '../common/Button';

interface ChatInterfaceProps {
  candidateId?: string;
  jobId?: string;
  isVoiceEnabled?: boolean;
  initialContext?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  candidateId,
  jobId,
  isVoiceEnabled = false,
  initialContext,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { chatMessages, addChatMessage, selectedCandidate, selectedJob } = useAppStore();
  
  useEffect(() => {
    const fetchCandidateDetails = async () => {
      if (candidateId) {
        try {
          console.log('Fetching candidate details for ID:', candidateId);
          const details = await getCandidateById(candidateId);
          console.log('Received candidate details:', details);
          setCandidateDetails(details);
        } catch (error) {
          console.error('Error fetching candidate details:', error);
          setError('Failed to load candidate details. Please try again.');
        }
      }
    };
    fetchCandidateDetails();
  }, [candidateId]);

  // Update scroll behavior
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isBotTyping]);

  // Scroll on initial load
  useEffect(() => {
    scrollToBottom();
  }, []);

  const getCandidateContext = () => {
    // If initialContext is provided, use it
    if (initialContext) {
      return initialContext;
    }

    if (!candidateDetails) {
      console.log('No candidate details available');
      return '';
    }
    
    console.log('Building context with candidate details:', candidateDetails);
    
    let context = `Candidate Profile:\n`;
    context += `Name: ${candidateDetails.name}\n`;
    context += `Email: ${candidateDetails.email}\n`;
    context += `Phone: ${candidateDetails.phone}\n`;
    context += `Status: ${candidateDetails.status}\n`;
    context += `Created: ${new Date(candidateDetails.created_at).toLocaleDateString()}\n\n`;

    // Resume Analysis Details
    if (candidateDetails.resume_analyses && candidateDetails.resume_analyses.length > 0) {
      console.log('Processing resume analyses:', candidateDetails.resume_analyses);
      const latestResume = candidateDetails.resume_analyses[0];
      if (latestResume.analysis_results) {
        context += `Latest Resume Analysis (${new Date(latestResume.created_at).toLocaleDateString()}):\n`;
        context += `File: ${latestResume.file_name}\n`;
        context += `Match Score: ${latestResume.analysis_results.relevance}%\n\n`;

        // Skills and Expertise
        if (latestResume.analysis_results.skills?.length > 0) {
          context += `Technical Skills:\n`;
          latestResume.analysis_results.skills.forEach((skill: string) => {
            context += `- ${skill}\n`;
          });
          context += '\n';
        }

        // Strengths
        if (latestResume.analysis_results.strengths?.length > 0) {
          context += `Key Strengths:\n`;
          latestResume.analysis_results.strengths.forEach((strength: string) => {
            context += `- ${strength}\n`;
          });
          context += '\n';
        }

        // Weaknesses/Areas for Improvement
        if (latestResume.analysis_results.weaknesses?.length > 0) {
          context += `Areas for Improvement:\n`;
          latestResume.analysis_results.weaknesses.forEach((weakness: string) => {
            context += `- ${weakness}\n`;
          });
          context += '\n';
        }

        // Red Flags
        if (latestResume.analysis_results.redFlags?.length > 0) {
          context += `Potential Concerns:\n`;
          latestResume.analysis_results.redFlags.forEach((flag: string) => {
            context += `- ${flag}\n`;
          });
          context += '\n';
        }

        // Summary
        if (latestResume.analysis_results.summary) {
          context += `Professional Summary:\n${latestResume.analysis_results.summary}\n\n`;
        }

        // Recommendations
        if (latestResume.analysis_results.recommendations) {
          context += `Recommendations:\n${latestResume.analysis_results.recommendations}\n\n`;
        }

        // Suggested Questions
        if (latestResume.analysis_results.suggestedQuestions?.length > 0) {
          context += `Suggested Interview Questions:\n`;
          latestResume.analysis_results.suggestedQuestions.forEach((question: string) => {
            context += `- ${question}\n`;
          });
          context += '\n';
        }
      }
    } else {
      console.log('No resume analyses found');
    }

    // Job Position Details
    if (selectedJob) {
      console.log('Adding job position details:', selectedJob);
      context += `Current Job Position:\n`;
      context += `Title: ${selectedJob.title}\n`;
      if (selectedJob.description) {
        context += `Description: ${selectedJob.description}\n`;
      }
      if (selectedJob.requirements?.length > 0) {
        context += `Requirements:\n`;
        selectedJob.requirements.forEach((req: string) => {
          context += `- ${req}\n`;
        });
      }
      context += '\n';
    }

    // Chat History Context
    if (candidateDetails.chat_messages?.length > 0) {
      console.log('Adding chat history:', candidateDetails.chat_messages);
      context += `Previous Chat History:\n`;
      candidateDetails.chat_messages.forEach((msg: any) => {
        context += `${msg.sender === 'user' ? 'Recruiter' : 'Assistant'}: ${msg.content}\n`;
      });
      context += '\n';
    }

    console.log('Final context:', context);
    return context;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;
    
    const userMessage = {
      id: Date.now().toString(),
      session_id: candidateId || 'default-session',
      sender: 'user' as const,
      content: message,
      created_at: new Date().toISOString(),
    };
    
    console.log('Sending message:', userMessage);
    
    // Add user message to chat
    addChatMessage(userMessage);
    setMessage('');
    setIsSending(true);
    setIsBotTyping(true);
    
    try {
      // Save user message to database
      await saveChatMessage(userMessage.session_id, {
        sender: userMessage.sender,
        content: userMessage.content,
        session_id: userMessage.session_id,
      });
      
      // Format message history for Hugging Face
      const messageHistory = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add candidate context to the first message
      const context = getCandidateContext();
      console.log('Generated context:', context);
      
      if (messageHistory.length === 0) {
        const systemMessage = {
          role: 'system',
          content: `You are a recruitment assistant with access to detailed candidate information. Use this information to provide accurate and helpful responses:\n\n${context}\n\nGuidelines for responses:\n1. Base all answers on the provided candidate information\n2. Be specific and detailed in your responses\n3. Highlight relevant skills and experiences\n4. Address any concerns or areas for improvement\n5. Provide actionable insights for the recruiter\n6. Maintain a professional and objective tone\n7. If information is not available, clearly state that\n8. Use the chat history to maintain context of the conversation`
        };
        console.log('Adding system message:', systemMessage);
        messageHistory.push(systemMessage);
      }
      
      console.log('Sending to Hugging Face:', {
        messageHistory,
        currentMessage: message,
        candidate: candidateDetails,
        job: selectedJob
      });
      
      // Get response from Hugging Face
      const responseText = await handleHFChatbotInteraction(
        messageHistory,
        message,
        candidateDetails,
        selectedJob || null
      );
      
      console.log('Received response from Hugging Face:', responseText);
      
      // Create bot response message
      const botMessage = {
        id: (Date.now() + 1).toString(),
        session_id: candidateId || 'default-session',
        sender: 'bot' as const,
        content: responseText,
        created_at: new Date().toISOString(),
      };
      
      // Add bot message to chat
      addChatMessage(botMessage);
      
      // Save bot message to database
      await saveChatMessage(botMessage.session_id, {
        sender: botMessage.sender,
        content: botMessage.content,
        session_id: botMessage.session_id,
      });
    } catch (error) {
      console.error('Error in chat interaction:', error);
      
      // Add error message with more specific guidance
      let errorMessage = "Sorry, I'm having trouble processing your request. ";
      
      if (error instanceof Error) {
        console.error('Error details:', error);
        if (error.message.includes('quota')) {
          errorMessage = "Your OpenRouter API quota has been exceeded. Please check your OpenRouter dashboard billing details.";
        } else if (error.message.includes('Rate limit')) {
          errorMessage = "OpenRouter API rate limit exceeded. Please wait a moment before trying again.";
        } else if (error.message.includes('API key')) {
          errorMessage = "Please check your OpenRouter API key in the code.";
        } else if (error.message.includes('Not Found')) {
          errorMessage = "The OpenRouter API endpoint could not be found. Please check your API configuration.";
        } else if (error.message.includes('model')) {
          errorMessage = "The requested model is not available. Please check your model configuration.";
        }
      }
      
      addChatMessage({
        id: (Date.now() + 1).toString(),
        session_id: candidateId || 'default-session',
        sender: 'bot' as const,
        content: errorMessage,
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
      setIsBotTyping(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-900 text-white p-4">
        <h2 className="text-xl font-semibold">RecruitAI Assistant</h2>
        <p className="text-sm text-blue-100">
          {selectedCandidate ? `Interviewing: ${selectedCandidate.name}` : 'Interactive Screening Chat'}
        </p>
      </div>

      {/* Candidate Details Summary */}
      {candidateDetails && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900">{candidateDetails.name}</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {candidateDetails.resume_analyses?.[0]?.analysis_results?.skills?.slice(0, 3).map((skill: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            {candidateDetails.resume_analyses?.[0]?.analysis_results && (
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-gray-900">
                  Match Score: {candidateDetails.resume_analyses[0].analysis_results.relevance}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {/* Welcome message if chat is empty */}
        {chatMessages.length === 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-blue-800 font-medium">Welcome to RecruitAI!</p>
            <p className="text-blue-600 text-sm mt-1">
              I'm here to help you evaluate this candidate. You can ask me about:
            </p>
            <ul className="text-blue-600 text-sm mt-2 list-disc list-inside">
              <li>Candidate's skills and experience</li>
              <li>Match with the job requirements</li>
              <li>Suggested interview questions</li>
              <li>Areas for further exploration</li>
            </ul>
          </div>
        )}
        
        {/* Chat messages */}
        <AnimatePresence>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-3 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="flex items-center mb-1">
                  {msg.sender === 'bot' ? (
                    <Bot size={16} className="mr-1 text-teal-600" />
                  ) : (
                    <User size={16} className="mr-1 text-white" />
                  )}
                  <span className={`text-xs ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Bot typing indicator */}
        {isBotTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center text-gray-500 text-sm"
          >
            <Bot size={16} className="mr-2 text-teal-600" />
            <span>RecruitAI is typing</span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              ...
            </motion.span>
          </motion.div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about the candidate's qualifications, experience, or fit for the role..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={isSending || !message.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;