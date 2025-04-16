import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ArrowUp, ArrowDown, ArrowRight, Clock, Calendar, Users } from 'lucide-react';

interface Driver {
  name: string;
  influence: number;
  icon?: React.ReactNode;
}

interface KeyDriversProps {
  drivers: Driver[];
  className?: string;
}

const KeyDrivers: React.FC<KeyDriversProps> = ({
  drivers,
  className = '',
}) => {
  // Sort drivers by influence (highest first)
  const sortedDrivers = [...drivers].sort((a, b) => Math.abs(b.influence) - Math.abs(a.influence));

  // Helper to get icon color based on influence
  const getIconColor = (influence: number): string => {
    if (influence > 0) return 'text-red-500';
    if (influence < 0) return 'text-green-500';
    return 'text-gray-400';
  };

  // Helper to get arrow icon based on influence
  const getArrowIcon = (influence: number) => {
    if (influence > 0) return <ArrowUp className={`h-4 w-4 ${getIconColor(influence)}`} />;
    if (influence < 0) return <ArrowDown className={`h-4 w-4 ${getIconColor(influence)}`} />;
    return <ArrowRight className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Key Drivers</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-6">
        <div className="space-y-4">
          {sortedDrivers.map((driver, index) => (
            <div key={index} className="flex items-center">
              <div className="w-6 mr-2">
                {getArrowIcon(driver.influence)}
              </div>
              <div className="flex-1 flex items-center">
                <span className="text-sm text-gray-700 font-medium">{driver.name}</span>
                <span className="ml-auto text-sm font-medium text-gray-500">
                  {Math.abs(driver.influence)}% influence
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyDrivers; 