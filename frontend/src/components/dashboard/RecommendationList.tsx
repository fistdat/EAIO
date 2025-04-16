import React from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  implementationCost: string;
  paybackPeriod: string;
  priority: 'Low' | 'Medium' | 'High';
  category: string;
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
}

const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
        <p className="text-gray-500">No recommendations available</p>
      </div>
    );
  }

  // Format currency 
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Energy Optimization Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div 
            key={rec.id} 
            className="p-4 border rounded-md shadow-sm bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{rec.title}</h4>
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  rec.priority === 'High' ? 'bg-green-100 text-green-800' :
                  rec.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {rec.priority} Priority
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
              <div>
                <span className="block text-gray-400">Potential Savings</span>
                <span className="font-medium text-green-600">{formatCurrency(rec.potentialSavings)}</span>
              </div>
              <div>
                <span className="block text-gray-400">Implementation Cost</span>
                <span className="font-medium">{rec.implementationCost}</span>
              </div>
              <div>
                <span className="block text-gray-400">Payback Period</span>
                <span className="font-medium">{rec.paybackPeriod}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationList;
