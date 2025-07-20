import { supabase } from '../lib/supabase';

interface SkillCategory {
  category: string;
  skills: string[];
  description: string;
}

interface LanguageSkill {
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic';
}

interface CategorizedSkills {
  technicalSkills: SkillCategory[];
  softSkills: SkillCategory[];
  languages: LanguageSkill[];
}

export const categorizeSkills = async (skills: string[]): Promise<CategorizedSkills> => {
  try {
    // Call the AI API to categorize skills
    const response = await fetch(import.meta.env.VITE_AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY}`
      },
      body: JSON.stringify({
        skills,
        task: 'categorize_skills',
        format: {
          technicalSkills: [
            {
              category: 'string',
              skills: ['string'],
              description: 'string'
            }
          ],
          softSkills: [
            {
              category: 'string',
              skills: ['string'],
              description: 'string'
            }
          ],
          languages: [
            {
              language: 'string',
              proficiency: 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic'
            }
          ]
        },
        categories: {
          technical: [
            'Frontend Development',
            'Backend Development',
            'Database & Data Management',
            'AI & Machine Learning',
            'DevOps & Cloud',
            'Mobile Development',
            'Security',
            'Testing & Quality Assurance',
            'Blockchain & Web3',
            'Game Development'
          ],
          soft: [
            'Communication & Interpersonal',
            'Leadership & Management',
            'Problem Solving & Critical Thinking',
            'Professional Development',
            'Business & Strategy',
            'Project Management',
            'Customer Service & Support',
            'Research & Analysis',
            'Creative & Design',
            'Language & Writing'
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to categorize skills');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error categorizing skills:', error);
    // Fallback to basic categorization if API fails
    return fallbackCategorization(skills);
  }
};

const fallbackCategorization = (skills: string[]): CategorizedSkills => {
  const technicalCategories: { [key: string]: string[] } = {};
  const softCategories: { [key: string]: string[] } = {};
  const languages: LanguageSkill[] = [];
  
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    // Check for language skills
    if (isLanguageSkill(skillLower)) {
      languages.push({
        language: skill,
        proficiency: determineLanguageProficiency(skillLower)
      });
      return;
    }

    // Categorize technical skills
    const techCategory = determineTechnicalCategory(skillLower);
    if (techCategory) {
      if (!technicalCategories[techCategory]) {
        technicalCategories[techCategory] = [];
      }
      technicalCategories[techCategory].push(skill);
      return;
    }

    // Categorize soft skills
    const softCategory = determineSoftCategory(skillLower);
    if (softCategory) {
      if (!softCategories[softCategory]) {
        softCategories[softCategory] = [];
      }
      softCategories[softCategory].push(skill);
      return;
    }
  });

  return {
    technicalSkills: Object.entries(technicalCategories).map(([category, skills]) => ({
      category,
      skills,
      description: getTechnicalCategoryDescription(category)
    })),
    softSkills: Object.entries(softCategories).map(([category, skills]) => ({
      category,
      skills,
      description: getSoftCategoryDescription(category)
    })),
    languages
  };
};

const isLanguageSkill = (skill: string): boolean => {
  const languageKeywords = [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese',
    'russian', 'chinese', 'japanese', 'korean', 'arabic', 'hindi',
    'language', 'fluent', 'native', 'bilingual', 'multilingual'
  ];
  return languageKeywords.some(keyword => skill.includes(keyword));
};

const determineLanguageProficiency = (skill: string): 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic' => {
  if (skill.includes('native') || skill.includes('bilingual')) return 'Native';
  if (skill.includes('fluent')) return 'Fluent';
  if (skill.includes('advanced')) return 'Advanced';
  if (skill.includes('intermediate')) return 'Intermediate';
  return 'Basic';
};

const determineTechnicalCategory = (skill: string): string | null => {
  const skillLower = skill.toLowerCase();
  
  // Soft Skills
  if (
    skillLower.includes('communication') ||
    skillLower.includes('leadership') ||
    skillLower.includes('teamwork') ||
    skillLower.includes('collaboration') ||
    skillLower.includes('problem solving') ||
    skillLower.includes('critical thinking') ||
    skillLower.includes('time management') ||
    skillLower.includes('adaptability') ||
    skillLower.includes('creativity') ||
    skillLower.includes('emotional intelligence') ||
    skillLower.includes('interpersonal skills') ||
    skillLower.includes('presentation skills') ||
    skillLower.includes('public speaking') ||
    skillLower.includes('negotiation') ||
    skillLower.includes('conflict resolution') ||
    skillLower.includes('decision making') ||
    skillLower.includes('strategic thinking') ||
    skillLower.includes('analytical thinking') ||
    skillLower.includes('attention to detail') ||
    skillLower.includes('organization') ||
    skillLower.includes('planning') ||
    skillLower.includes('prioritization') ||
    skillLower.includes('stress management') ||
    skillLower.includes('work ethic') ||
    skillLower.includes('initiative') ||
    skillLower.includes('self-motivation') ||
    skillLower.includes('mentoring') ||
    skillLower.includes('coaching') ||
    skillLower.includes('feedback') ||
    skillLower.includes('active listening') ||
    skillLower.includes('empathy') ||
    skillLower.includes('cultural awareness') ||
    skillLower.includes('diversity') ||
    skillLower.includes('inclusion') ||
    skillLower.includes('networking') ||
    skillLower.includes('relationship building') ||
    skillLower.includes('customer service') ||
    skillLower.includes('client management') ||
    skillLower.includes('stakeholder management') ||
    skillLower.includes('change management') ||
    skillLower.includes('risk management') ||
    skillLower.includes('crisis management') ||
    skillLower.includes('project management') ||
    skillLower.includes('team management') ||
    skillLower.includes('resource management') ||
    skillLower.includes('budget management') ||
    skillLower.includes('quality management') ||
    skillLower.includes('process improvement') ||
    skillLower.includes('continuous learning') ||
    skillLower.includes('professional development') ||
    skillLower.includes('mentoring') ||
    skillLower.includes('coaching') ||
    skillLower.includes('training') ||
    skillLower.includes('teaching') ||
    skillLower.includes('documentation') ||
    skillLower.includes('reporting') ||
    skillLower.includes('analysis') ||
    skillLower.includes('research') ||
    skillLower.includes('innovation') ||
    skillLower.includes('entrepreneurship') ||
    skillLower.includes('business acumen') ||
    skillLower.includes('strategic planning') ||
    skillLower.includes('market analysis') ||
    skillLower.includes('competitive analysis') ||
    skillLower.includes('business development') ||
    skillLower.includes('sales') ||
    skillLower.includes('marketing') ||
    skillLower.includes('branding') ||
    skillLower.includes('social media') ||
    skillLower.includes('content creation') ||
    skillLower.includes('copywriting') ||
    skillLower.includes('editing') ||
    skillLower.includes('proofreading') ||
    skillLower.includes('translation') ||
    skillLower.includes('localization') ||
    skillLower.includes('internationalization') ||
    skillLower.includes('cross-cultural communication') ||
    skillLower.includes('multilingual') ||
    skillLower.includes('language skills') ||
    skillLower.includes('writing') ||
    skillLower.includes('editing') ||
    skillLower.includes('proofreading') ||
    skillLower.includes('translation') ||
    skillLower.includes('localization') ||
    skillLower.includes('internationalization') ||
    skillLower.includes('cross-cultural communication') ||
    skillLower.includes('multilingual') ||
    skillLower.includes('language skills')
  ) {
    return 'Soft Skills & Professional Development';
  }

  // Frontend Technologies
  if (
    skillLower.includes('react') || 
    skillLower.includes('angular') || 
    skillLower.includes('vue') || 
    skillLower.includes('javascript') || 
    skillLower.includes('typescript') || 
    skillLower.includes('html') || 
    skillLower.includes('css') || 
    skillLower.includes('sass') || 
    skillLower.includes('less') || 
    skillLower.includes('frontend') || 
    skillLower.includes('ui') || 
    skillLower.includes('ux') ||
    skillLower.includes('webpack') ||
    skillLower.includes('babel') ||
    skillLower.includes('next.js') ||
    skillLower.includes('nuxt') ||
    skillLower.includes('tailwind') ||
    skillLower.includes('bootstrap') ||
    skillLower.includes('material-ui') ||
    skillLower.includes('styled-components') ||
    skillLower.includes('redux') ||
    skillLower.includes('mobx') ||
    skillLower.includes('jquery') ||
    skillLower.includes('d3.js') ||
    skillLower.includes('three.js') ||
    skillLower.includes('webgl') ||
    skillLower.includes('canvas') ||
    skillLower.includes('responsive design') ||
    skillLower.includes('progressive web app') ||
    skillLower.includes('pwa')
  ) {
    return 'Frontend Development';
  }

  // Backend Technologies
  if (
    skillLower.includes('node') || 
    skillLower.includes('express') || 
    skillLower.includes('django') || 
    skillLower.includes('flask') || 
    skillLower.includes('spring') || 
    skillLower.includes('backend') || 
    skillLower.includes('api') || 
    skillLower.includes('rest') || 
    skillLower.includes('graphql') || 
    skillLower.includes('server') ||
    skillLower.includes('microservices') ||
    skillLower.includes('fastapi') ||
    skillLower.includes('laravel') ||
    skillLower.includes('ruby on rails') ||
    skillLower.includes('asp.net') ||
    skillLower.includes('php') ||
    skillLower.includes('golang') ||
    skillLower.includes('rust') ||
    skillLower.includes('c#') ||
    skillLower.includes('java') ||
    skillLower.includes('python') ||
    skillLower.includes('websocket') ||
    skillLower.includes('grpc') ||
    skillLower.includes('serverless') ||
    skillLower.includes('lambda') ||
    skillLower.includes('middleware') ||
    skillLower.includes('authentication') ||
    skillLower.includes('authorization') ||
    skillLower.includes('jwt') ||
    skillLower.includes('oauth')
  ) {
    return 'Backend Development';
  }

  // Database & Data Management
  if (
    skillLower.includes('sql') || 
    skillLower.includes('mysql') || 
    skillLower.includes('postgresql') || 
    skillLower.includes('mongodb') || 
    skillLower.includes('redis') || 
    skillLower.includes('database') || 
    skillLower.includes('nosql') || 
    skillLower.includes('oracle') || 
    skillLower.includes('dynamodb') || 
    skillLower.includes('cassandra') ||
    skillLower.includes('elasticsearch') ||
    skillLower.includes('data modeling') ||
    skillLower.includes('etl') ||
    skillLower.includes('data warehouse') ||
    skillLower.includes('bigquery') ||
    skillLower.includes('snowflake') ||
    skillLower.includes('data lake') ||
    skillLower.includes('data pipeline') ||
    skillLower.includes('data governance') ||
    skillLower.includes('data quality') ||
    skillLower.includes('data migration') ||
    skillLower.includes('database optimization') ||
    skillLower.includes('database administration') ||
    skillLower.includes('database security') ||
    skillLower.includes('database backup') ||
    skillLower.includes('database replication')
  ) {
    return 'Database & Data Management';
  }

  // AI & Machine Learning
  if (
    skillLower.includes('ai') || 
    skillLower.includes('machine learning') || 
    skillLower.includes('ml') || 
    skillLower.includes('deep learning') || 
    skillLower.includes('tensorflow') || 
    skillLower.includes('pytorch') || 
    skillLower.includes('scikit-learn') || 
    skillLower.includes('neural networks') || 
    skillLower.includes('nlp') || 
    skillLower.includes('computer vision') ||
    skillLower.includes('data science') ||
    skillLower.includes('predictive modeling') ||
    skillLower.includes('reinforcement learning') ||
    skillLower.includes('natural language processing') ||
    skillLower.includes('computer vision') ||
    skillLower.includes('image processing') ||
    skillLower.includes('speech recognition') ||
    skillLower.includes('recommendation systems') ||
    skillLower.includes('time series analysis') ||
    skillLower.includes('clustering') ||
    skillLower.includes('classification') ||
    skillLower.includes('regression') ||
    skillLower.includes('feature engineering') ||
    skillLower.includes('model deployment') ||
    skillLower.includes('model optimization') ||
    skillLower.includes('transfer learning') ||
    skillLower.includes('generative ai') ||
    skillLower.includes('llm') ||
    skillLower.includes('large language models')
  ) {
    return 'AI & Machine Learning';
  }

  // DevOps & Cloud
  if (
    skillLower.includes('devops') || 
    skillLower.includes('aws') || 
    skillLower.includes('azure') || 
    skillLower.includes('gcp') || 
    skillLower.includes('docker') || 
    skillLower.includes('kubernetes') || 
    skillLower.includes('ci/cd') || 
    skillLower.includes('jenkins') || 
    skillLower.includes('terraform') || 
    skillLower.includes('cloud') ||
    skillLower.includes('ansible') ||
    skillLower.includes('puppet') ||
    skillLower.includes('chef') ||
    skillLower.includes('gitlab ci') ||
    skillLower.includes('github actions') ||
    skillLower.includes('circleci') ||
    skillLower.includes('travis ci') ||
    skillLower.includes('monitoring') ||
    skillLower.includes('logging') ||
    skillLower.includes('prometheus') ||
    skillLower.includes('grafana') ||
    skillLower.includes('elk stack') ||
    skillLower.includes('splunk') ||
    skillLower.includes('cloudformation') ||
    skillLower.includes('serverless') ||
    skillLower.includes('infrastructure as code') ||
    skillLower.includes('container orchestration') ||
    skillLower.includes('service mesh') ||
    skillLower.includes('istio') ||
    skillLower.includes('helm')
  ) {
    return 'DevOps & Cloud';
  }

  // Mobile Development
  if (
    skillLower.includes('android') || 
    skillLower.includes('ios') || 
    skillLower.includes('react native') || 
    skillLower.includes('flutter') || 
    skillLower.includes('mobile') || 
    skillLower.includes('swift') || 
    skillLower.includes('kotlin') || 
    skillLower.includes('xamarin') || 
    skillLower.includes('ionic') ||
    skillLower.includes('objective-c') ||
    skillLower.includes('mobile ui') ||
    skillLower.includes('mobile testing') ||
    skillLower.includes('mobile security') ||
    skillLower.includes('mobile performance') ||
    skillLower.includes('mobile analytics') ||
    skillLower.includes('mobile app architecture') ||
    skillLower.includes('mobile app deployment') ||
    skillLower.includes('mobile app maintenance') ||
    skillLower.includes('mobile app optimization') ||
    skillLower.includes('mobile app security')
  ) {
    return 'Mobile Development';
  }

  // Security
  if (
    skillLower.includes('security') || 
    skillLower.includes('cybersecurity') || 
    skillLower.includes('penetration testing') || 
    skillLower.includes('ethical hacking') || 
    skillLower.includes('security audit') || 
    skillLower.includes('vulnerability assessment') || 
    skillLower.includes('cryptography') ||
    skillLower.includes('network security') ||
    skillLower.includes('application security') ||
    skillLower.includes('cloud security') ||
    skillLower.includes('security compliance') ||
    skillLower.includes('security monitoring') ||
    skillLower.includes('security incident response') ||
    skillLower.includes('security architecture') ||
    skillLower.includes('security policy') ||
    skillLower.includes('security assessment') ||
    skillLower.includes('security testing') ||
    skillLower.includes('security tools') ||
    skillLower.includes('security automation') ||
    skillLower.includes('security operations')
  ) {
    return 'Security';
  }

  // Testing & Quality Assurance
  if (
    skillLower.includes('testing') || 
    skillLower.includes('qa') || 
    skillLower.includes('quality assurance') || 
    skillLower.includes('selenium') || 
    skillLower.includes('junit') || 
    skillLower.includes('test automation') || 
    skillLower.includes('performance testing') ||
    skillLower.includes('load testing') ||
    skillLower.includes('stress testing') ||
    skillLower.includes('security testing') ||
    skillLower.includes('api testing') ||
    skillLower.includes('integration testing') ||
    skillLower.includes('unit testing') ||
    skillLower.includes('end-to-end testing') ||
    skillLower.includes('test planning') ||
    skillLower.includes('test strategy') ||
    skillLower.includes('test management') ||
    skillLower.includes('test reporting') ||
    skillLower.includes('test metrics') ||
    skillLower.includes('test automation framework')
  ) {
    return 'Testing & Quality Assurance';
  }

  // Project Management & Soft Skills
  if (
    skillLower.includes('project management') || 
    skillLower.includes('agile') || 
    skillLower.includes('scrum') || 
    skillLower.includes('leadership') || 
    skillLower.includes('communication') || 
    skillLower.includes('team management') || 
    skillLower.includes('problem solving') ||
    skillLower.includes('stakeholder management') ||
    skillLower.includes('risk management') ||
    skillLower.includes('resource management') ||
    skillLower.includes('budget management') ||
    skillLower.includes('project planning') ||
    skillLower.includes('project execution') ||
    skillLower.includes('project monitoring') ||
    skillLower.includes('project control') ||
    skillLower.includes('project closure') ||
    skillLower.includes('project documentation') ||
    skillLower.includes('project reporting') ||
    skillLower.includes('project metrics') ||
    skillLower.includes('project governance')
  ) {
    return 'Project Management & Soft Skills';
  }

  // Blockchain & Web3
  if (
    skillLower.includes('blockchain') ||
    skillLower.includes('web3') ||
    skillLower.includes('ethereum') ||
    skillLower.includes('solidity') ||
    skillLower.includes('smart contracts') ||
    skillLower.includes('defi') ||
    skillLower.includes('nft') ||
    skillLower.includes('cryptocurrency') ||
    skillLower.includes('distributed ledger') ||
    skillLower.includes('consensus mechanisms') ||
    skillLower.includes('tokenization') ||
    skillLower.includes('blockchain security') ||
    skillLower.includes('blockchain development') ||
    skillLower.includes('blockchain architecture') ||
    skillLower.includes('blockchain integration')
  ) {
    return 'Blockchain & Web3';
  }

  // Game Development
  if (
    skillLower.includes('game development') ||
    skillLower.includes('unity') ||
    skillLower.includes('unreal engine') ||
    skillLower.includes('game design') ||
    skillLower.includes('game programming') ||
    skillLower.includes('game physics') ||
    skillLower.includes('game animation') ||
    skillLower.includes('game audio') ||
    skillLower.includes('game testing') ||
    skillLower.includes('game optimization') ||
    skillLower.includes('game networking') ||
    skillLower.includes('game ai') ||
    skillLower.includes('game graphics') ||
    skillLower.includes('game engine') ||
    skillLower.includes('game development tools')
  ) {
    return 'Game Development';
  }
  
  return 'Other Technical Skills';
};

const determineSoftCategory = (skill: string): string | null => {
  const skillLower = skill.toLowerCase();
  
  // Soft Skills
  if (
    skillLower.includes('communication') ||
    skillLower.includes('leadership') ||
    skillLower.includes('teamwork') ||
    skillLower.includes('collaboration') ||
    skillLower.includes('problem solving') ||
    skillLower.includes('critical thinking') ||
    skillLower.includes('time management') ||
    skillLower.includes('adaptability') ||
    skillLower.includes('creativity') ||
    skillLower.includes('emotional intelligence') ||
    skillLower.includes('interpersonal skills') ||
    skillLower.includes('presentation skills') ||
    skillLower.includes('public speaking') ||
    skillLower.includes('negotiation') ||
    skillLower.includes('conflict resolution') ||
    skillLower.includes('decision making') ||
    skillLower.includes('strategic thinking') ||
    skillLower.includes('analytical thinking') ||
    skillLower.includes('attention to detail') ||
    skillLower.includes('organization') ||
    skillLower.includes('planning') ||
    skillLower.includes('prioritization') ||
    skillLower.includes('stress management') ||
    skillLower.includes('work ethic') ||
    skillLower.includes('initiative') ||
    skillLower.includes('self-motivation') ||
    skillLower.includes('mentoring') ||
    skillLower.includes('coaching') ||
    skillLower.includes('feedback') ||
    skillLower.includes('active listening') ||
    skillLower.includes('empathy') ||
    skillLower.includes('cultural awareness') ||
    skillLower.includes('diversity') ||
    skillLower.includes('inclusion') ||
    skillLower.includes('networking') ||
    skillLower.includes('relationship building') ||
    skillLower.includes('customer service') ||
    skillLower.includes('client management') ||
    skillLower.includes('stakeholder management') ||
    skillLower.includes('change management') ||
    skillLower.includes('risk management') ||
    skillLower.includes('crisis management') ||
    skillLower.includes('project management') ||
    skillLower.includes('team management') ||
    skillLower.includes('resource management') ||
    skillLower.includes('budget management') ||
    skillLower.includes('quality management') ||
    skillLower.includes('process improvement') ||
    skillLower.includes('continuous learning') ||
    skillLower.includes('professional development') ||
    skillLower.includes('mentoring') ||
    skillLower.includes('coaching') ||
    skillLower.includes('training') ||
    skillLower.includes('teaching') ||
    skillLower.includes('documentation') ||
    skillLower.includes('reporting') ||
    skillLower.includes('analysis') ||
    skillLower.includes('research') ||
    skillLower.includes('innovation') ||
    skillLower.includes('entrepreneurship') ||
    skillLower.includes('business acumen') ||
    skillLower.includes('strategic planning') ||
    skillLower.includes('market analysis') ||
    skillLower.includes('competitive analysis') ||
    skillLower.includes('business development') ||
    skillLower.includes('sales') ||
    skillLower.includes('marketing') ||
    skillLower.includes('branding') ||
    skillLower.includes('social media') ||
    skillLower.includes('content creation') ||
    skillLower.includes('copywriting') ||
    skillLower.includes('editing') ||
    skillLower.includes('proofreading') ||
    skillLower.includes('translation') ||
    skillLower.includes('localization') ||
    skillLower.includes('internationalization') ||
    skillLower.includes('cross-cultural communication') ||
    skillLower.includes('multilingual') ||
    skillLower.includes('language skills') ||
    skillLower.includes('writing') ||
    skillLower.includes('editing') ||
    skillLower.includes('proofreading') ||
    skillLower.includes('translation') ||
    skillLower.includes('localization') ||
    skillLower.includes('internationalization') ||
    skillLower.includes('cross-cultural communication') ||
    skillLower.includes('multilingual') ||
    skillLower.includes('language skills')
  ) {
    return 'Soft Skills & Professional Development';
  }

  return null;
};

const getTechnicalCategoryDescription = (category: string): string => {
  const descriptions: { [key: string]: string } = {
    'Frontend Development': 'Web interface development, UI/UX implementation, and client-side technologies',
    'Backend Development': 'Server-side programming, API development, and business logic implementation',
    'Database & Data Management': 'Database design, data modeling, ETL processes, and data governance',
    'AI & Machine Learning': 'Artificial intelligence, machine learning models, and data science applications',
    'DevOps & Cloud': 'Cloud infrastructure, deployment automation, and infrastructure as code',
    'Mobile Development': 'Mobile application development across various platforms and frameworks',
    'Security': 'Cybersecurity, application security, and security operations',
    'Testing & Quality Assurance': 'Software testing, quality control, and test automation',
    'Blockchain & Web3': 'Blockchain development, smart contracts, and decentralized applications',
    'Game Development': 'Game design, development, and interactive entertainment systems'
  };
  return descriptions[category] || 'Technical skills and expertise';
};

const getSoftCategoryDescription = (category: string): string => {
  const descriptions: { [key: string]: string } = {
    'Communication & Interpersonal': 'Verbal and written communication, relationship building, and interpersonal skills',
    'Leadership & Management': 'Team leadership, decision-making, and organizational management capabilities',
    'Problem Solving & Critical Thinking': 'Analytical thinking, problem-solving, and strategic decision-making',
    'Professional Development': 'Continuous learning, career growth, and professional skill enhancement',
    'Business & Strategy': 'Business acumen, strategic planning, and market analysis',
    'Project Management': 'Project planning, execution, and team coordination',
    'Customer Service & Support': 'Client relationship management and customer support expertise',
    'Research & Analysis': 'Data analysis, research methodologies, and analytical reporting',
    'Creative & Design': 'Creative thinking, design principles, and artistic capabilities',
    'Language & Writing': 'Written communication, documentation, and language proficiency'
  };
  return descriptions[category] || 'Professional and interpersonal skills';
};

export const getSkillCategoriesForAnalysis = async (analysisId: string): Promise<CategorizedSkills> => {
  try {
    const { data: analysis, error } = await supabase
      .from('resume_analyses')
      .select('analysis_results')
      .eq('id', analysisId)
      .single();

    if (error) throw error;

    const skills = analysis.analysis_results.skills || [];
    return await categorizeSkills(skills);
  } catch (error) {
    console.error('Error getting skill categories:', error);
    throw error;
  }
}; 