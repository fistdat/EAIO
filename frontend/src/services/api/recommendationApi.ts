// Recommendation API service for the Energy AI Optimizer frontend
import axios from 'axios';
import { apiConfig, createMockDelay, formatApiPath } from '../../utils/apiConfig';
import { format, parseISO, subDays } from 'date-fns';

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

// Recommendation data interfaces
export interface EnergySavingRecommendation {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  detail: string;
  category: 'operational' | 'maintenance' | 'retrofit' | 'behavioral' | 'scheduling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedSavings: {
    energy: number; // kWh or equivalent
    cost: number;   // in currency
    carbon: number; // kg CO2e
  };
  implementationCost: {
    amount: number;
    unit: string;
    level: 'low' | 'medium' | 'high';
  };
  paybackPeriod: number; // in months
  roi: number; // percentage
  difficultyLevel: 'easy' | 'moderate' | 'complex';
  metrics: Array<'electricity' | 'water' | 'gas' | 'steam' | 'hotwater' | 'chilledwater'>;
  status: 'new' | 'in_progress' | 'implemented' | 'rejected' | 'planned';
  implementationSteps: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  implementedAt?: string;
  relatedAnomalyIds?: string[];
}

export interface RecommendationResponse {
  recommendations: EnergySavingRecommendation[];
  totalCount: number;
  implementedCount: number;
  inProgressCount: number;
  potentialSavings: {
    energy: number;
    cost: number;
    carbon: number;
  };
  achievedSavings: {
    energy: number;
    cost: number;
    carbon: number;
  };
}

// Generate mock recommendations for development
export const generateMockRecommendations = (
  buildingId: string,
  limit: number = 10,
  status?: EnergySavingRecommendation['status']
): RecommendationResponse => {
  // Array of recommendation templates
  const recommendationTemplates = [
    {
      title: 'Optimize HVAC Schedule',
      description: 'Adjust HVAC operation schedules to better match occupancy patterns',
      detail: 'Analysis of building occupancy data shows that the HVAC system starts 2 hours before significant occupancy begins. Adjusting the schedule to start 1 hour before occupancy could save energy while maintaining comfort conditions.',
      category: 'scheduling',
      priority: 'high',
      energySavingsPercent: 8,
      costMin: 0,
      costMax: 500,
      paybackMin: 0,
      paybackMax: 3,
      difficulty: 'easy',
      metrics: ['electricity', 'gas'],
      steps: [
        'Review current HVAC schedules in building management system',
        'Analyze occupancy data to determine optimal start times',
        'Implement adjusted schedule in BMS',
        'Monitor indoor temperature and comfort for 1 week',
        'Make final adjustments based on occupant feedback'
      ]
    },
    {
      title: 'Reduce Lighting Power Density',
      description: 'Replace existing lighting fixtures with LED alternatives',
      detail: 'The current lighting system uses outdated technology with high energy consumption. Upgrading to LED fixtures would reduce electricity use while improving light quality and reducing maintenance costs due to longer lamp life.',
      category: 'retrofit',
      priority: 'medium',
      energySavingsPercent: 12,
      costMin: 10000,
      costMax: 25000,
      paybackMin: 18,
      paybackMax: 36,
      difficulty: 'moderate',
      metrics: ['electricity'],
      steps: [
        'Conduct lighting audit to identify fixture types and counts',
        'Develop lighting retrofit plan with LED alternatives',
        'Obtain quotes from qualified lighting contractors',
        'Schedule installation with minimal disruption to occupants',
        'Commission new system and verify energy savings'
      ]
    },
    {
      title: 'Implement Night Setback Temperatures',
      description: 'Program building automation system to use energy-saving temperature setpoints during unoccupied hours',
      detail: 'Current temperature settings maintain comfort conditions 24/7. Implementing setbacks during unoccupied periods (raising cooling setpoints and lowering heating setpoints) can significantly reduce energy consumption without impacting occupant comfort.',
      category: 'operational',
      priority: 'high',
      energySavingsPercent: 10,
      costMin: 0,
      costMax: 1000,
      paybackMin: 0,
      paybackMax: 6,
      difficulty: 'easy',
      metrics: ['electricity', 'gas'],
      steps: [
        'Identify appropriate setback temperatures for heating and cooling seasons',
        'Program building automation system with new setpoints and schedules',
        'Test operation during a weekend to verify proper recovery times',
        'Implement permanent schedule changes',
        'Document new settings for operations staff'
      ]
    },
    {
      title: 'Install Variable Frequency Drives on Pumps',
      description: 'Add VFDs to hydronic system pumps to reduce energy consumption',
      detail: 'The building\'s hydronic systems currently use constant-speed pumps regardless of actual load requirements. Installing VFDs would allow pump speeds to modulate based on demand, significantly reducing electrical consumption during partial-load conditions.',
      category: 'retrofit',
      priority: 'medium',
      energySavingsPercent: 15,
      costMin: 15000,
      costMax: 40000,
      paybackMin: 24,
      paybackMax: 48,
      difficulty: 'complex',
      metrics: ['electricity'],
      steps: [
        'Identify pumps suitable for VFD installation',
        'Conduct engineering analysis of system requirements',
        'Specify appropriate VFD models and obtain quotes',
        'Schedule installation with qualified contractor',
        'Program VFDs for optimal operation',
        'Commission system and train operations staff'
      ]
    },
    {
      title: 'Implement Water Conservation Measures',
      description: 'Install low-flow fixtures and address leaks to reduce water consumption',
      detail: 'Water consumption analysis indicates higher than typical usage for this building type. Installing low-flow aerators, upgrading flush valves, and repairing identified leaks will reduce water consumption and associated costs.',
      category: 'maintenance',
      priority: 'medium',
      energySavingsPercent: 5,
      costMin: 3000,
      costMax: 12000,
      paybackMin: 12,
      paybackMax: 24,
      difficulty: 'moderate',
      metrics: ['water', 'hotwater'],
      steps: [
        'Conduct water audit to identify conservation opportunities',
        'Repair any identified leaks immediately',
        'Inventory existing fixtures and flow rates',
        'Purchase and install low-flow replacements',
        'Educate occupants on water conservation practices',
        'Monitor consumption to verify savings'
      ]
    },
    {
      title: 'Optimize Boiler Operation',
      description: 'Tune boiler controls and improve maintenance practices',
      detail: 'Current boiler operation shows inefficiencies in cycling and temperature settings. Optimizing combustion efficiency, implementing proper maintenance, and adjusting hot water temperature setpoints could yield significant gas savings.',
      category: 'maintenance',
      priority: 'high',
      energySavingsPercent: 8,
      costMin: 2000,
      costMax: 5000,
      paybackMin: 6,
      paybackMax: 18,
      difficulty: 'moderate',
      metrics: ['gas', 'steam', 'hotwater'],
      steps: [
        'Conduct combustion efficiency testing',
        'Clean heat exchanger surfaces',
        'Calibrate controls and sensors',
        'Adjust water temperature setpoints',
        'Implement regular maintenance schedule',
        'Train operations staff on optimized procedures'
      ]
    },
    {
      title: 'Enable Equipment Economizer Modes',
      description: 'Utilize free cooling when outdoor conditions are favorable',
      detail: 'The building\'s HVAC system includes economizer capabilities that are not fully utilized. Properly configuring economizer controls to use outside air for cooling when conditions permit will reduce mechanical cooling requirements and energy use.',
      category: 'operational',
      priority: 'medium',
      energySavingsPercent: 6,
      costMin: 500,
      costMax: 3000,
      paybackMin: 3,
      paybackMax: 12,
      difficulty: 'moderate',
      metrics: ['electricity', 'chilledwater'],
      steps: [
        'Verify proper operation of economizer dampers and actuators',
        'Calibrate outside air temperature and humidity sensors',
        'Program economizer control sequences with appropriate setpoints',
        'Test operation under various weather conditions',
        'Train operations staff on troubleshooting procedures'
      ]
    },
    {
      title: 'Implement Occupancy-Based Lighting Controls',
      description: 'Install occupancy sensors to automatically control lighting in low-use areas',
      detail: 'Several areas in the building have intermittent occupancy but lighting remains on continuously. Installing occupancy sensors in storage rooms, conference rooms, and restrooms will reduce unnecessary lighting operation.',
      category: 'retrofit',
      priority: 'medium',
      energySavingsPercent: 7,
      costMin: 5000,
      costMax: 15000,
      paybackMin: 12,
      paybackMax: 30,
      difficulty: 'moderate',
      metrics: ['electricity'],
      steps: [
        'Identify suitable locations for occupancy sensors',
        'Select appropriate sensor technologies for each space',
        'Obtain quotes from qualified electrical contractors',
        'Install and commission sensors',
        'Educate occupants on new lighting operation',
        'Verify proper operation and adjust sensitivity as needed'
      ]
    },
    {
      title: 'Reduce Equipment Standby Power',
      description: 'Implement power management for office equipment and shared devices',
      detail: 'Network analysis shows significant power consumption during unoccupied hours from computers, printers, and other office equipment. Implementing power management policies and automatic shutdown procedures will reduce this standby consumption.',
      category: 'behavioral',
      priority: 'low',
      energySavingsPercent: 3,
      costMin: 0,
      costMax: 1000,
      paybackMin: 0,
      paybackMax: 6,
      difficulty: 'easy',
      metrics: ['electricity'],
      steps: [
        'Audit after-hours equipment operation',
        'Configure power management settings on computers and shared devices',
        'Install smart power strips for peripheral equipment',
        'Create and distribute power management policy to occupants',
        'Conduct follow-up audit to verify compliance and savings'
      ]
    },
    {
      title: 'Optimize Chiller Sequencing',
      description: 'Improve chiller plant control strategies for multiple chillers',
      detail: 'The current chiller operation does not efficiently stage multiple units based on cooling load. Implementing improved sequencing controls will ensure chillers operate at their most efficient points and minimize energy consumption.',
      category: 'operational',
      priority: 'high',
      energySavingsPercent: 12,
      costMin: 5000,
      costMax: 15000,
      paybackMin: 12,
      paybackMax: 24,
      difficulty: 'complex',
      metrics: ['electricity', 'chilledwater'],
      steps: [
        'Analyze current chiller performance data',
        'Develop improved sequencing strategies based on efficiency curves',
        'Update building automation system programming',
        'Implement new control sequences',
        'Monitor performance across various load conditions',
        'Fine-tune sequencing parameters based on performance data',
        'Document new strategies for operations staff'
      ]
    },
    {
      title: 'Improve Building Envelope',
      description: 'Seal air leaks and improve insulation to reduce thermal losses',
      detail: 'Thermal imaging and pressure testing indicate air leakage and insulation deficiencies in several areas. Addressing these envelope issues will reduce heating and cooling loads while improving occupant comfort near exterior walls and windows.',
      category: 'retrofit',
      priority: 'medium',
      energySavingsPercent: 8,
      costMin: 15000,
      costMax: 50000,
      paybackMin: 36,
      paybackMax: 60,
      difficulty: 'complex',
      metrics: ['electricity', 'gas'],
      steps: [
        'Conduct comprehensive envelope assessment',
        'Prioritize improvements based on cost-effectiveness',
        'Develop scope of work for contractors',
        'Obtain quotes for air sealing and insulation improvements',
        'Schedule work to minimize disruption to occupants',
        'Verify quality of improvements with follow-up testing',
        'Document changes for future reference'
      ]
    },
    {
      title: 'Enable Demand-Controlled Ventilation',
      description: 'Modulate outdoor air based on actual occupancy using CO2 sensors',
      detail: 'The ventilation system currently provides fixed outdoor air quantities regardless of actual occupancy. Installing CO2 sensors and implementing demand-controlled ventilation will reduce heating and cooling of unnecessary outdoor air while maintaining air quality.',
      category: 'retrofit',
      priority: 'medium',
      energySavingsPercent: 9,
      costMin: 8000,
      costMax: 20000,
      paybackMin: 18,
      paybackMax: 36,
      difficulty: 'moderate',
      metrics: ['electricity', 'gas'],
      steps: [
        'Identify zones suitable for demand-controlled ventilation',
        'Install CO2 sensors in return air ducts or representative spaces',
        'Program building automation system with DCV control sequences',
        'Commission system operation',
        'Verify proper air quality under various occupancy conditions',
        'Document new control strategies for operations staff'
      ]
    },
    {
      title: 'Implement Temperature Deadband',
      description: 'Expand the gap between heating and cooling setpoints to prevent system fighting',
      detail: 'Current temperature control has minimal separation between heating and cooling setpoints, potentially allowing simultaneous operation. Implementing a 3-5°F deadband between heating and cooling modes will prevent energy waste from system fighting.',
      category: 'operational',
      priority: 'high',
      energySavingsPercent: 5,
      costMin: 0,
      costMax: 500,
      paybackMin: 0,
      paybackMax: 3,
      difficulty: 'easy',
      metrics: ['electricity', 'gas', 'steam', 'chilledwater'],
      steps: [
        'Review current temperature setpoints throughout building',
        'Identify appropriate deadband settings for each zone type',
        'Update building automation system programming',
        'Monitor space conditions to ensure occupant comfort',
        'Adjust settings if necessary based on feedback',
        'Document new setpoints for operations staff'
      ]
    },
    {
      title: 'Repair Steam Traps and Leaks',
      description: 'Identify and fix failed steam traps and distribution system leaks',
      detail: 'Steam system survey indicates approximately 15% of steam traps are failed open, allowing steam to pass through unused. Repairing these traps and addressing distribution leaks will improve system efficiency and reduce steam generation requirements.',
      category: 'maintenance',
      priority: 'high',
      energySavingsPercent: 7,
      costMin: 5000,
      costMax: 15000,
      paybackMin: 6,
      paybackMax: 18,
      difficulty: 'moderate',
      metrics: ['steam', 'gas'],
      steps: [
        'Conduct comprehensive steam trap survey',
        'Document all failed or failing traps',
        'Prioritize repairs based on size and severity',
        'Schedule repairs with qualified contractor',
        'Verify proper trap operation after repairs',
        'Implement regular steam trap testing program',
        'Train maintenance staff on trap testing procedures'
      ]
    },
    {
      title: 'Balance Hydronic Systems',
      description: 'Properly balance hot and chilled water distribution to ensure efficient delivery',
      detail: 'Temperature measurements indicate uneven distribution of heating and cooling throughout the building. Balancing the hydronic systems will ensure proper flow to all areas, improving comfort and reducing energy waste from overheating or overcooling.',
      category: 'maintenance',
      priority: 'medium',
      energySavingsPercent: 4,
      costMin: 3000,
      costMax: 12000,
      paybackMin: 12,
      paybackMax: 30,
      difficulty: 'moderate',
      metrics: ['electricity', 'gas', 'hotwater', 'chilledwater'],
      steps: [
        'Conduct flow measurements throughout hydronic system',
        'Identify imbalances and restrictions',
        'Adjust balancing valves to achieve proper design flow rates',
        'Clean strainers and remove restrictions as needed',
        'Document final valve positions for future reference',
        'Train operations staff on maintaining system balance'
      ]
    },
    {
      title: 'Implement Condenser Water Reset',
      description: 'Adjust cooling tower setpoints based on outdoor conditions',
      detail: 'The cooling tower currently maintains a fixed condenser water temperature setpoint. Implementing condenser water reset to lower the setpoint during favorable weather conditions will improve chiller efficiency and reduce energy consumption.',
      category: 'operational',
      priority: 'medium',
      energySavingsPercent: 6,
      costMin: 1000,
      costMax: 5000,
      paybackMin: 6,
      paybackMax: 18,
      difficulty: 'moderate',
      metrics: ['electricity', 'chilledwater'],
      steps: [
        'Review chiller specifications for minimum condenser water temperature',
        'Develop reset schedule based on outdoor wet-bulb temperature',
        'Program building automation system with reset sequence',
        'Monitor chiller performance at various setpoints',
        'Optimize reset parameters based on performance data',
        'Document new control strategy for operations staff'
      ]
    }
  ];
  
  // Randomly select recommendations up to limit
  const shuffledTemplates = [...recommendationTemplates].sort(() => 0.5 - Math.random());
  const selectedTemplates = shuffledTemplates.slice(0, Math.min(limit, recommendationTemplates.length));
  
  // Generate mock data based on templates
  const recommendations: EnergySavingRecommendation[] = [];
  
  // Track the counts and savings for the summary stats
  let totalCount = limit;
  let implementedCount = 0;
  let inProgressCount = 0;
  const potentialSavings = { energy: 0, cost: 0, carbon: 0 };
  const achievedSavings = { energy: 0, cost: 0, carbon: 0 };
  
  // Building's baseline consumption (for calculating savings)
  const baselineConsumption = {
    electricity: 1200000, // kWh per year
    water: 2500000, // gallons per year
    gas: 50000, // therms per year
    other: 800000 // kWh equivalent
  };
  
  // Building's energy costs
  const energyCosts = {
    electricity: 0.12, // $ per kWh
    water: 0.01, // $ per gallon
    gas: 0.8, // $ per therm
    other: 0.1 // $ per kWh equivalent
  };
  
  // Carbon factors
  const carbonFactors = {
    electricity: 0.4, // kg CO2e per kWh
    water: 0.001, // kg CO2e per gallon
    gas: 5.3, // kg CO2e per therm
    other: 0.3 // kg CO2e per kWh equivalent
  };

  selectedTemplates.forEach((template, index) => {
    // Generate a unique ID
    const id = `rec-${buildingId}-${index}`;
    
    // Determine recommendation status
    let recStatus: EnergySavingRecommendation['status'];
    if (status) {
      recStatus = status;
    } else {
      // Random status weighted toward new recommendations
      const statusRand = Math.random();
      if (statusRand < 0.5) recStatus = 'new';
      else if (statusRand < 0.7) recStatus = 'in_progress';
      else if (statusRand < 0.9) recStatus = 'implemented';
      else recStatus = 'rejected';
      
      if (recStatus === 'implemented') implementedCount++;
      if (recStatus === 'in_progress') inProgressCount++;
    }
    
    // Generate creation date (0-12 months ago)
    const createdAt = subDays(new Date(), Math.floor(Math.random() * 365)).toISOString();
    
    // Generate update date (after creation date)
    const updatedAtDate = new Date(createdAt);
    updatedAtDate.setDate(updatedAtDate.getDate() + Math.floor(Math.random() * 30));
    const updatedAt = updatedAtDate.toISOString();
    
    // Generate implementation date if implemented
    let implementedAt: string | undefined;
    if (recStatus === 'implemented') {
      const implementedAtDate = new Date(updatedAt);
      implementedAtDate.setDate(implementedAtDate.getDate() + Math.floor(Math.random() * 60));
      implementedAt = implementedAtDate.toISOString();
    }
    
    // Calculate energy savings based on template percentage and building baseline
    const primaryMetric = template.metrics[0] === 'electricity' || template.metrics[0] === 'gas' || template.metrics[0] === 'water' ? 
                          template.metrics[0] as ('electricity' | 'gas' | 'water') : 'other';
    const baselineForMetric = primaryMetric === 'electricity' ? baselineConsumption.electricity :
                              primaryMetric === 'gas' ? baselineConsumption.gas :
                              primaryMetric === 'water' ? baselineConsumption.water :
                              baselineConsumption.other;
    
    const energyCostFactor = primaryMetric === 'electricity' ? energyCosts.electricity :
                             primaryMetric === 'gas' ? energyCosts.gas :
                             primaryMetric === 'water' ? energyCosts.water :
                             energyCosts.other;
    
    const carbonFactor = primaryMetric === 'electricity' ? carbonFactors.electricity :
                         primaryMetric === 'gas' ? carbonFactors.gas :
                         primaryMetric === 'water' ? carbonFactors.water :
                         carbonFactors.other;
    
    // Calculate savings
    const energySavings = baselineForMetric * (template.energySavingsPercent / 100);
    const costSavings = energySavings * energyCostFactor;
    const carbonSavings = energySavings * carbonFactor;
    
    // Add to total potential savings
    potentialSavings.energy += energySavings;
    potentialSavings.cost += costSavings;
    potentialSavings.carbon += carbonSavings;
    
    // Add to achieved savings if implemented
    if (recStatus === 'implemented') {
      achievedSavings.energy += energySavings;
      achievedSavings.cost += costSavings;
      achievedSavings.carbon += carbonSavings;
    }
    
    // Generate implementation cost
    const implementationCost = template.costMin + Math.random() * (template.costMax - template.costMin);
    
    // Calculate ROI and payback
    const paybackPeriod = (implementationCost / costSavings) * 12; // Convert annual savings to monthly payback
    const roi = (costSavings / implementationCost) * 100;
    
    // Generate tags
    const baseTags = [template.category, `${template.priority}-priority`, ...template.metrics];
    const additionalTags = ['energy-efficiency', 'cost-saving'];
    const tags = [...new Set([...baseTags, ...additionalTags])];
    
    // Generate related anomaly IDs (if any)
    let relatedAnomalyIds: string[] | undefined;
    if (Math.random() > 0.7) {
      const numAnomalies = 1 + Math.floor(Math.random() * 3);
      relatedAnomalyIds = Array.from({ length: numAnomalies }, (_, i) => 
        `anomaly-${buildingId}-${Math.floor(Math.random() * 10)}`
      );
    }
    
    // Create the full recommendation object
    recommendations.push({
      id,
      buildingId,
      title: template.title,
      description: template.description,
      detail: template.detail,
      category: template.category as EnergySavingRecommendation['category'],
      priority: template.priority as EnergySavingRecommendation['priority'],
      estimatedSavings: {
        energy: Math.round(energySavings),
        cost: Math.round(costSavings),
        carbon: Math.round(carbonSavings)
      },
      implementationCost: {
        amount: Math.round(implementationCost),
        unit: 'USD',
        level: implementationCost < 5000 ? 'low' : 
               implementationCost < 20000 ? 'medium' : 'high'
      },
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      difficultyLevel: template.difficulty as EnergySavingRecommendation['difficultyLevel'],
      metrics: template.metrics as EnergySavingRecommendation['metrics'],
      status: recStatus,
      implementationSteps: template.steps,
      tags,
      createdAt,
      updatedAt,
      implementedAt,
      relatedAnomalyIds
    });
  });
  
  // Return the full response object
  return {
    recommendations,
    totalCount,
    implementedCount,
    inProgressCount,
    potentialSavings: {
      energy: Math.round(potentialSavings.energy),
      cost: Math.round(potentialSavings.cost),
      carbon: Math.round(potentialSavings.carbon)
    },
    achievedSavings: {
      energy: Math.round(achievedSavings.energy),
      cost: Math.round(achievedSavings.cost),
      carbon: Math.round(achievedSavings.carbon)
    }
  };
};

// Get all recommendations for a building
export const getBuildingRecommendations = async (
  buildingId: string,
  limit: number = 10,
  offset: number = 0,
  status?: EnergySavingRecommendation['status'],
  sortBy: string = 'priority',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<RecommendationResponse> => {
  try {
    if (apiConfig.useMockData) {
      // Use mock data for development
      await createMockDelay();
      return generateMockRecommendations(buildingId, limit, status);
    }
    
    // Fetch real data from PostgreSQL backend
    const response = await apiClient.get(getApiPath('/recommendations'), {
      params: {
        building_id: buildingId,
        limit,
        offset,
        status,
        sort_by: sortBy,
        sort_order: sortOrder
      }
    });
    
    // Transform API response to match our interface
    const result: RecommendationResponse = {
      // Transform recommendations
      recommendations: response.data.recommendations.map((rec: any) => ({
        id: rec.id,
        buildingId: rec.building_id,
        title: rec.title,
        description: rec.description,
        detail: rec.detail,
        category: rec.category,
        priority: rec.priority,
        estimatedSavings: {
          energy: rec.estimated_savings.energy,
          cost: rec.estimated_savings.cost,
          carbon: rec.estimated_savings.carbon
        },
        implementationCost: {
          amount: rec.implementation_cost.amount,
          unit: rec.implementation_cost.unit,
          level: rec.implementation_cost.level
        },
        paybackPeriod: rec.payback_period,
        roi: rec.roi,
        difficultyLevel: rec.difficulty_level,
        metrics: rec.metrics,
        status: rec.status,
        implementationSteps: rec.implementation_steps,
        tags: rec.tags,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
        implementedAt: rec.implemented_at,
        relatedAnomalyIds: rec.related_anomaly_ids
      })),
      
      // Summary statistics
      totalCount: response.data.total_count,
      implementedCount: response.data.implemented_count,
      inProgressCount: response.data.in_progress_count,
      potentialSavings: {
        energy: response.data.potential_savings.energy,
        cost: response.data.potential_savings.cost,
        carbon: response.data.potential_savings.carbon
      },
      achievedSavings: {
        energy: response.data.achieved_savings.energy,
        cost: response.data.achieved_savings.cost,
        carbon: response.data.achieved_savings.carbon
      }
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching building recommendations:', error);
    // Fallback to mock data if API fails
    return generateMockRecommendations(buildingId, limit, status);
  }
};

// Get a specific recommendation by ID
export const getRecommendationById = async (
  recommendationId: string
): Promise<EnergySavingRecommendation> => {
  try {
    if (apiConfig.useMockData) {
      // Generate a detailed recommendation
      await createMockDelay();
      
      // Parse building ID and index from recommendation ID format
      const [, buildingId, index] = recommendationId.split('-');
      
      // Generate a single recommendation
      const mockData = generateMockRecommendations(buildingId, 15);
      
      // Find the recommendation with matching ID or generate one
      const recommendation = mockData.recommendations.find(r => r.id === recommendationId);
      
      if (recommendation) {
        return recommendation;
      }
      
      // If not found (shouldn't happen), return the first one
      return mockData.recommendations[0];
    }
    
    // Fetch real data from PostgreSQL backend
    const response = await apiClient.get(getApiPath(`/recommendations/${recommendationId}`));
    
    // Transform API response to match our interface
    return {
      id: response.data.id,
      buildingId: response.data.building_id,
      title: response.data.title,
      description: response.data.description,
      detail: response.data.detail,
      category: response.data.category,
      priority: response.data.priority,
      estimatedSavings: {
        energy: response.data.estimated_savings.energy,
        cost: response.data.estimated_savings.cost,
        carbon: response.data.estimated_savings.carbon
      },
      implementationCost: {
        amount: response.data.implementation_cost.amount,
        unit: response.data.implementation_cost.unit,
        level: response.data.implementation_cost.level
      },
      paybackPeriod: response.data.payback_period,
      roi: response.data.roi,
      difficultyLevel: response.data.difficulty_level,
      metrics: response.data.metrics,
      status: response.data.status,
      implementationSteps: response.data.implementation_steps,
      tags: response.data.tags,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      implementedAt: response.data.implemented_at,
      relatedAnomalyIds: response.data.related_anomaly_ids
    };
  } catch (error) {
    console.error(`Error fetching recommendation details for ${recommendationId}:`, error);
    throw new Error(`Failed to fetch recommendation details: ${error}`);
  }
};

// Update recommendation status
export const updateRecommendationStatus = async (
  recommendationId: string,
  status: EnergySavingRecommendation['status'],
  notes?: string
): Promise<EnergySavingRecommendation> => {
  try {
    if (apiConfig.useMockData) {
      // Simulate API delay
      await createMockDelay();
      
      // Parse building ID from recommendation ID
      const [, buildingId] = recommendationId.split('-');
      
      // Get current recommendation details
      const recommendation = await getRecommendationById(recommendationId);
      
      // Update status
      const updatedRecommendation = {
        ...recommendation,
        status,
        updatedAt: new Date().toISOString()
      };
      
      // If implemented, add implementation date
      if (status === 'implemented' && recommendation.status !== 'implemented') {
        updatedRecommendation.implementedAt = new Date().toISOString();
      }
      
      return updatedRecommendation;
    }
    
    // Update via PostgreSQL backend
    const response = await apiClient.patch(getApiPath(`/recommendations/${recommendationId}`), {
      status,
      notes
    });
    
    // Transform API response
    return {
      id: response.data.id,
      buildingId: response.data.building_id,
      title: response.data.title,
      description: response.data.description,
      detail: response.data.detail,
      category: response.data.category,
      priority: response.data.priority,
      estimatedSavings: {
        energy: response.data.estimated_savings.energy,
        cost: response.data.estimated_savings.cost,
        carbon: response.data.estimated_savings.carbon
      },
      implementationCost: {
        amount: response.data.implementation_cost.amount,
        unit: response.data.implementation_cost.unit,
        level: response.data.implementation_cost.level
      },
      paybackPeriod: response.data.payback_period,
      roi: response.data.roi,
      difficultyLevel: response.data.difficulty_level,
      metrics: response.data.metrics,
      status: response.data.status,
      implementationSteps: response.data.implementation_steps,
      tags: response.data.tags,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      implementedAt: response.data.implemented_at,
      relatedAnomalyIds: response.data.related_anomaly_ids
    };
  } catch (error) {
    console.error(`Error updating recommendation status for ${recommendationId}:`, error);
    throw new Error(`Failed to update recommendation status: ${error}`);
  }
};

// Default export
const recommendationApi = {
  getBuildingRecommendations,
  getRecommendationById,
  updateRecommendationStatus
};

export default recommendationApi; 