import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, CheckCircle, Clock, X, User } from 'lucide-react';
import useAppStore from '../../store';
import { getCandidates } from '../../lib/supabase';
import Input from '../common/Input';
import Button from '../common/Button';

const CandidateList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const { 
    candidates, 
    filteredCandidates = [],
    setCandidates, 
    filterCandidates, 
    selectCandidate,
    setLoading 
  } = useAppStore();
  
  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await getCandidates();
        setCandidates(data || []);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCandidates();
  }, [setCandidates, setLoading]);
  
  useEffect(() => {
    if (candidates) {
      filterCandidates(selectedStatus || undefined, searchTerm || undefined);
    }
  }, [selectedStatus, searchTerm, filterCandidates, candidates]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
    setIsFilterOpen(false);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            New
          </span>
        );
      case 'screening':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Screening
          </span>
        );
      case 'shortlisted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Shortlisted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Input
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={handleSearch}
            icon={<Search className="h-5 w-5 text-gray-400" />}
            className="w-full sm:w-64"
          />
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              icon={<Filter className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {selectedStatus ? `Status: ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}` : 'Filter by Status'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleStatusChange(null)}
                >
                  All Candidates
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleStatusChange('new')}
                >
                  New
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleStatusChange('screening')}
                >
                  Screening
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleStatusChange('shortlisted')}
                >
                  Shortlisted
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleStatusChange('rejected')}
                >
                  Rejected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No candidates found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedStatus ? 'Try a different search or filter' : 'Start by adding candidates to the system'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-x-auto"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <motion.tr 
                  key={candidate.id}
                  variants={itemVariants}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectCandidate(candidate)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{candidate.email}</div>
                    {candidate.phone && (
                      <div className="text-sm text-gray-500">{candidate.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(candidate.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.score !== undefined && (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              candidate.score >= 80 ? 'bg-green-600' :
                              candidate.score >= 60 ? 'bg-blue-600' :
                              candidate.score >= 40 ? 'bg-yellow-500' : 'bg-red-600'
                            }`}
                            style={{ width: `${candidate.score}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">{candidate.score}%</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

export default CandidateList;