import React, { useState } from 'react';

interface Building {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface BuildingSelectorProps {
  buildings: Building[];
  selectedBuilding: Building;
  onChange: (building: Building) => void;
}

const BuildingSelector: React.FC<BuildingSelectorProps> = ({
  buildings,
  selectedBuilding,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleBuildingSelect = (building: Building) => {
    onChange(building);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        onClick={toggleDropdown}
      >
        <div className="flex items-center">
          <span className="block h-2 w-2 rounded-full mr-2" style={{ 
            backgroundColor: 
              selectedBuilding.type === 'Office' ? '#3B82F6' : 
              selectedBuilding.type === 'Retail' ? '#10B981' :
              selectedBuilding.type === 'Healthcare' ? '#EF4444' :
              selectedBuilding.type === 'Education' ? '#F59E0B' : '#6B7280'
          }}></span>
          <span>{selectedBuilding.name}</span>
          <span className="ml-2 text-xs text-gray-500">({selectedBuilding.location})</span>
        </div>
        <svg className="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {buildings.map((building) => (
              <button
                key={building.id}
                className={`text-left w-full px-4 py-3 text-sm hover:bg-gray-100 ${
                  building.id === selectedBuilding.id ? 'bg-gray-50' : ''
                }`}
                onClick={() => handleBuildingSelect(building)}
              >
                <div className="flex items-center">
                  <span className="block h-2 w-2 rounded-full mr-2" style={{ 
                    backgroundColor: 
                      building.type === 'Office' ? '#3B82F6' : 
                      building.type === 'Retail' ? '#10B981' :
                      building.type === 'Healthcare' ? '#EF4444' :
                      building.type === 'Education' ? '#F59E0B' : '#6B7280'
                  }}></span>
                  <div>
                    <div className="font-medium text-gray-900">{building.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {building.location} • {building.type}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildingSelector;