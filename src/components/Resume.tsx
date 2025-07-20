import React, { useState } from 'react';
import { Box, Button, Text, VStack, Progress, List, ListItem, useToast } from '@chakra-ui/react';

interface AnalysisResult {
  summary?: string;
  skills: string[];
  relevance: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  suggestedQuestions: string[];
}

const Resume: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const toast = useToast();

  const detectSkills = (text: string): string[] => {
    try {
      // Clean and normalize the text
      let cleanedText = text
        .replace(/\s+/g, ' ')
        .trim();

      // Define skills with their variations
      const skills = [
        { name: 'JavaScript', patterns: ['javascript', 'js', 'ecmascript'] },
        { name: 'TypeScript', patterns: ['typescript', 'ts'] },
        { name: 'React', patterns: ['react', 'reactjs', 'react.js'] },
        { name: 'Node.js', patterns: ['node', 'nodejs', 'node.js'] },
        { name: 'Python', patterns: ['python', 'py'] },
        { name: 'Java', patterns: ['java', 'j2ee', 'j2se'] },
        { name: 'C#', patterns: ['c#', 'csharp', 'dotnet', '.net'] },
        { name: 'C++', patterns: ['cpp', 'c plus plus'] },  // Changed to avoid regex issues
        { name: 'SQL', patterns: ['sql', 'mysql', 'postgresql', 'oracle'] },
        { name: 'MongoDB', patterns: ['mongodb', 'mongo'] },
        { name: 'AWS', patterns: ['aws', 'amazon web services'] },
        { name: 'Docker', patterns: ['docker', 'container'] },
        { name: 'Kubernetes', patterns: ['kubernetes', 'k8s'] },
        { name: 'Git', patterns: ['git', 'github', 'gitlab'] },
        { name: 'CI/CD', patterns: ['ci/cd', 'continuous integration', 'continuous deployment'] },
        { name: 'Agile', patterns: ['agile', 'scrum', 'kanban'] },
        { name: 'REST API', patterns: ['rest', 'restful', 'api'] },
        { name: 'GraphQL', patterns: ['graphql', 'gql'] },
        { name: 'HTML', patterns: ['html', 'html5'] },
        { name: 'CSS', patterns: ['css', 'css3', 'sass', 'scss'] },
        { name: 'Redux', patterns: ['redux', 'redux toolkit'] },
        { name: 'Next.js', patterns: ['next', 'nextjs', 'next.js'] },
        { name: 'Vue.js', patterns: ['vue', 'vuejs', 'vue.js'] },
        { name: 'Angular', patterns: ['angular', 'angularjs'] },
        { name: 'Express.js', patterns: ['express', 'expressjs', 'express.js'] },
        { name: 'Django', patterns: ['django', 'python web'] },
        { name: 'Flask', patterns: ['flask', 'python flask'] },
        { name: 'Spring', patterns: ['spring', 'spring boot', 'spring framework'] },
        { name: 'TensorFlow', patterns: ['tensorflow', 'tf'] },
        { name: 'PyTorch', patterns: ['pytorch', 'torch'] },
        { name: 'Machine Learning', patterns: ['machine learning', 'ml', 'ai'] },
        { name: 'Data Science', patterns: ['data science', 'data analysis'] },
        { name: 'DevOps', patterns: ['devops', 'dev ops'] },
        { name: 'Linux', patterns: ['linux', 'unix'] },
        { name: 'Shell Scripting', patterns: ['shell', 'bash', 'shell script'] },
        { name: 'Microservices', patterns: ['microservices', 'micro service'] },
        { name: 'Serverless', patterns: ['serverless', 'lambda', 'azure functions'] },
        { name: 'WebSocket', patterns: ['websocket', 'socket.io'] },
        { name: 'WebRTC', patterns: ['webrtc', 'real-time communication'] },
        { name: 'PWA', patterns: ['pwa', 'progressive web app'] },
        { name: 'Testing', patterns: ['testing', 'jest', 'mocha', 'cypress', 'selenium'] }
      ];

      // Find skills in the text using simple string matching
      const foundSkills = new Set<string>();
      skills.forEach(skill => {
        skill.patterns.forEach(pattern => {
          if (cleanedText.toLowerCase().includes(pattern.toLowerCase())) {
            foundSkills.add(skill.name);
          }
        });
      });

      return Array.from(foundSkills);
    } catch (error) {
      console.warn('Error detecting skills:', error);
      return [];
    }
  };

  const handleAnalyzeResume = async (text: string) => {
    try {
      setIsAnalyzing(true);
      
      // First, detect skills using our local function
      const detectedSkills = detectSkills(text);

      // Then, get the AI analysis
      const aiAnalysis = await analyzeResumeWithHF(text, ''); // You'll need to pass the job description here

      // Combine the results
      const result: AnalysisResult = {
        summary: aiAnalysis.summary,
        skills: detectedSkills,
        relevance: aiAnalysis.relevance,
        strengths: aiAnalysis.strengths,
        weaknesses: aiAnalysis.weaknesses,
        recommendations: aiAnalysis.recommendations,
        suggestedQuestions: aiAnalysis.suggestedQuestions
      };

      setAnalysisResult(result);
      return result;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze resume. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await handleAnalyzeResume(text);
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to read file. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="resume-upload"
        />
        <Button
          as="label"
          htmlFor="resume-upload"
          colorScheme="blue"
          isLoading={isAnalyzing}
          loadingText="Analyzing..."
        >
          Upload Resume
        </Button>

        {analysisResult && (
          <Box borderWidth={1} borderRadius="lg" p={4}>
            <VStack spacing={4} align="stretch">
              {analysisResult.summary && (
                <Box>
                  <Text fontWeight="bold">Summary</Text>
                  <Text>{analysisResult.summary}</Text>
                </Box>
              )}

              <Box>
                <Text fontWeight="bold">Match Score</Text>
                <Progress value={analysisResult.relevance} colorScheme="green" />
                <Text>{analysisResult.relevance}%</Text>
              </Box>

              <Box>
                <Text fontWeight="bold">Skills Found</Text>
                <List>
                  {analysisResult.skills.map((skill, index) => (
                    <ListItem key={index}>{skill}</ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Text fontWeight="bold">Strengths</Text>
                <List>
                  {analysisResult.strengths.map((strength, index) => (
                    <ListItem key={index}>{strength}</ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Text fontWeight="bold">Areas for Improvement</Text>
                <List>
                  {analysisResult.weaknesses.slice(0, 3).map((weakness, index) => (
                    <ListItem key={index}>{weakness}</ListItem>
                  ))}
                </List>
              </Box>

              <Box>
                <Text fontWeight="bold">Recommendations</Text>
                <Text>{analysisResult.recommendations}</Text>
              </Box>

              <Box>
                <Text fontWeight="bold">Suggested Interview Questions</Text>
                <List>
                  {analysisResult.suggestedQuestions.map((question, index) => (
                    <ListItem key={index}>{question}</ListItem>
                  ))}
                </List>
              </Box>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Resume; 