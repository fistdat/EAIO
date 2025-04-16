import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, Clock, BarChart2, AlertTriangle, Zap, Droplet, Wind, ThermometerSnowflake, Sun, PieChart, Send, FileText, AreaChart, Terminal, ArrowUpRight } from 'lucide-react';

const EAIODashboard = () => {
  const [activeBuilding, setActiveBuilding] = useState('building_1');
  const [activeMeter, setActiveMeter] = useState('electricity');
  const [dateRange, setDateRange] = useState('last30days');
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [consumptionData, setConsumptionData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [forecastData, setForecastData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  
  // Sample buildings data
  const buildings = [
    { id: 'building_1', name: 'Office Tower A', primaryUse: 'Office', sqft: 245000 },
    { id: 'building_2', name: 'Education Center', primaryUse: 'Education', sqft: 180000 },
    { id: 'building_3', name: 'Retail Complex', primaryUse: 'Retail', sqft: 135000 },
    { id: 'building_4', name: 'Medical Center', primaryUse: 'Healthcare', sqft: 320000 },
  ];
  
  // Sample meter types with icons
  const meterTypes = [
    { id: 'electricity', name: 'Electricity', icon: <Zap size={18} className="mr-2" /> },
    { id: 'water', name: 'Water', icon: <Droplet size={18} className="mr-2" /> },
    { id: 'gas', name: 'Gas', icon: <Wind size={18} className="mr-2" /> },
    { id: 'chilledwater', name: 'Chilled Water', icon: <ThermometerSnowflake size={18} className="mr-2" /> },
    { id: 'solar', name: 'Solar', icon: <Sun size={18} className="mr-2" /> }
  ];
  
  // Sample date ranges
  const dateRanges = [
    { id: 'last7days', name: 'Last 7 Days' },
    { id: 'last30days', name: 'Last 30 Days' },
    { id: 'last90days', name: 'Last 90 Days' },
    { id: 'last12months', name: 'Last 12 Months' }
  ];
  
  // Navigation tabs
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <BarChart2 size={16} /> },
    { id: 'forecast', name: 'Forecasting', icon: <AreaChart size={16} /> },
    { id: 'analytics', name: 'Advanced Analytics', icon: <PieChart size={16} /> },
    { id: 'reports', name: 'Reports', icon: <FileText size={16} /> },
  ];
  
  // Effect for data loading
  useEffect(() => {
    fetchConsumptionData();
    fetchAnomalies();
    fetchRecommendations();
    fetchForecastData();
    fetchComparisonData();
  }, [activeBuilding, activeMeter, dateRange]);
  
  // Simulate data fetching
  const fetchConsumptionData = () => {
    setIsLoading(true);
    // In a real application, this would be an API call to the Agent Conductor
    setTimeout(() => {
      // Generate random consumption data
      const data = [];
      const today = new Date();
      let days = 30;
      
      if (dateRange === 'last7days') days = 7;
      if (dateRange === 'last90days') days = 90;
      if (dateRange === 'last12months') days = 365;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Different patterns for different meter types
        let baseValue = 0;
        let variance = 0;
        
        switch (activeMeter) {
          case 'electricity':
            baseValue = 850;
            variance = 150;
            // Weekday/weekend pattern
            if (date.getDay() === 0 || date.getDay() === 6) {
              baseValue = 500;
            }
            break;
          case 'water':
            baseValue = 350;
            variance = 50;
            break;
          case 'gas':
            baseValue = 200;
            variance = 30;
            // Seasonal pattern
            const month = date.getMonth();
            if (month >= 10 || month <= 2) { // Winter months
              baseValue = 400;
            }
            break;
          case 'chilledwater':
            baseValue = 300;
            variance = 70;
            // Seasonal pattern (opposite of gas)
            const cwMonth = date.getMonth();
            if (cwMonth >= 5 && cwMonth <= 8) { // Summer months
              baseValue = 600;
            }
            break;
          case 'solar':
            baseValue = 200;
            variance = 100;
            // Weather dependent
            if (i % 3 === 0) { // Cloudy days
              baseValue = 50;
            }
            break;
          default:
            baseValue = 500;
            variance = 100;
        }
        
        // Random value with base and variance
        const value = baseValue + (Math.random() * variance * 2) - variance;
        
        data.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(value)
        });
      }
      
      setConsumptionData(data);
      setIsLoading(false);
    }, 800);
  };
  
  const fetchAnomalies = () => {
    // Simulate fetching anomalies from Monitoring Agent
    setTimeout(() => {
      const mockAnomalies = [
        {
          id: 'anomaly_1',
          date: '2023-03-15',
          time: '14:30',
          meterType: 'electricity',
          value: 1240,
          expected: 850,
          deviation: '+46%',
          severity: 'high'
        },
        {
          id: 'anomaly_2',
          date: '2023-03-08',
          time: '02:15',
          meterType: 'electricity',
          value: 780,
          expected: 300,
          deviation: '+160%',
          severity: 'critical'
        },
        {
          id: 'anomaly_3',
          date: '2023-02-28',
          time: '10:45',
          meterType: 'water',
          value: 120,
          expected: 350,
          deviation: '-66%',
          severity: 'medium'
        }
      ];
      
      setAnomalies(mockAnomalies.filter(a => a.meterType === activeMeter));
    }, 1000);
  };
  
  const fetchRecommendations = () => {
    // Simulate fetching recommendations from Advisory Agent
    setTimeout(() => {
      const mockRecommendations = [
        {
          id: 'rec_1',
          title: 'Optimize HVAC Schedule',
          description: 'Current operation shows HVAC running at full capacity outside of business hours. Adjusting the schedule could save 15-20% on electricity costs.',
          impact: 'high',
          difficulty: 'medium',
          estimatedSavings: '$12,500 annually'
        },
        {
          id: 'rec_2',
          title: 'LED Lighting Upgrade',
          description: 'Replace conventional lighting with LED technology to reduce electricity consumption.',
          impact: 'high',
          difficulty: 'medium',
          estimatedSavings: '$8,200 annually'
        },
        {
          id: 'rec_3',
          title: 'Install Low-Flow Fixtures',
          description: 'Replace existing fixtures with low-flow alternatives to reduce water consumption.',
          impact: 'medium',
          difficulty: 'easy',
          estimatedSavings: '$3,600 annually'
        },
        {
          id: 'rec_4',
          title: 'Solar Panel Installation',
          description: 'Roof analysis indicates potential for 80kW solar array.',
          impact: 'high',
          difficulty: 'hard',
          estimatedSavings: '$15,000 annually'
        }
      ];
      
      setRecommendations(mockRecommendations);
    }, 1200);
  };
  
  const fetchForecastData = () => {
    // Simulate fetching forecast data from Forecasting Agent
    setTimeout(() => {
      const today = new Date();
      const forecastData = [];
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        // Base on patterns from historical data
        let baseValue = 0;
        let variance = 0;
        
        switch (activeMeter) {
          case 'electricity':
            baseValue = 850;
            variance = 200;
            if (date.getDay() === 0 || date.getDay() === 6) {
              baseValue = 500;
            }
            break;
          case 'water':
            baseValue = 350;
            variance = 80;
            break;
          case 'gas':
            baseValue = 200;
            variance = 50;
            const month = date.getMonth();
            if (month >= 10 || month <= 2) {
              baseValue = 400;
            }
            break;
          default:
            baseValue = 500;
            variance = 150;
        }
        
        const value = baseValue + (Math.random() * variance * 2) - variance;
        const lowBound = value * 0.85;
        const highBound = value * 1.15;
        
        forecastData.push({
          date: date.toISOString().split('T')[0],
          prediction: Math.round(value),
          lowerBound: Math.round(lowBound),
          upperBound: Math.round(highBound)
        });
      }
      
      setForecastData(forecastData);
    }, 1500);
  };
  
  const fetchComparisonData = () => {
    // Simulate fetching comparison data for benchmarking
    setTimeout(() => {
      const comparisonData = [
        {
          name: buildings.find(b => b.id === activeBuilding).name,
          value: Math.round(800 + Math.random() * 200)
        },
        {
          name: 'Similar Building 1',
          value: Math.round(700 + Math.random() * 300)
        },
        {
          name: 'Similar Building 2',
          value: Math.round(600 + Math.random() * 400)
        },
        {
          name: 'Similar Building 3',
          value: Math.round(500 + Math.random() * 300)
        },
        {
          name: 'Industry Average',
          value: 750
        }
      ];
      
      setComparisonData(comparisonData);
    }, 1000);
  };
  
  const handleQuerySubmit = (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    
    // Add user message to chat
    setChatHistory([...chatHistory, { sender: 'user', text: queryInput }]);
    setIsAnalyzing(true);
    
    // Simulate AI response from Agent Conductor
    setTimeout(() => {
      // Generate response based on query content
      let response = '';
      const query = queryInput.toLowerCase();
      
      if (query.includes('consumption') || query.includes('usage')) {
        response = `The ${activeMeter} consumption for ${buildings.find(b => b.id === activeBuilding).name} over the last 30 days was 24,850 kWh, which is 8% higher than the previous period. The daily average is 828 kWh with peak usage typically occurring between 1pm-3pm.`;
      } else if (query.includes('anomaly') || query.includes('unusual')) {
        response = `I detected 3 anomalies in the ${activeMeter} data over the selected period. The most significant occurred on March 8th at 2:15am with a 160% deviation from expected values. This could indicate equipment malfunction or scheduling issues.`;
      } else if (query.includes('recommend') || query.includes('improve') || query.includes('optimize')) {
        response = `Based on your consumption patterns, I recommend optimizing your HVAC schedule to reduce off-hours energy use. This could save approximately $12,500 annually with minimal impact on occupant comfort. Would you like a detailed implementation plan?`;
      } else if (query.includes('forecast') || query.includes('predict')) {
        response = `Based on historical patterns and weather forecasts, I predict your ${activeMeter} consumption will be approximately 26,400 kWh for the next 30 days, with peak demand likely occurring next week due to forecasted high temperatures.`;
      } else {
        response = `I've analyzed the ${activeMeter} data for ${buildings.find(b => b.id === activeBuilding).name}. The consumption shows a typical weekday/weekend pattern with peaks during business hours. Would you like specific information about usage patterns, anomalies, or efficiency recommendations?`;
      }
      
      // Add AI response to chat
      setChatHistory([...chatHistory, { sender: 'user', text: queryInput }, { sender: 'ai', text: response }]);
      setQueryInput('');
      setIsAnalyzing(false);
    }, 1500);
  };
  
  const analyzeAnomaly = (anomalyId) => {
    setIsAnalyzing(true);
    
    // Simulate anomaly analysis from the Monitoring Agent
    setTimeout(() => {
      const anomaly = anomalies.find(a => a.id === anomalyId);
      
      if (anomaly) {
        const analysisMessage = {
          sender: 'ai',
          text: `Analysis of anomaly on ${anomaly.date} at ${anomaly.time}: The ${anomaly.meterType} consumption was ${anomaly.deviation} from expected values. This appears to be due to equipment running outside scheduled hours. I recommend checking the BMS schedule settings and verifying that night setback controls are functioning properly.`,
          isAnalysis: true
        };
        
        setChatHistory([...chatHistory, analysisMessage]);
      }
      
      setIsAnalyzing(false);
    }, 2000);
  };
  
  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get impact badge color
  const getImpactBadgeColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get difficulty badge color
  const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get meter icon
  const getMeterIcon = (meterId) => {
    const meter = meterTypes.find(m => m.id === meterId);
    return meter ? meter.icon : <BarChart2 size={18} className="mr-2" />;
  };

  // Render main dashboard view
  const renderDashboard = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Consumption chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Consumption chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {activeMeter.charAt(0).toUpperCase() + activeMeter.slice(1)} Consumption
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar size={16} className="mr-1" />
                {dateRanges.find(r => r.id === dateRange)?.name}
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={consumptionData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => {
                        if (dateRange === 'last12months') {
                          return value.substring(0, 7); // YYYY-MM
                        }
                        return value.substring(5); // MM-DD
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} kWh`, 'Consumption']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={`${activeMeter.charAt(0).toUpperCase() + activeMeter.slice(1)} Usage`}
                      stroke="#3B82F6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Anomalies */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Detected Anomalies</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <AlertTriangle size={16} className="mr-1" /> {anomalies.length} detected
              </span>
            </div>
            
            <div className="space-y-4">
              {anomalies.length === 0 ? (
                <p className="text-sm text-gray-500">No anomalies detected in the selected period.</p>
              ) : (
                anomalies.map(anomaly => (
                  <div key={anomaly.id} className="flex items-start border-l-4 border-red-500 pl-4 py-2">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`font-medium ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} Anomaly
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {anomaly.date} at {anomaly.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Recorded value: <span className="font-semibold">{anomaly.value} kWh</span> (Expected: {anomaly.expected} kWh)
                      </p>
                      <p className="text-sm text-gray-600">
                        Deviation: <span className="font-semibold">{anomaly.deviation}</span> from expected value
                      </p>
                    </div>
                    <button 
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => analyzeAnomaly(anomaly.id)}
                    >
                      Analyze
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Recommendations and chat */}
        <div className="space-y-6">
          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h2>
            
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getImpactBadgeColor(rec.impact)}`}>
                        {rec.impact.charAt(0).toUpperCase() + rec.impact.slice(1)} impact
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBadgeColor(rec.difficulty)}`}>
                        {rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-green-600">{rec.estimatedSavings}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat box */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col h-96">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Ask EnergyAI</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Ask me about your energy usage patterns, anomalies, or recommendations.</p>
                  <p className="text-xs text-gray-400 mt-1">Try questions like "What's my electricity consumption trend?" or "Any unusual usage patterns?"</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-3/4 rounded-lg px-4 py-2 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : msg.isAnalysis ? 'bg-purple-100 text-gray-800 border border-purple-300' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleQuerySubmit} className="flex items-center">
              <input
                type="text"
                placeholder="Ask about energy usage, patterns, or recommendations..."
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isAnalyzing || !queryInput.trim()}
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render forecast view
  const renderForecast = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {activeMeter.charAt(0).toUpperCase() + activeMeter.slice(1)} Consumption Forecast
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={16} className="mr-1" />
                Next 14 Days
              </div>
            </div>
            
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={forecastData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickFormatter={(value) => value.substring(5)} // MM-DD
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} kWh`, 'Predicted']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      name="Forecast"
                      stroke="#3B82F6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="lowerBound"
                      name="Lower Bound"
                      stroke="#94A3B8"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                    <Line
                      type="monotone"
                      dataKey="upperBound"
                      name="Upper Bound"
                      stroke="#94A3B8"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-900">Forecast Insights</h3>
              <p className="mt-1 text-sm text-blue-700">
                Based on historical patterns and weather forecasts, we predict a 12% increase in consumption next week due to expected high temperatures. Consider pre-cooling strategies during off-peak hours to reduce peak demand charges.
              </p>
            </div>
          </div>
        </div>
        
        {/* Forecast details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Forecast Parameters</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Forecast Model</p>
                  <p className="font-medium">Ensemble ML</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Accuracy (MAPE)</p>
                  <p className="font-medium">8.2%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Weather Source</p>
                  <p className="font-medium">NOAA API</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Training Period</p>
                  <p className="font-medium">12 Months</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Key Drivers</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <ArrowUpRight size={14} className="text-red-500 mr-1" />
                    Temperature (67% influence)
                  </li>
                  <li className="flex items-center">
                    <ArrowUpRight size={14} className="text-orange-500 mr-1" />
                    Day of Week (18% influence)
                  </li>
                  <li className="flex items-center">
                    <ArrowUpRight size={14} className="text-yellow-500 mr-1" />
                    Occupancy Patterns (10% influence)
                  </li>
                  <li className="flex items-center">
                    <ArrowUpRight size={14} className="text-green-500 mr-1" />
                    Time of Day (5% influence)
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scenario Analysis</h2>
            
            <div className="space-y-4">
              <div className="p-3 border border-blue-200 bg-blue-50 rounded-md">
                <p className="font-medium text-blue-800">Baseline Scenario</p>
                <p className="text-sm text-blue-600">Predicted consumption: 24,850 kWh</p>
              </div>
              
              <div className="p-3 border border-green-200 bg-green-50 rounded-md">
                <p className="font-medium text-green-800">Efficiency Scenario</p>
                <p className="text-sm text-green-600">-15% reduction: 21,122 kWh</p>
                <p className="text-xs text-green-600 mt-1">If HVAC schedule optimization is implemented</p>
              </div>
              
              <div className="p-3 border border-red-200 bg-red-50 rounded-md">
                <p className="font-medium text-red-800">High Temperature Scenario</p>
                <p className="text-sm text-red-600">+10% increase: 27,335 kWh</p>
                <p className="text-xs text-red-600 mt-1">If temperatures exceed forecast by 5°F</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render analytics view
  const renderAnalytics = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Benchmark Comparison
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar size={16} className="mr-1" />
                Last 30 Days
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} kWh/sqft`, 'Consumption']}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Energy Intensity"
                    fill="#3B82F6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900">Benchmark Analysis</h3>
              <p className="mt-1 text-sm text-gray-600">
                Your building's energy intensity is 6% higher than similar buildings in your area. You rank in the 60th percentile for energy consumption relative to peers, indicating moderate potential for improvement.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Advanced Pattern Analysis</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900">Weekend vs. Weekday</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">42%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Weekend consumption is 42% of weekday average. Industry benchmark is 35%.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900">Baseload Ratio</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">28%</p>
                <p className="text-sm text-gray-600 mt-1">
                  Baseload represents 28% of total consumption. Industry benchmark is 22%.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900">Peak Load Factor</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">0.72</p>
                <p className="text-sm text-gray-600 mt-1">
                  Ratio of average to peak demand. Higher values indicate more consistent usage.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900">Weather Sensitivity</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">0.84</p>
                <p className="text-sm text-gray-600 mt-1">
                  Correlation with outdoor temperature (0-1). Indicates high weather dependence.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Efficiency Rating</h2>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Energy Performance
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    72/100
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div style={{ width: "72%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
              </div>
              
              <div className="grid grid-cols-4 text-center text-xs mt-1">
                <div className="text-red-500">Poor</div>
                <div className="text-orange-500">Fair</div>
                <div className="text-blue-500 font-bold">Good</div>
                <div className="text-green-500">Excellent</div>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Rating Components</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Consumption Efficiency</span>
                <span className="text-sm font-medium">78/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full">
                <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "78%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Demand Management</span>
                <span className="text-sm font-medium">65/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: "65%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Operational Efficiency</span>
                <span className="text-sm font-medium">70/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full">
                <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: "70%" }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Energy Source Mix</span>
                <span className="text-sm font-medium">82/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full">
                <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "82%" }}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Anomaly Statistics</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">14 anomalies detected</p>
                  <p className="text-sm text-gray-500">Last 30 days</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Critical</p>
                  <p className="font-medium text-red-600">3</p>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <p className="text-xs text-gray-500">High</p>
                  <p className="font-medium text-orange-600">5</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Medium</p>
                  <p className="font-medium text-yellow-600">6</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Common Causes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Equipment scheduling errors (42%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    HVAC system malfunctions (28%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    Unexpected occupancy changes (14%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Weather-related impacts (10%)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Other/Unknown (6%)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render reports view
  const renderReports = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Energy Reports</h2>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-md p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Monthly Energy Performance Report</h3>
                <p className="text-sm text-gray-500 mt-1">March 2023</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    5% improvement
                  </span>
                  <span className="ml-2 text-sm text-gray-500">vs previous month</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Preview
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">
                  Download
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Comprehensive analysis of energy performance, including consumption patterns, anomalies, and recommendations.</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Efficiency Improvement Plan</h3>
                <p className="text-sm text-gray-500 mt-1">Q2 2023</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    10 action items
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Preview
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">
                  Download
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Strategic plan for implementing energy efficiency measures with prioritized actions and expected ROI.</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Annual Sustainability Report</h3>
                <p className="text-sm text-gray-500 mt-1">2022</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    8% carbon reduction
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Preview
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">
                  Download
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Comprehensive assessment of annual energy consumption, carbon emissions, and sustainability performance.</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Anomaly Investigation Report</h3>
                <p className="text-sm text-gray-500 mt-1">February 15, 2023</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Critical anomaly
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Preview
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded">
                  Download
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Detailed investigation of critical anomaly, including root cause analysis and preventive measures.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
            <Terminal size={16} className="mr-2" />
            Generate Custom Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">EAIO - EnergyAI Optimizer</h1>
          </div>
          <div className="flex space-x-4">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={activeBuilding}
              onChange={(e) => setActiveBuilding(e.target.value)}
            >
              {buildings.map(building => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
            
            <div className="flex space-x-2">
              {meterTypes.map(meter => (
                <button
                  key={meter.id}
                  className={`flex items-center px-3 py-2 text-sm rounded-md ${
                    activeMeter === meter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveMeter(meter.id)}
                >
                  {meter.icon}
                  {meter.name}
                </button>
              ))}
            </div>
            
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      
      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'forecast' && renderForecast()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </main>
    </div>
  );
};

export default EAIODashboard;