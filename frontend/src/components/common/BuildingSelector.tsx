import React, { useState, useEffect, useMemo } from 'react';

interface Building {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface BuildingSelectorProps {
  buildings: Building[];
  selectedBuilding: Building | null;
  onBuildingChange?: (building: Building) => void;
  onChange?: (building: Building | null) => void;
  isLoading?: boolean;
  id?: string;
}

const BuildingSelector: React.FC<BuildingSelectorProps> = ({
  buildings,
  selectedBuilding,
  onBuildingChange,
  onChange,
  isLoading = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const buildingsPerPage = 10;
  
  // Extract unique building types and locations for filters
  const buildingTypes = useMemo(() => {
    const types = new Set(buildings.map(b => b.type));
    return Array.from(types).sort();
  }, [buildings]);
  
  const locations = useMemo(() => {
    // Extract cities from location strings (assuming format "City, Country")
    const locationSet = new Set(
      buildings.map(b => b.location.split(',')[0]?.trim()).filter(Boolean)
    );
    return Array.from(locationSet).sort();
  }, [buildings]);
  
  // Apply filters to buildings list
  const filteredBuildings = useMemo(() => {
    return buildings.filter(building => {
      const matchesSearch = searchTerm === '' || 
        building.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === '' || 
        building.type === typeFilter;
      
      const matchesLocation = locationFilter === '' || 
        building.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      return matchesSearch && matchesType && matchesLocation;
    });
  }, [buildings, searchTerm, typeFilter, locationFilter]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredBuildings.length / buildingsPerPage);
  const indexOfLastBuilding = currentPage * buildingsPerPage;
  const indexOfFirstBuilding = indexOfLastBuilding - buildingsPerPage;
  const currentBuildings = filteredBuildings.slice(indexOfFirstBuilding, indexOfLastBuilding);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, locationFilter]);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleBuildingSelect = (building: Building) => {
    if (onBuildingChange) {
      onBuildingChange(building);
    }
    if (onChange) {
      onChange(building);
    }
    setIsOpen(false);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };
  
  const handleLocationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocationFilter(e.target.value);
  };
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Đang tải danh sách tòa nhà...</span>
        </div>
      </div>
    );
  }

  if (!selectedBuilding) {
    return (
      <div className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
        <span>No building selected</span>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <button
        type="button"
        id={id}
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
        <div className="absolute right-0 z-10 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-3 border-b">
            {/* Search input */}
            <div className="mb-2">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Search buildings..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                >
                  <option value="">All Types</option>
                  {buildingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={locationFilter}
                  onChange={handleLocationFilterChange}
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-2 text-xs text-gray-500">
              {filteredBuildings.length === 0 ? (
                <span>No buildings match your filters</span>
              ) : (
                <span>Showing {Math.min(filteredBuildings.length, buildingsPerPage)} of {filteredBuildings.length} buildings</span>
              )}
            </div>
          </div>
          
          {/* Building list */}
          <div className="py-1 max-h-80 overflow-y-auto">
            {currentBuildings.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No buildings match your criteria
              </div>
            ) : (
              currentBuildings.map((building) => (
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
              ))
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
              <button
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildingSelector;