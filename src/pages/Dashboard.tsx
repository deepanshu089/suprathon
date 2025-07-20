import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchRecentResumeAnalyses, getCandidates, getJobPositions } from '../lib/supabase';
import Button from '../components/common/Button';
import { Upload, Users, Briefcase, FileText, UserCheck, UserX, Calendar, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    shortlisted: 0,
    rejected: 0,
    activePositions: 0,
  });
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load candidates
        const candidatesData = await getCandidates();
        setCandidates(candidatesData);
        
        // Load job positions
        const jobPositionsData = await getJobPositions();
        
        // Calculate stats
        setStats({
          totalCandidates: candidatesData.length,
          shortlisted: candidatesData.filter(c => c.status === 'shortlisted').length,
          rejected: candidatesData.filter(c => c.status === 'rejected').length,
          activePositions: jobPositionsData.filter(j => j.status === 'active').length,
        });

        // Load recent analyses
        const analysesData = await fetchRecentResumeAnalyses(10);
        setRecentAnalyses(analysesData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Generate activity data for the last 7 days
  const generateActivityData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Count analyses for this date
      const analysesCount = recentAnalyses.filter(analysis => {
        const analysisDate = new Date(analysis.created_at);
        return analysisDate.toDateString() === date.toDateString();
      }).length;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        analyses: analysesCount
      });
    }
    
    return data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/upload">
          <Button variant="primary" icon={<Upload size={16} />}>
            Upload New Resume
        </Button>
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
          </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <UserX className="h-6 w-6 text-red-600" />
          </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activePositions}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Briefcase className="h-6 w-6 text-purple-600" />
          </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Candidates Panel */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Candidates</h2>
            {candidates.length > 0 ? (
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.position}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.match_score ? `${Math.round(candidate.match_score)}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </div>
            </div>
          </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          // Handle shortlist
                        }}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => {
                          // Handle reject
                        }}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          // Handle schedule interview
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Schedule Interview
                      </button>
                    </div>
                </div>
              ))}
            </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No candidates found</p>
            )}
          </div>
        </div>
        
        {/* Recent Analyses */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Analyses</h2>
            {recentAnalyses.length > 0 ? (
          <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    to={`/analysis/${analysis.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{analysis.candidate_name}</h3>
                        <p className="text-sm text-gray-500">{analysis.file_name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {typeof analysis.analysis_results?.relevance === 'number'
                            ? `${Math.round(analysis.analysis_results.relevance)}%`
                            : typeof analysis.analysis_results?.matchScore === 'number'
                            ? `${Math.round(analysis.analysis_results.matchScore)}%`
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </div>
                </div>
                </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No analyses found</p>
            )}
          </div>
          </div>
          
        {/* Candidate Activity */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Candidate Activity</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={generateActivityData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: '#6b7280' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`${value} analyses`, 'Count']}
                  />
                  <Line
                    type="monotone"
                    dataKey="analyses"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500 text-center">
              Number of analyses performed over the last 7 days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
