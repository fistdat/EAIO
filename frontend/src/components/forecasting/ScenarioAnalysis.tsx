import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface Scenario {
  name: string;
  description: string;
  consumption: number;
  reduction?: number;
  className?: string;
}

interface ScenarioAnalysisProps {
  scenarios: Scenario[];
  className?: string;
}

const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({
  scenarios,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Scenario Analysis</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-6">
        <div className="space-y-4">
          {scenarios.map((scenario, index) => (
            <Card 
              key={index} 
              className={`shadow-sm ${scenario.className || (
                scenario.name === 'Baseline Scenario' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              )}`}
            >
              <CardContent className="p-4">
                <h3 className="font-medium text-base mb-1">{scenario.name}</h3>
                <p className="text-sm mb-2">{scenario.description}</p>
                {scenario.reduction ? (
                  <p className="text-sm text-green-700">
                    <span className="font-medium">-{scenario.reduction}% reduction:</span> {scenario.consumption.toLocaleString()} kWh
                  </p>
                ) : (
                  <p className="text-sm">
                    <span className="font-medium">Predicted consumption:</span> {scenario.consumption.toLocaleString()} kWh
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioAnalysis; 