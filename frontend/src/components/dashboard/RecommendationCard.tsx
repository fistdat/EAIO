import React from 'react';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High';
  savings: string;
  difficultyLevel: 'Low' | 'Medium' | 'High';
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { title, description, impact, savings, difficultyLevel } = recommendation;
  
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'High':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div className="card hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-gray-600">{description}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(impact)}`}>
              {impact} Impact
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(difficultyLevel)}`}>
              {difficultyLevel} Effort
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200">
              {savings}
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {impact === 'High' && (
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Implementation difficulty:</span> {difficultyLevel}
          </div>
          <button className="btn btn-primary">
            Implement
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;