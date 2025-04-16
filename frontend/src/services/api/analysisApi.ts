// Analysis API service for the Energy AI Optimizer frontend
import axios from 'axios';
import { apiConfig, createMockDelay, formatApiPath, shouldFallbackOnError } from '../../utils/apiConfig';
import { addDays, format, parseISO, subDays } from 'date-fns';

// Sử dụng trực tiếp từ apiConfig thay vì từ index để tránh circular dependency
const apiClient = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Helper function để tránh circular dependency 
const getApiPath = (path: string): string => {
  return formatApiPath(path);
};

// Analysis data interfaces
export interface EnergyPattern {
  name: string;
  description: string;
  occurrenceCount: number;
  impactScore: number; // 0-100 scale
  relatedMetrics: string[];
  timeRanges: {
    start: string;
    end: string;
  }[];
  category: 'positive' | 'negative' | 'neutral';
}

export interface EnergyAnomaly {
  id: string;
  buildingId: string;
  metric: 'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater';
  timestamp: string;
  duration: number; // duration in hours
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedValue: number;
  actualValue: number;
  percentageDeviation: number;
  status: 'detected' | 'investigating' | 'resolved' | 'ignored';
  possibleCauses: string[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface EnergyBenchmark {
  buildingId: string;
  metric: 'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater';
  score: number; // 0-100
  percentile: number; // 0-100
  comparisonGroups: {
    name: string;
    averageConsumption: number;
    thisBuilding: number;
    unit: string;
    percentDifference: number;
  }[];
}

export interface EnergyEfficiencyMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'improving' | 'declining' | 'stable';
  percentChange: number;
  comparisonPeriod: string;
}

export interface EnergyAnalysisSummary {
  buildingId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  patternCount: number;
  anomalyCount: number;
  efficiencyMetrics: EnergyEfficiencyMetric[];
  topPatterns: EnergyPattern[];
  recentAnomalies: EnergyAnomaly[];
  benchmarks: {
    [key: string]: EnergyBenchmark;
  };
}

// Interface for comprehensive analysis results
export interface ComprehensiveAnalysisResult {
  building_id: string;
  analysis_type: string;
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  results: {
    historical_analysis: any;
    anomalies: any;
    short_term_forecast: any;
    long_term_forecast: any;
    recommendations: any;
  };
}

// Interface for anomaly results
export interface AnomalyResult {
  building_id: string;
  period: {
    start: string;
    end: string;
  };
  anomaly_count: number;
  anomalies: Array<{
    id: string;
    timestamp: string;
    type: string;
    severity: string;
    value: number;
    expected_value: number;
    description: string;
  }>;
  message?: string; // Optional message property for development or error status
}

// Generate mock energy analysis data for development
export const generateMockEnergyAnalysis = (
    buildingId: string, 
  startDate: string,
  endDate: string
): EnergyAnalysisSummary => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Generate efficiency metrics
  const efficiencyMetrics: EnergyEfficiencyMetric[] = [
    {
      name: 'Energy Use Intensity (EUI)',
      value: Math.round((80 + Math.random() * 40) * 10) / 10,
      unit: 'kWh/m²/year',
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.5 ? 'declining' : 'stable',
      percentChange: Math.round((Math.random() * 15 - 5) * 10) / 10,
      comparisonPeriod: 'Previous Year'
    },
    {
      name: 'Peak Demand Ratio',
      value: Math.round((1.2 + Math.random() * 0.6) * 100) / 100,
      unit: 'ratio',
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      percentChange: Math.round((Math.random() * 12 - 6) * 10) / 10,
      comparisonPeriod: 'Previous Quarter'
    },
    {
      name: 'Load Factor',
      value: Math.round((0.65 + Math.random() * 0.25) * 100) / 100,
      unit: 'ratio',
      trend: Math.random() > 0.4 ? 'improving' : Math.random() > 0.7 ? 'declining' : 'stable',
      percentChange: Math.round((Math.random() * 8 - 3) * 10) / 10,
      comparisonPeriod: 'Previous Month'
    },
    {
      name: 'Energy Cost Intensity',
      value: Math.round((12 + Math.random() * 8) * 10) / 10,
      unit: '$/m²/year',
      trend: Math.random() > 0.5 ? 'improving' : 'declining',
      percentChange: Math.round((Math.random() * 10 - 5) * 10) / 10,
      comparisonPeriod: 'Previous Year'
    },
    {
      name: 'Water Use Intensity',
      value: Math.round((1000 + Math.random() * 500) * 10) / 10,
      unit: 'L/m²/year',
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'declining' : 'stable',
      percentChange: Math.round((Math.random() * 12 - 4) * 10) / 10,
      comparisonPeriod: 'Previous Year'
    }
  ];
  
  // Generate energy patterns
  const patternTemplates = [
    {
      name: 'Consistent Weekend Setback',
      description: 'Building shows appropriate reduced energy consumption during weekends',
      category: 'positive',
      metrics: ['electricity', 'gas'],
      minImpact: 65,
      maxImpact: 95
    },
    {
      name: 'Overnight Equipment Running',
      description: 'Several instances of equipment left running overnight detected',
      category: 'negative',
      metrics: ['electricity'],
      minImpact: 40,
      maxImpact: 80
    },
    {
      name: 'Effective Morning Warmup',
      description: 'Building warmup sequence is optimized and efficient',
      category: 'positive',
      metrics: ['gas', 'steam', 'electricity'],
      minImpact: 55,
      maxImpact: 85
    },
    {
      name: 'Lighting Left On After Hours',
      description: 'Lighting systems detected to be on during unoccupied hours',
      category: 'negative',
      metrics: ['electricity'],
      minImpact: 30,
      maxImpact: 70
    },
    {
      name: 'Electrical Base Load Creep',
      description: 'Gradual increase in minimum electrical consumption detected',
      category: 'negative',
      metrics: ['electricity'],
      minImpact: 50,
      maxImpact: 85
    },
    {
      name: 'Efficient Night Setback',
      description: 'Temperature setbacks properly reducing energy use overnight',
      category: 'positive',
      metrics: ['gas', 'electricity'],
      minImpact: 60,
      maxImpact: 90
    },
    {
      name: 'Weather-Responsive Operation',
      description: 'Building systems are adjusting appropriately to weather changes',
      category: 'positive',
      metrics: ['electricity', 'gas', 'steam', 'chilledwater'],
      minImpact: 70,
      maxImpact: 95
    },
    {
      name: 'Simultaneous Heating and Cooling',
      description: 'Competing heating and cooling systems detected',
      category: 'negative',
      metrics: ['electricity', 'gas', 'steam', 'chilledwater'],
      minImpact: 65,
      maxImpact: 90
    },
    {
      name: 'Water Leak',
      description: 'Possible water leak detected from continuous flow pattern',
      category: 'negative',
      metrics: ['water'],
      minImpact: 50,
      maxImpact: 95
    },
    {
      name: 'Optimized Start/Stop Times',
      description: 'Building equipment start and stop times are well optimized',
      category: 'positive',
      metrics: ['electricity', 'gas'],
      minImpact: 60,
      maxImpact: 90
    }
  ];
  
  // Select 5-8 patterns randomly
  const numPatterns = 5 + Math.floor(Math.random() * 4);
  const shuffledPatterns = [...patternTemplates].sort(() => 0.5 - Math.random());
  const selectedPatterns = shuffledPatterns.slice(0, numPatterns);
  
  // Generate time ranges for patterns
  const topPatterns: EnergyPattern[] = selectedPatterns.map(template => {
    // Generate 1-4 occurrences
    const occurrenceCount = 1 + Math.floor(Math.random() * 4);
    const timeRanges = [];
    
    for (let i = 0; i < occurrenceCount; i++) {
      // Random start date within the range
      const daysOffset = Math.floor(Math.random() * (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const rangeStart = addDays(start, daysOffset);
      
      // Duration between 2 hours and 3 days
      const durationHours = 2 + Math.floor(Math.random() * 70);
      const rangeEnd = new Date(rangeStart.getTime() + durationHours * 60 * 60 * 1000);
      
      timeRanges.push({
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString()
      });
    }
    
    // Random impact score within the defined range
    const impactScore = Math.floor(template.minImpact + Math.random() * (template.maxImpact - template.minImpact));
    
    return {
      name: template.name,
      description: template.description,
      occurrenceCount,
      impactScore,
      relatedMetrics: template.metrics,
      timeRanges,
      category: template.category as 'positive' | 'negative' | 'neutral'
    };
  });
  
  // Sort patterns by impact score (descending)
  topPatterns.sort((a, b) => b.impactScore - a.impactScore);
  
  // Generate anomalies
  const anomalyTemplates = [
    {
      metric: 'electricity',
      possibleCauses: [
        'HVAC system malfunction',
        'Incorrect schedule settings',
        'Equipment left running',
        'Short circuit',
        'Faulty sensor reading'
      ]
    },
    {
      metric: 'water',
      possibleCauses: [
        'Water leak',
        'Irrigation system malfunction',
        'Cooling tower overflow',
        'Unusual occupancy pattern',
        'Faulty meter reading'
      ]
    },
    {
      metric: 'gas',
      possibleCauses: [
        'Heating system malfunction',
        'Thermostat override',
        'Boiler cycling issue',
        'Unexpected cold weather',
        'Inadequate insulation'
      ]
    },
    {
      metric: 'steam',
      possibleCauses: [
        'Steam trap failure',
        'Pipe insulation damage',
        'Valve leakage',
        'Condensate return issue',
        'Pressure regulation failure'
      ]
    },
    {
      metric: 'hotwater',
      possibleCauses: [
        'Recirculation pump failure',
        'Temperature setting too high',
        'Heat exchanger scaling',
        'Storage tank leakage',
        'Unexpected high demand'
      ]
    },
    {
      metric: 'chilledwater',
      possibleCauses: [
        'Chiller malfunction',
        'Cooling load increase',
        'Pump sequencing issue',
        'Control valve failure',
        'Temperature setpoint too low'
      ]
    }
  ];
  
  // Generate 3-7 anomalies
  const numAnomalies = 3 + Math.floor(Math.random() * 5);
  const recentAnomalies: EnergyAnomaly[] = [];
  
  for (let i = 0; i < numAnomalies; i++) {
    // Random anomaly template
    const templateIndex = Math.floor(Math.random() * anomalyTemplates.length);
    const template = anomalyTemplates[templateIndex];
    
    // Random time within date range (weighted toward more recent)
    const recencyBias = Math.pow(Math.random(), 2); // Square to bias toward 0
    const dayOffset = Math.floor(recencyBias * ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const anomalyDate = subDays(end, dayOffset);
    
    // Generate anomaly values
    const expectedValue = 50 + Math.random() * 150;
    const deviationPercent = 20 + Math.random() * 80; // 20-100% deviation
    const deviation = expectedValue * (deviationPercent / 100) * (Math.random() > 0.5 ? 1 : -1);
    const actualValue = expectedValue + deviation;
    
    // Random duration between 1-24 hours
    const duration = 1 + Math.floor(Math.random() * 24);
    
    // Determine severity based on deviation
    let severity: 'low' | 'medium' | 'high' | 'critical';
    const absDeviation = Math.abs(deviationPercent);
    if (absDeviation > 75) severity = 'critical';
    else if (absDeviation > 50) severity = 'high';
    else if (absDeviation > 30) severity = 'medium';
    else severity = 'low';
    
    // Random status, weighted toward more recent anomalies being unresolved
    let status: 'detected' | 'investigating' | 'resolved' | 'ignored';
    const daysAgo = dayOffset;
    
    if (daysAgo < 1) {
      // Very recent
      status = Math.random() > 0.7 ? 'investigating' : 'detected';
    } else if (daysAgo < 3) {
      // Recent
      const r = Math.random();
      if (r < 0.4) status = 'resolved';
      else if (r < 0.7) status = 'investigating';
      else if (r < 0.9) status = 'detected';
      else status = 'ignored';
    } else {
      // Older
      const r = Math.random();
      if (r < 0.7) status = 'resolved';
      else if (r < 0.9) status = 'ignored';
      else status = 'investigating';
    }
    
    // Generate resolution information if resolved
    let resolvedAt, resolvedBy, resolutionNotes;
    if (status === 'resolved') {
      // Resolution happens 1 hour to 3 days after detection
      const resolutionDelay = (1 + Math.random() * 71) * 60 * 60 * 1000;
      const resolutionDate = new Date(anomalyDate.getTime() + resolutionDelay);
      resolvedAt = resolutionDate.toISOString();
      resolvedBy = ['System Administrator', 'Facility Manager', 'Building Engineer', 'Energy Specialist'][
        Math.floor(Math.random() * 4)
      ];
      
      // Generate a resolution note
      const resolutionTemplates = [
        'Adjusted settings to correct the issue.',
        'Performed maintenance on equipment.',
        'Reset system and verified normal operation.',
        'Calibrated sensors and monitoring equipment.',
        'Repaired faulty component.',
        'Scheduled preventive maintenance to avoid recurrence.'
      ];
      resolutionNotes = resolutionTemplates[Math.floor(Math.random() * resolutionTemplates.length)];
    }
    
    // Select 1-3 possible causes
    const numCauses = 1 + Math.floor(Math.random() * 3);
    const shuffledCauses = [...template.possibleCauses].sort(() => 0.5 - Math.random());
    const selectedCauses = shuffledCauses.slice(0, numCauses);
    
    recentAnomalies.push({
      id: `anomaly-${buildingId}-${i}`,
      buildingId,
      metric: template.metric as EnergyAnomaly['metric'],
      timestamp: anomalyDate.toISOString(),
      duration,
      severity,
      expectedValue: Math.round(expectedValue * 100) / 100,
      actualValue: Math.round(actualValue * 100) / 100,
      percentageDeviation: Math.round(deviationPercent * 10) / 10 * (deviation < 0 ? -1 : 1),
      status,
      possibleCauses: selectedCauses,
      resolvedAt,
      resolvedBy,
      resolutionNotes
    });
  }
  
  // Sort anomalies by timestamp (most recent first)
  recentAnomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Generate benchmarks
  const benchmarkMetrics: EnergyAnomaly['metric'][] = ['electricity', 'water', 'gas', 'steam', 'hotwater', 'chilledwater'];
  const benchmarks: { [key: string]: EnergyBenchmark } = {};
  
  benchmarkMetrics.forEach(metric => {
    // Generate benchmark score and percentile
    const score = Math.round(50 + Math.random() * 50); // 50-100 score
    const percentile = Math.round(score - 10 + Math.random() * 20); // Roughly aligned with score
    
    // Generate comparison groups
    const comparisonGroups = [
      {
        name: 'Similar Size Buildings',
        unit: metric === 'electricity' ? 'kWh/m²' : 
              metric === 'water' ? 'L/m²' : 
              metric === 'gas' ? 'm³/m²' : 'kg/m²',
        averageConsumption: 0,
        thisBuilding: 0,
        percentDifference: 0
      },
      {
        name: 'Same Building Type',
        unit: metric === 'electricity' ? 'kWh/m²' : 
              metric === 'water' ? 'L/m²' : 
              metric === 'gas' ? 'm³/m²' : 'kg/m²',
        averageConsumption: 0,
        thisBuilding: 0,
        percentDifference: 0
      },
      {
        name: 'Regional Average',
        unit: metric === 'electricity' ? 'kWh/m²' : 
              metric === 'water' ? 'L/m²' : 
              metric === 'gas' ? 'm³/m²' : 'kg/m²',
        averageConsumption: 0,
        thisBuilding: 0,
        percentDifference: 0
      }
    ];
    
    // Fill in values for comparison groups
    comparisonGroups.forEach(group => {
      // Generate baseline consumption values based on metric
      let baseValue;
      switch (metric) {
        case 'electricity': baseValue = 100 + Math.random() * 50; break;
        case 'water': baseValue = 1000 + Math.random() * 500; break;
        case 'gas': baseValue = 15 + Math.random() * 10; break;
        case 'steam': baseValue = 80 + Math.random() * 40; break;
        case 'hotwater': baseValue = 200 + Math.random() * 100; break;
        case 'chilledwater': baseValue = 150 + Math.random() * 75; break;
      }
      
      // Slightly different values for each comparison group
      group.averageConsumption = Math.round(baseValue * (1 + (Math.random() * 0.4 - 0.2)) * 10) / 10;
      
      // Building's own consumption - better than average if score > 75
      const performanceFactor = score > 75 ? 0.7 + Math.random() * 0.2 : 1.1 + Math.random() * 0.3;
      group.thisBuilding = Math.round(group.averageConsumption * performanceFactor * 10) / 10;
      
      // Calculate percentage difference
      group.percentDifference = Math.round((group.thisBuilding / group.averageConsumption - 1) * 1000) / 10;
    });
    
    benchmarks[metric] = {
      buildingId,
      metric,
      score,
      percentile,
      comparisonGroups
    };
  });
  
  // Calculate overall score (weighted average of metrics and anomalies)
  const weightedScores = Object.values(benchmarks).map(b => b.score);
  const anomalyPenalty = Math.min(25, recentAnomalies.length * 5); // More anomalies = lower score
  const overallScore = Math.round(
    (weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length) - anomalyPenalty
  );
  
  return {
    buildingId,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    overallScore: Math.max(0, overallScore), // Ensure score is not negative
    patternCount: topPatterns.length,
    anomalyCount: recentAnomalies.length,
    efficiencyMetrics,
    topPatterns,
    recentAnomalies,
    benchmarks
  };
};

// Get energy analysis for a specific building
export const getBuildingEnergyAnalysis = async (
    buildingId: string, 
  startDate: string,
  endDate: string
): Promise<EnergyAnalysisSummary> => {
  try {
    if (apiConfig.useMockData) {
      // Use mock data for development
      console.info('Using mock data for building energy analysis');
      await createMockDelay();
      return generateMockEnergyAnalysis(buildingId, startDate, endDate);
    }
    
    // Fetch real data from PostgreSQL backend
    console.info(`Fetching real data from PostgreSQL for building ${buildingId}`);
    const response = await apiClient.get(getApiPath('/analysis/building'), {
      params: {
        building_id: buildingId,
        start_date: startDate,
        end_date: endDate
      }
    });
    
    console.info('Successfully retrieved data from PostgreSQL');
    
    // Transform API response to match our interface
    const result: EnergyAnalysisSummary = {
      buildingId: response.data.building_id,
      periodStart: response.data.period_start,
      periodEnd: response.data.period_end,
      overallScore: response.data.overall_score,
      patternCount: response.data.pattern_count,
      anomalyCount: response.data.anomaly_count,
      
      // Transform efficiency metrics
      efficiencyMetrics: response.data.efficiency_metrics.map((metric: any) => ({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        trend: metric.trend,
        percentChange: metric.percent_change,
        comparisonPeriod: metric.comparison_period
      })),
      
      // Transform patterns
      topPatterns: response.data.top_patterns.map((pattern: any) => ({
        name: pattern.name,
        description: pattern.description,
        occurrenceCount: pattern.occurrence_count,
        impactScore: pattern.impact_score,
        relatedMetrics: pattern.related_metrics,
        timeRanges: pattern.time_ranges.map((range: any) => ({
          start: range.start,
          end: range.end
        })),
        category: pattern.category
      })),
      
      // Transform anomalies
      recentAnomalies: response.data.recent_anomalies.map((anomaly: any) => ({
        id: anomaly.id,
        buildingId: anomaly.building_id,
        metric: anomaly.metric,
        timestamp: anomaly.timestamp,
        duration: anomaly.duration,
        severity: anomaly.severity,
        expectedValue: anomaly.expected_value,
        actualValue: anomaly.actual_value,
        percentageDeviation: anomaly.percentage_deviation,
        status: anomaly.status,
        possibleCauses: anomaly.possible_causes,
        resolvedAt: anomaly.resolved_at,
        resolvedBy: anomaly.resolved_by,
        resolutionNotes: anomaly.resolution_notes
      })),
      
      // Transform benchmarks
      benchmarks: Object.fromEntries(
        Object.entries(response.data.benchmarks).map(([key, value]: [string, any]) => [
          key,
          {
            buildingId: value.building_id,
            metric: value.metric,
            score: value.score,
            percentile: value.percentile,
            comparisonGroups: value.comparison_groups.map((group: any) => ({
              name: group.name,
              averageConsumption: group.average_consumption,
              thisBuilding: group.this_building,
              unit: group.unit,
              percentDifference: group.percent_difference
            }))
          }
        ])
      )
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching building energy analysis:', error);
    
    // Check if should fallback to mock data
    if (apiConfig.fallbackToMockOnError) {
      console.warn('Falling back to mock data due to API error');
      return generateMockEnergyAnalysis(buildingId, startDate, endDate);
    } else {
      throw new Error(`Failed to fetch building energy analysis: ${error}`);
    }
  }
};

// Get details for a specific anomaly
export const getAnomalyDetails = async (anomalyId: string): Promise<EnergyAnomaly> => {
  try {
    if (apiConfig.useMockData) {
      // Generate a single detailed anomaly
      await createMockDelay();
      
      // Parse building ID and index from anomaly ID format
      const [, buildingId, index] = anomalyId.split('-');
      
      // Use random seed based on anomaly ID for consistency
      const seedRandom = (min: number, max: number) => {
        const seed = anomalyId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const rnd = Math.sin(seed + parseInt(index)) * 10000;
        return min + Math.abs(rnd % (max - min));
      };
      
      // Random metric
      const metrics: EnergyAnomaly['metric'][] = ['electricity', 'water', 'gas', 'steam', 'hotwater', 'chilledwater'];
      const metric = metrics[Math.floor(seedRandom(0, metrics.length))];
      
      // Generate timestamp (within last 30 days)
      const daysAgo = Math.floor(seedRandom(0, 30));
      const anomalyDate = subDays(new Date(), daysAgo);
      
      // Generate values
      const expectedValue = 50 + seedRandom(0, 150);
      const deviationPercent = 20 + seedRandom(0, 80);
      const deviation = expectedValue * (deviationPercent / 100) * (seedRandom(0, 1) > 0.5 ? 1 : -1);
      const actualValue = expectedValue + deviation;
      
      // Random duration
      const duration = 1 + Math.floor(seedRandom(0, 24));
      
      // Determine severity based on deviation
      let severity: 'low' | 'medium' | 'high' | 'critical';
      const absDeviation = Math.abs(deviationPercent);
      if (absDeviation > 75) severity = 'critical';
      else if (absDeviation > 50) severity = 'high';
      else if (absDeviation > 30) severity = 'medium';
      else severity = 'low';
      
      // Status based on days ago
      let status: 'detected' | 'investigating' | 'resolved' | 'ignored';
      if (daysAgo < 1) {
        status = seedRandom(0, 1) > 0.7 ? 'investigating' : 'detected';
      } else if (daysAgo < 3) {
        const r = seedRandom(0, 1);
        if (r < 0.4) status = 'resolved';
        else if (r < 0.7) status = 'investigating';
        else if (r < 0.9) status = 'detected';
        else status = 'ignored';
      } else {
        const r = seedRandom(0, 1);
        if (r < 0.7) status = 'resolved';
        else if (r < 0.9) status = 'ignored';
        else status = 'investigating';
      }
      
      // Possible causes based on metric
      let possibleCauses: string[] = [];
      switch (metric) {
        case 'electricity':
          possibleCauses = [
            'HVAC system malfunction',
            'Incorrect schedule settings',
            'Equipment left running',
            'Short circuit',
            'Faulty sensor reading'
          ];
          break;
        case 'water':
          possibleCauses = [
            'Water leak',
            'Irrigation system malfunction',
            'Cooling tower overflow',
            'Unusual occupancy pattern',
            'Faulty meter reading'
          ];
          break;
        case 'gas':
          possibleCauses = [
            'Heating system malfunction',
            'Thermostat override',
            'Boiler cycling issue',
            'Unexpected cold weather',
            'Inadequate insulation'
          ];
          break;
        default:
          possibleCauses = [
            'System malfunction',
            'Incorrect settings',
            'Unusual usage pattern',
            'Weather-related cause',
            'Sensor or meter issue'
          ];
      }
      
      // Select 1-3 possible causes
      const numCauses = 1 + Math.floor(seedRandom(0, 3));
      const shuffledCauses = [...possibleCauses].sort(() => seedRandom(0, 1) - 0.5);
      const selectedCauses = shuffledCauses.slice(0, numCauses);
      
      // Resolution information
      let resolvedAt, resolvedBy, resolutionNotes;
      if (status === 'resolved') {
        // Resolution happens 1 hour to 3 days after detection
        const resolutionDelay = (1 + seedRandom(0, 71)) * 60 * 60 * 1000;
        const resolutionDate = new Date(anomalyDate.getTime() + resolutionDelay);
        resolvedAt = resolutionDate.toISOString();
        resolvedBy = ['System Administrator', 'Facility Manager', 'Building Engineer', 'Energy Specialist'][
          Math.floor(seedRandom(0, 4))
        ];
        
        // Resolution notes
        const resolutionTemplates = [
          'Adjusted settings to correct the issue.',
          'Performed maintenance on equipment.',
          'Reset system and verified normal operation.',
          'Calibrated sensors and monitoring equipment.',
          'Repaired faulty component.',
          'Scheduled preventive maintenance to avoid recurrence.'
        ];
        resolutionNotes = resolutionTemplates[Math.floor(seedRandom(0, resolutionTemplates.length))];
      }
      
      return {
        id: anomalyId,
        buildingId,
        metric,
        timestamp: anomalyDate.toISOString(),
        duration,
        severity,
        expectedValue: Math.round(expectedValue * 100) / 100,
        actualValue: Math.round(actualValue * 100) / 100,
        percentageDeviation: Math.round(deviationPercent * 10) / 10 * (deviation < 0 ? -1 : 1),
        status,
        possibleCauses: selectedCauses,
        resolvedAt,
        resolvedBy,
        resolutionNotes
      };
    }
    
    // Fetch real data from PostgreSQL backend
    const response = await apiClient.get(getApiPath(`/analysis/anomalies/${anomalyId}`));
    
    // Transform API response to match our interface
    return {
      id: response.data.id,
      buildingId: response.data.building_id,
      metric: response.data.metric,
      timestamp: response.data.timestamp,
      duration: response.data.duration,
      severity: response.data.severity,
      expectedValue: response.data.expected_value,
      actualValue: response.data.actual_value,
      percentageDeviation: response.data.percentage_deviation,
      status: response.data.status,
      possibleCauses: response.data.possible_causes,
      resolvedAt: response.data.resolved_at,
      resolvedBy: response.data.resolved_by,
      resolutionNotes: response.data.resolution_notes
    };
    } catch (error) {
    console.error(`Error fetching anomaly details for ${anomalyId}:`, error);
    throw new Error(`Failed to fetch anomaly details: ${error}`);
  }
};

// Update anomaly status
export const updateAnomalyStatus = async (
  anomalyId: string,
  status: EnergyAnomaly['status'],
  notes?: string
): Promise<EnergyAnomaly> => {
  try {
    if (apiConfig.useMockData) {
      // Simulate API delay
      await createMockDelay();
      
      // Get current anomaly details
      const anomaly = await getAnomalyDetails(anomalyId);
      
      // Update status
      const updatedAnomaly = {
        ...anomaly,
        status
      };
      
      // If resolving, add resolution details
      if (status === 'resolved' && anomaly.status !== 'resolved') {
        updatedAnomaly.resolvedAt = new Date().toISOString();
        updatedAnomaly.resolvedBy = 'Current User';
        updatedAnomaly.resolutionNotes = notes || 'Issue resolved.';
      }
      
      return updatedAnomaly;
    }
    
    // Update via PostgreSQL backend
    const response = await apiClient.patch(getApiPath(`/analysis/anomalies/${anomalyId}`), {
      status,
      notes
    });
    
    // Transform API response
    return {
      id: response.data.id,
      buildingId: response.data.building_id,
      metric: response.data.metric,
      timestamp: response.data.timestamp,
      duration: response.data.duration,
      severity: response.data.severity,
      expectedValue: response.data.expected_value,
      actualValue: response.data.actual_value,
      percentageDeviation: response.data.percentage_deviation,
      status: response.data.status,
      possibleCauses: response.data.possible_causes,
      resolvedAt: response.data.resolved_at,
      resolvedBy: response.data.resolved_by,
      resolutionNotes: response.data.resolution_notes
    };
  } catch (error) {
    console.error(`Error updating anomaly status for ${anomalyId}:`, error);
    throw new Error(`Failed to update anomaly status: ${error}`);
  }
};

// Get energy consumption patterns for analysis
export const getPatterns = async (
  buildingId: string,
  metric: string = 'electricity',
  startDate: string,
  endDate: string
): Promise<any> => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock energy patterns data
      const hourlyPatterns: Record<number, number> = {};
      const dailyPatterns: Record<string, number> = {};
      const seasonalPatterns: Record<string, number> = {};
      
      // Generate hourly pattern (24 hours)
      for (let hour = 0; hour < 24; hour++) {
        const baseValue = 50 + Math.sin(hour * Math.PI / 12) * 30;
        hourlyPatterns[hour] = Math.round((baseValue + (Math.random() * 10 - 5)) * 10) / 10;
      }
      
      // Generate weekly pattern (7 days)
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      weekdays.forEach((day, i) => {
        const multiplier = i < 5 ? 1 : 0.7; // Weekend vs weekday
        dailyPatterns[day] = Math.round((75 + (Math.random() * 20 - 10)) * multiplier);
      });
      
      // Generate seasonal pattern (4 seasons)
      const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
      const baseSeasonalValues = metric === 'electricity' ? [80, 70, 100, 75] :
                                metric === 'gas' ? [100, 70, 50, 80] :
                                [70, 80, 90, 75];
                                
      seasons.forEach((season, i) => {
        seasonalPatterns[season] = Math.round((baseSeasonalValues[i] + (Math.random() * 20 - 10)) * 10) / 10;
      });
      
      // Calculate mock total consumption
      const totalConsumption = metric === 'electricity' ? 
        Math.round(8500 + Math.random() * 2000) : 
        metric === 'water' ? 
          Math.round(3500 + Math.random() * 1000) : 
          Math.round(2000 + Math.random() * 800);
      
      // Calculate mock average daily consumption
      // Assuming 30 days for the period
      const avgDailyConsumption = Math.round(totalConsumption / 30 * 10) / 10;
      
      return {
        hourly_patterns: hourlyPatterns,
        daily_patterns: dailyPatterns,
        seasonal_patterns: seasonalPatterns,
        total_consumption: totalConsumption,
        avg_daily_consumption: avgDailyConsumption
      };
    }
    
    // Sửa URL path để khớp với backend API
    const response = await apiClient.get(getApiPath('/analysis/patterns/' + buildingId), {
      params: {
        metric,
        start_date: startDate,
        end_date: endDate
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching energy patterns:', error);
    
    // Use shouldFallbackOnError utility to check if we should fallback
    if (shouldFallbackOnError()) {
      console.info('Falling back to mock data due to API error');
      await createMockDelay();
      
      // Generate mock energy patterns data
      const hourlyPatterns: Record<number, number> = {};
      const dailyPatterns: Record<string, number> = {};
      const seasonalPatterns: Record<string, number> = {};
      
      // Generate hourly pattern (24 hours)
      for (let hour = 0; hour < 24; hour++) {
        const baseValue = 50 + Math.sin(hour * Math.PI / 12) * 30;
        hourlyPatterns[hour] = Math.round((baseValue + (Math.random() * 10 - 5)) * 10) / 10;
      }
      
      // Generate weekly pattern (7 days)
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      weekdays.forEach((day, i) => {
        const multiplier = i < 5 ? 1 : 0.7; // Weekend vs weekday
        dailyPatterns[day] = Math.round((75 + (Math.random() * 20 - 10)) * multiplier);
      });
      
      // Generate seasonal pattern (4 seasons)
      const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
      const baseSeasonalValues = metric === 'electricity' ? [80, 70, 100, 75] :
                             metric === 'gas' ? [100, 70, 50, 80] :
                             [70, 80, 90, 75];
                             
      seasons.forEach((season, i) => {
        seasonalPatterns[season] = Math.round((baseSeasonalValues[i] + (Math.random() * 20 - 10)) * 10) / 10;
      });
      
      // Calculate mock total consumption
      const totalConsumption = metric === 'electricity' ? 
        Math.round(8500 + Math.random() * 2000) : 
        metric === 'water' ? 
          Math.round(3500 + Math.random() * 1000) : 
          Math.round(2000 + Math.random() * 800);
      
      // Calculate mock average daily consumption
      // Assuming 30 days for the period
      const avgDailyConsumption = Math.round(totalConsumption / 30 * 10) / 10;
      
      return {
        hourly_patterns: hourlyPatterns,
        daily_patterns: dailyPatterns,
        seasonal_patterns: seasonalPatterns,
        total_consumption: totalConsumption,
        avg_daily_consumption: avgDailyConsumption
      };
    } else {
      throw error;
    }
  }
};

// Get weather correlation data
export const getWeatherCorrelation = async (
  buildingId: string,
  metric: string = 'electricity',
  startDate: string,
  endDate: string
): Promise<any> => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock weather correlation data
      const weatherFactors = ['temperature', 'humidity', 'cloudCover', 'precipitation'];
      const correlations: Record<string, number> = {};
      
      weatherFactors.forEach(factor => {
        // Different correlations for different metrics
        let baseCorrelation;
        
        if (metric === 'electricity') {
          if (factor === 'temperature') baseCorrelation = 0.8;
          else if (factor === 'humidity') baseCorrelation = 0.4;
          else if (factor === 'cloudCover') baseCorrelation = 0.3;
          else baseCorrelation = 0.1;
        } else if (metric === 'gas') {
          if (factor === 'temperature') baseCorrelation = -0.85;
          else if (factor === 'humidity') baseCorrelation = 0.2;
          else if (factor === 'cloudCover') baseCorrelation = 0.15;
          else baseCorrelation = 0.05;
        } else {
          if (factor === 'temperature') baseCorrelation = 0.3;
          else if (factor === 'humidity') baseCorrelation = 0.2;
          else if (factor === 'cloudCover') baseCorrelation = 0.1;
          else baseCorrelation = 0.5;
        }
        
        // Add some randomness
        correlations[factor] = Math.round((baseCorrelation + (Math.random() * 0.2 - 0.1)) * 100) / 100;
      });
      
      // Generate sample data points for temperature vs consumption
      const temperatureRange = metric === 'electricity' ? 
        { min: 10, max: 40 } : // Higher consumption at higher temps for electricity (cooling)
        metric === 'gas' ? 
          { min: -10, max: 25 } : // Higher consumption at lower temps for gas (heating)
          { min: 0, max: 35 }; // Moderate correlation for water
      
      const dataPoints = [];
      const pointCount = 30; // 30 data points
      
      for (let i = 0; i < pointCount; i++) {
        const temperature = temperatureRange.min + (Math.random() * (temperatureRange.max - temperatureRange.min));
        
        // Calculate consumption based on temperature with some noise
        let consumption;
        if (metric === 'electricity') {
          // Positive correlation - higher at higher temps
          const baseLine = 50 + (temperature - temperatureRange.min) * 3;
          consumption = baseLine + (Math.random() * 30 - 15);
        } else if (metric === 'gas') {
          // Negative correlation - higher at lower temps
          const baseLine = 150 - (temperature - temperatureRange.min) * 3;
          consumption = baseLine + (Math.random() * 30 - 15);
        } else {
          // Weak correlation for water
          const baseLine = 80 + (temperature - temperatureRange.min) * 0.5;
          consumption = baseLine + (Math.random() * 40 - 20);
        }
        
        dataPoints.push({
          temperature: Math.round(temperature),
          consumption: Math.round(consumption)
        });
      }
      
      // Sort by temperature for better chart
      dataPoints.sort((a, b) => a.temperature - b.temperature);
      
      // Calculate correlation coefficient
      const correlation_coefficient = correlations['temperature'];
      
      return { 
        correlations,
        data: dataPoints,
        correlation_coefficient
      };
    }
    
    // Sửa URL path để khớp với backend API
    const response = await apiClient.get(getApiPath('/analysis/weather-correlation/' + buildingId), {
      params: {
        metric,
        start_date: startDate,
        end_date: endDate
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather correlation:', error);
    
    // Use shouldFallbackOnError utility to check if we should fallback
    if (shouldFallbackOnError()) {
      console.info('Falling back to mock data due to API error');
      await createMockDelay();
      
      // Generate mock weather correlation data
      const weatherFactors = ['temperature', 'humidity', 'cloudCover', 'precipitation'];
      const correlations: Record<string, number> = {};
      
      weatherFactors.forEach(factor => {
        // Different correlations for different metrics
        let baseCorrelation;
        
        if (metric === 'electricity') {
          if (factor === 'temperature') baseCorrelation = 0.8;
          else if (factor === 'humidity') baseCorrelation = 0.4;
          else if (factor === 'cloudCover') baseCorrelation = 0.3;
          else baseCorrelation = 0.1;
        } else if (metric === 'gas') {
          if (factor === 'temperature') baseCorrelation = -0.85;
          else if (factor === 'humidity') baseCorrelation = 0.2;
          else if (factor === 'cloudCover') baseCorrelation = 0.15;
          else baseCorrelation = 0.05;
        } else {
          if (factor === 'temperature') baseCorrelation = 0.3;
          else if (factor === 'humidity') baseCorrelation = 0.2;
          else if (factor === 'cloudCover') baseCorrelation = 0.1;
          else baseCorrelation = 0.5;
        }
        
        // Add some randomness
        correlations[factor] = Math.round((baseCorrelation + (Math.random() * 0.2 - 0.1)) * 100) / 100;
      });
      
      const temperatureRange = metric === 'electricity' ? 
        { min: 10, max: 40 } : // Higher consumption at higher temps for electricity (cooling)
        metric === 'gas' ? 
          { min: -10, max: 25 } : // Higher consumption at lower temps for gas (heating)
          { min: 0, max: 35 }; // Moderate correlation for water
      
      const dataPoints = [];
      const pointCount = 30; // 30 data points
      
      for (let i = 0; i < pointCount; i++) {
        const temperature = temperatureRange.min + (Math.random() * (temperatureRange.max - temperatureRange.min));
        
        // Calculate consumption based on temperature with some noise
        let consumption;
        if (metric === 'electricity') {
          // Positive correlation - higher at higher temps
          const baseLine = 50 + (temperature - temperatureRange.min) * 3;
          consumption = baseLine + (Math.random() * 30 - 15);
        } else if (metric === 'gas') {
          // Negative correlation - higher at lower temps
          const baseLine = 150 - (temperature - temperatureRange.min) * 3;
          consumption = baseLine + (Math.random() * 30 - 15);
        } else {
          // Weak correlation for water
          const baseLine = 80 + (temperature - temperatureRange.min) * 0.5;
          consumption = baseLine + (Math.random() * 40 - 20);
        }
        
        dataPoints.push({
          temperature: Math.round(temperature),
          consumption: Math.round(consumption)
        });
      }
      
      // Sort by temperature for better chart
      dataPoints.sort((a, b) => a.temperature - b.temperature);
      
      return { 
        correlations,
        data: dataPoints,
        correlation_coefficient: correlations['temperature']
      };
    } else {
      throw error;
    }
  }
};

// Get anomalies for a building within date range
export const getAnomalies = async (
  buildingId: string,
  startDate: string,
  endDate: string
): Promise<AnomalyResult> => {
  try {
    if (apiConfig.useMockData) {
      // Use mock data for development
      console.info('Using mock data for anomalies');
      await createMockDelay();
      
      // Generate 2-4 random anomalies
      const numAnomalies = 2 + Math.floor(Math.random() * 3);
      
      // Create array of dates in range
      const dateStart = new Date(startDate);
      const dateEnd = new Date(endDate);
      const daysBetween = Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24));
      
      // Generate anomalies with random dates in the range
      const anomalies = Array.from({ length: numAnomalies }, (_, i) => {
        // Random date in range
        const randomDay = Math.floor(Math.random() * daysBetween);
        const anomalyDate = new Date(dateStart);
        anomalyDate.setDate(dateStart.getDate() + randomDay);
        
        // Random hour
        const hour = Math.floor(Math.random() * 24);
        anomalyDate.setHours(hour);
        
        return {
          id: `anom-${buildingId}-${i}`,
          timestamp: anomalyDate.toISOString(),
          type: Math.random() > 0.5 ? 'spike' : 'drop',
          severity: Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low'),
          value: Math.round((Math.random() * 150 + 100) * 10) / 10,
          expected_value: Math.round((Math.random() * 50 + 80) * 10) / 10,
          description: `Unexpected ${Math.random() > 0.5 ? 'spike' : 'drop'} in energy consumption`
        };
      });
      
      return {
        building_id: buildingId,
        period: { start: startDate, end: endDate },
        anomaly_count: anomalies.length,
        anomalies
      };
    }
    
    // Fetch real data from API
    console.info(`Fetching anomalies from PostgreSQL for building ${buildingId}`);
    const response = await apiClient.get(getApiPath(`/analysis/anomalies/${buildingId}`), {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    
    console.info('Successfully retrieved anomalies from PostgreSQL');
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    
    // Check if should fallback to mock data
    if (apiConfig.fallbackToMockOnError) {
      console.warn('Falling back to mock data for anomalies due to API error');
      
      // Generate mock data
      await createMockDelay();
      
      // Generate 2-4 random anomalies
      const numAnomalies = 2 + Math.floor(Math.random() * 3);
      
      // Create array of dates in range
      const dateStart = new Date(startDate);
      const dateEnd = new Date(endDate);
      const daysBetween = Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 3600 * 24));
      
      // Generate anomalies with random dates in the range
      const anomalies = Array.from({ length: numAnomalies }, (_, i) => {
        // Random date in range
        const randomDay = Math.floor(Math.random() * daysBetween);
        const anomalyDate = new Date(dateStart);
        anomalyDate.setDate(dateStart.getDate() + randomDay);
        
        // Random hour
        const hour = Math.floor(Math.random() * 24);
        anomalyDate.setHours(hour);
        
        return {
          id: `anom-${buildingId}-${i}`,
          timestamp: anomalyDate.toISOString(),
          type: Math.random() > 0.5 ? 'spike' : 'drop',
          severity: Math.random() > 0.7 ? 'high' : (Math.random() > 0.4 ? 'medium' : 'low'),
          value: Math.round((Math.random() * 150 + 100) * 10) / 10,
          expected_value: Math.round((Math.random() * 50 + 80) * 10) / 10,
          description: `Unexpected ${Math.random() > 0.5 ? 'spike' : 'drop'} in energy consumption`
        };
      });
      
      return {
        building_id: buildingId,
        period: { start: startDate, end: endDate },
        anomaly_count: anomalies.length,
        anomalies
      };
    } else {
      throw error;
    }
  }
};

// Alias for getAnomalies for compatibility
export const getDetailedAnomalies = getAnomalies;

// Get efficiency metrics for a building
export const getEfficiencyMetrics = async (
  buildingId: string
) => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock efficiency metrics data
      const metrics: Record<string, number> = {
        energy_usage_intensity: Math.round((Math.random() * 100 + 50) * 10) / 10,
        energy_star_score: Math.round(Math.random() * 100),
        carbon_footprint: Math.round((Math.random() * 500 + 100) * 10) / 10,
        operational_efficiency: Math.round((Math.random() * 50 + 50) * 10) / 10,
        occupant_comfort_score: Math.round((Math.random() * 20 + 80) * 10) / 10,
        maintenance_health_index: Math.round((Math.random() * 30 + 70) * 10) / 10
      };
      
      // Add historical comparison
      const yearOverYear: Record<string, number> = {};
      Object.keys(metrics).forEach(metric => {
        const changePercent = Math.round((Math.random() * 20 - 10) * 10) / 10;
        yearOverYear[metric] = changePercent;
      });
      
      return {
        current_metrics: metrics,
        year_over_year_change: yearOverYear,
        last_updated: new Date().toISOString()
      };
    }
    
    // Fetch real data from API
    const response = await apiClient.get(getApiPath(`/analysis/buildings/${buildingId}/efficiency-metrics`));
    return response.data;
  } catch (error) {
    console.error('Error fetching efficiency metrics:', error);
    return { metrics: [] };
  }
};

// Get portfolio costs breakdown
export const getPortfolioCosts = async (
  period: string = '1y'
) => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock portfolio costs data
      const costCategories = ['electricity', 'gas', 'water', 'maintenance', 'operations'];
      const costs: Record<string, number> = {};
      
      costCategories.forEach(category => {
        let baseCost;
        
        // Different base costs for different categories
        if (category === 'electricity') baseCost = 400000;
        else if (category === 'gas') baseCost = 150000;
        else if (category === 'water') baseCost = 80000;
        else if (category === 'maintenance') baseCost = 120000;
        else baseCost = 200000;
        
        // Add some randomness
        costs[category] = Math.round(baseCost * (0.9 + Math.random() * 0.2));
      });
      
      // Generate monthly breakdown with seasonal variations
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData: Array<{month: string, value: number}> = [];
      
      let totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
      const monthlyBase = totalCost / 12;
      
      months.forEach((month, index) => {
        // Create seasonal variations
        let seasonMultiplier;
        if (index < 2 || index === 11) seasonMultiplier = 1.2; // Winter
        else if (index >= 2 && index < 5) seasonMultiplier = 0.9; // Spring
        else if (index >= 5 && index < 8) seasonMultiplier = 1.3; // Summer
        else seasonMultiplier = 0.85; // Fall
        
        const randomVariation = 0.9 + Math.random() * 0.2;
        const monthValue = Math.round(monthlyBase * seasonMultiplier * randomVariation);
        
        monthlyData.push({
          month,
          value: monthValue
        });
      });
      
      return {
        total_costs: Math.round(totalCost),
        by_category: costs,
        monthly_breakdown: monthlyData,
        comparison_to_previous: Math.round((Math.random() * 14 - 7) * 10) / 10 // -7% to +7%
      };
    }
    
    // Fetch real data from API
    const response = await apiClient.get(getApiPath('/analysis/portfolio/costs'), {
      params: { timeframe: period }
    });
    
      return response.data;
    } catch (error) {
    console.error('Error fetching portfolio costs:', error);
    return { costs: [] };
  }
};

// Get portfolio efficiency trend data
export const getPortfolioEfficiencyTrend = async (
  period: string = '1y'
) => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock efficiency trend data showing gradual improvement
      const numDataPoints = period === '1m' ? 30 : 
                            period === '3m' ? 12 : 
                            period === '6m' ? 24 : 12; // 12 for 1y (monthly)
      
      const dataPoints: Array<{date: string, value: number}> = [];
      const baseDate = new Date();
      const incrementDays = period === '1m' ? 1 : 
                            period === '3m' ? 7 : 
                            period === '6m' ? 7 : 30; // 30 for 1y (monthly)
      
      // Start date based on period
      baseDate.setDate(baseDate.getDate() - (numDataPoints * incrementDays));
      
      // Start with baseline efficiency (70-80)
      let efficiency = 70 + Math.random() * 10;
      
      for (let i = 0; i < numDataPoints; i++) {
        // Add some random variation but with overall upward trend
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i * incrementDays));
        
        // Gradual improvement with random variations
        const improvement = (i / numDataPoints) * 10; // Up to 10% improvement over period
        const randomVariation = (Math.random() * 4) - 2; // -2 to +2 random variation
        
        efficiency = Math.min(98, efficiency + (improvement / numDataPoints) + randomVariation);
        
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(efficiency * 10) / 10
        });
      }
      
      return {
        trend_data: dataPoints,
        current_efficiency: dataPoints[dataPoints.length - 1].value,
        starting_efficiency: dataPoints[0].value,
        change_percent: Math.round(((dataPoints[dataPoints.length - 1].value - dataPoints[0].value) / dataPoints[0].value * 100) * 10) / 10
      };
    }
    
    // Fetch real data from API
    const response = await apiClient.get(getApiPath('/analysis/portfolio/efficiency-trend'), {
      params: { timeframe: period }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio efficiency trend:', error);
    return { trend: [] };
  }
};

// Get potential savings opportunities
export const getPortfolioSavingsOpportunities = async () => {
  try {
    if (apiConfig.useMockData) {
      await createMockDelay();
      
      // Generate mock savings opportunities
      const categories = ['Lighting', 'HVAC', 'Equipment', 'Scheduling', 'Operations', 'Behavioral'];
      const opportunities: Array<{
        id: string,
        category: string,
        title: string,
        description: string,
        estimated_savings: number,
        implementation_cost: number,
        payback_period: number,
        complexity: string
      }> = [];
      
      // Complexity levels
      const complexityLevels = ['Low', 'Medium', 'High'];
      
      categories.forEach((category, index) => {
        // Create 1-2 opportunities per category
        const numOpportunities = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < numOpportunities; i++) {
          const savings = Math.round((10000 + Math.random() * 90000) / 100) * 100;
          const cost = Math.round((savings * (0.3 + Math.random() * 0.7) / 100) * 100);
          const payback = Math.round((cost / (savings / 12) * 10)) / 10;
          const complexity = complexityLevels[Math.floor(Math.random() * complexityLevels.length)];
          
          let title, description;
          
          switch (category) {
            case 'Lighting':
              title = i === 0 ? 'LED Lighting Upgrade' : 'Occupancy Sensors Installation';
              description = i === 0 ? 'Replace existing fixtures with high-efficiency LED lighting'
                                  : 'Install occupancy sensors in low-traffic areas';
              break;
            case 'HVAC':
              title = i === 0 ? 'Temperature Setpoint Optimization' : 'Variable Frequency Drive Installation';
              description = i === 0 ? 'Optimize temperature setpoints based on occupancy patterns'
                                  : 'Install VFDs on pumps and fans for energy savings';
              break;
            case 'Equipment':
              title = i === 0 ? 'Energy-Efficient Equipment Upgrade' : 'Equipment Maintenance Program';
              description = i === 0 ? 'Replace aging equipment with ENERGY STAR certified alternatives'
                                  : 'Implement proactive maintenance program for critical equipment';
              break;
            case 'Scheduling':
              title = i === 0 ? 'Optimized Building Schedule' : 'Smart Weekend Setback';
              description = i === 0 ? 'Align building systems operation with actual occupancy schedule'
                                  : 'Implement deeper setbacks during weekend periods';
              break;
            case 'Operations':
              title = i === 0 ? 'BMS Optimization' : 'Energy Management System Upgrade';
              description = i === 0 ? 'Fine-tune Building Management System for optimal performance'
                                  : 'Upgrade to advanced Energy Management System with AI capabilities';
              break;
            case 'Behavioral':
              title = i === 0 ? 'Occupant Engagement Program' : 'Energy-Saving Competition';
              description = i === 0 ? 'Launch occupant engagement program focusing on energy conservation'
                                  : 'Organize inter-department energy-saving competition';
              break;
            default:
              title = 'General Energy Efficiency Measure';
              description = 'Implement general energy efficiency improvements';
          }
          
          opportunities.push({
            id: `opportunity-${index}-${i}`,
            category,
            title,
            description,
            estimated_savings: savings,
            implementation_cost: cost,
            payback_period: payback,
            complexity
          });
        }
      });
      
      return { 
        opportunities,
        total_potential_savings: opportunities.reduce((sum, item) => sum + item.estimated_savings, 0),
        average_payback_period: Math.round(opportunities.reduce((sum, item) => sum + item.payback_period, 0) / opportunities.length * 10) / 10
      };
    }
    
    // Fetch real data from API
    const response = await apiClient.get(getApiPath('/analysis/portfolio/savings-opportunities'));
      return response.data;
    } catch (error) {
    console.error('Error fetching portfolio savings opportunities:', error);
    return { opportunities: [] };
  }
};

// Get comprehensive analysis for a building
export const getComprehensiveAnalysis = async (
  buildingId: string,
  startDate: string,
  endDate: string,
  userRole: string = 'facility_manager'
): Promise<ComprehensiveAnalysisResult> => {
  try {
    if (apiConfig.useMockData) {
      // Use mock data for development
      console.info('Using mock data for comprehensive analysis');
      await createMockDelay();
      
      // Generate mock data from other mock methods
      const analysisData = generateMockEnergyAnalysis(buildingId, startDate, endDate);
      const anomaliesData = (await getAnomalies(buildingId, startDate, endDate)).anomalies;
      
      // Generate mock forecast data
      const mockForecast = {
        daily_values: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return {
            date: date.toISOString().split('T')[0],
            value: 100 + Math.random() * 50,
            lower_bound: 90 + Math.random() * 40,
            upper_bound: 120 + Math.random() * 60
          };
        }),
        weekly_values: Array.from({ length: 4 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + (i + 1) * 7);
          return {
            date: date.toISOString().split('T')[0],
            value: 700 + Math.random() * 300,
            lower_bound: 650 + Math.random() * 250,
            upper_bound: 800 + Math.random() * 350
          };
        })
      };
      
      // Generate mock recommendations
      const mockRecommendations = [
        {
          id: `rec-${buildingId}-1`,
          title: 'Optimize HVAC Schedule',
          description: 'Adjust HVAC operating hours to match actual building occupancy patterns',
          potential_savings: Math.round(5000 + Math.random() * 3000),
          implementation_cost: Math.round(1000 + Math.random() * 1000),
          payback_period: Math.round((2 + Math.random() * 6) * 10) / 10,
          priority: 'high',
          implementation_difficulty: 'medium'
        },
        {
          id: `rec-${buildingId}-2`,
          title: 'LED Lighting Upgrade',
          description: 'Replace existing fluorescent fixtures with LED lighting',
          potential_savings: Math.round(8000 + Math.random() * 4000),
          implementation_cost: Math.round(15000 + Math.random() * 5000),
          payback_period: Math.round((12 + Math.random() * 12) * 10) / 10,
          priority: 'medium',
          implementation_difficulty: 'high'
        },
        {
          id: `rec-${buildingId}-3`,
          title: 'Reduce Overnight Base Load',
          description: 'Identify and turn off non-essential equipment during unoccupied hours',
          potential_savings: Math.round(3000 + Math.random() * 2000),
          implementation_cost: Math.round(500 + Math.random() * 500),
          payback_period: Math.round((1 + Math.random() * 3) * 10) / 10,
          priority: 'high',
          implementation_difficulty: 'low'
        }
      ];
      
      return {
        building_id: buildingId,
        analysis_type: 'comprehensive',
        timestamp: new Date().toISOString(),
        period: {
          start: startDate,
          end: endDate
        },
        results: {
          historical_analysis: {
            patterns: analysisData.topPatterns,
            metrics: analysisData.efficiencyMetrics
          },
          anomalies: anomaliesData,
          short_term_forecast: mockForecast.daily_values,
          long_term_forecast: mockForecast.weekly_values,
          recommendations: mockRecommendations
        }
      };
    }
    
    // Fetch real data from API
    console.info(`Fetching comprehensive analysis from PostgreSQL for building ${buildingId}`);
    const response = await apiClient.get(getApiPath(`/analysis/comprehensive/${buildingId}`), {
      params: {
        start_date: startDate,
        end_date: endDate,
        user_role: userRole
      }
    });
    
    console.info('Successfully retrieved comprehensive analysis from PostgreSQL');
    return response.data;
  } catch (error) {
    console.error('Error fetching comprehensive analysis:', error);
    
    // Check if should fallback to mock data
    if (apiConfig.fallbackToMockOnError) {
      console.warn('Falling back to mock data for comprehensive analysis due to API error');
      
      // Generate mock data
      await createMockDelay();
      
      // Generate mock data from other mock methods
      const analysisData = generateMockEnergyAnalysis(buildingId, startDate, endDate);
      const anomaliesData = (await getAnomalies(buildingId, startDate, endDate)).anomalies;
      
      // Generate mock forecast data
      const mockForecast = {
        daily_values: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return {
            date: date.toISOString().split('T')[0],
            value: 100 + Math.random() * 50,
            lower_bound: 90 + Math.random() * 40,
            upper_bound: 120 + Math.random() * 60
          };
        }),
        weekly_values: Array.from({ length: 4 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + (i + 1) * 7);
          return {
            date: date.toISOString().split('T')[0],
            value: 700 + Math.random() * 300,
            lower_bound: 650 + Math.random() * 250,
            upper_bound: 800 + Math.random() * 350
          };
        })
      };
      
      // Generate mock recommendations
      const mockRecommendations = [
        {
          id: `rec-${buildingId}-1`,
          title: 'Optimize HVAC Schedule',
          description: 'Adjust HVAC operating hours to match actual building occupancy patterns',
          potential_savings: Math.round(5000 + Math.random() * 3000),
          implementation_cost: Math.round(1000 + Math.random() * 1000),
          payback_period: Math.round((2 + Math.random() * 6) * 10) / 10,
          priority: 'high',
          implementation_difficulty: 'medium'
        },
        {
          id: `rec-${buildingId}-2`,
          title: 'LED Lighting Upgrade',
          description: 'Replace existing fluorescent fixtures with LED lighting',
          potential_savings: Math.round(8000 + Math.random() * 4000),
          implementation_cost: Math.round(15000 + Math.random() * 5000),
          payback_period: Math.round((12 + Math.random() * 12) * 10) / 10,
          priority: 'medium',
          implementation_difficulty: 'high'
        },
        {
          id: `rec-${buildingId}-3`,
          title: 'Reduce Overnight Base Load',
          description: 'Identify and turn off non-essential equipment during unoccupied hours',
          potential_savings: Math.round(3000 + Math.random() * 2000),
          implementation_cost: Math.round(500 + Math.random() * 500),
          payback_period: Math.round((1 + Math.random() * 3) * 10) / 10,
          priority: 'high',
          implementation_difficulty: 'low'
        }
      ];
      
      return {
        building_id: buildingId,
        analysis_type: 'comprehensive',
        timestamp: new Date().toISOString(),
        period: {
          start: startDate,
          end: endDate
        },
        results: {
          historical_analysis: {
            patterns: analysisData.topPatterns,
            metrics: analysisData.efficiencyMetrics
          },
          anomalies: anomaliesData,
          short_term_forecast: mockForecast.daily_values,
          long_term_forecast: mockForecast.weekly_values,
          recommendations: mockRecommendations
        }
      };
    } else {
      throw error;
    }
  }
};

// Default export
const analysisApi = {
  getBuildingEnergyAnalysis,
  getAnomalyDetails,
  updateAnomalyStatus,
  getPatterns,
  getWeatherCorrelation,
  getAnomalies,
  getDetailedAnomalies,
  getEfficiencyMetrics,
  getPortfolioCosts,
  getPortfolioEfficiencyTrend,
  getPortfolioSavingsOpportunities,
  getComprehensiveAnalysis
};

export default analysisApi; 