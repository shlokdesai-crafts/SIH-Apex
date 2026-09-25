export type SoilType =
  | 'Select Soil Type'
  | 'Black Soil'
  | 'Red Soil'
  | 'Alluvial Soil'
  | 'Laterite Soil'
  | 'Loamy Soil'
  | 'Sandy Soil'
  | 'Sandy Loam'
  | 'Clay Soil'
  | 'Clay Loam'
  | 'Silty Soil'
  | 'Silty Loam'
  | 'Gravelly Soil'
  | 'Saline Soil'
  | 'Other / Unknown';

export interface ActionRecommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  reason: string;
  recommendedDate: string; // e.g., "Tomorrow · 25 Sep"
  benefit: string;
  icon: string;
  details: {
    crop: string;
    soil: string;
    risk: string;
    weatherCondition: string;
    detailedReason: string;
  };
}

export interface RecommendationParams {
  crop: string;
  soilType: SoilType;
  growthStage: string;
  weatherData: any; // WeatherData from weatherService
  overallRisk: 'High' | 'Moderate' | 'Low';
  detectedDisease?: string;
}

export function generateCropActions(params: RecommendationParams): ActionRecommendation[] {
  const { crop, soilType, growthStage, weatherData, overallRisk, detectedDisease } = params;
  
  const actions: ActionRecommendation[] = [];

  if (soilType === 'Select Soil Type') {
    return actions;
  }

  // Weather analysis
  const hasHighRainfall = weatherData?.daily?.some((d: any) => d.precipitation > 15);
  const hasHighHumidity = weatherData?.daily?.some((d: any) => d.humidity > 80) || weatherData?.humidity > 80;
  const hasHighTemp = weatherData?.daily?.some((d: any) => d.tempMax > 35) || weatherData?.temperature > 35;
  const hasStrongWind = weatherData?.windSpeed > 20;

  // Simple date formatter
  const getFormatDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dayStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (offsetDays === 0) return `Today · ${dayStr}`;
    if (offsetDays === 1) return `Tomorrow · ${dayStr}`;
    return `+${offsetDays} Days · ${dayStr}`;
  };

  // Rule 1: High disease risk or detected disease
  if (overallRisk === 'High' || detectedDisease) {
    actions.push({
      id: 'high-risk-inspection',
      priority: 'High',
      title: 'Increase field inspection frequency',
      reason: detectedDisease ? `Active ${detectedDisease} requires immediate attention.` : 'High disease risk predicted in the coming days.',
      recommendedDate: getFormatDate(0),
      benefit: 'Prevents spread of disease to healthy plants.',
      icon: '🔍',
      details: {
        crop,
        soil: soilType,
        risk: overallRisk,
        weatherCondition: 'Current conditions',
        detailedReason: `Risk level is High. ${detectedDisease ? 'Disease is active.' : 'Conditions are highly favorable for disease outbreak.'}`
      }
    });
  }

  // Rule 2: High Humidity + Rainfall + Moisture retaining soil
  const moistureRetainingSoils = ['Clay Soil', 'Clay Loam', 'Black Soil', 'Alluvial Soil'];
  if (hasHighHumidity && hasHighRainfall && moistureRetainingSoils.includes(soilType)) {
    actions.push({
      id: 'fungal-risk-drainage',
      priority: 'High',
      title: `Inspect ${crop.toLowerCase()} canopy and drainage`,
      reason: 'High humidity and rainfall combined with moisture-retaining soil increases fungal risk.',
      recommendedDate: getFormatDate(1),
      benefit: 'Reduces waterlogging and root rot.',
      icon: '🌧️',
      details: {
        crop,
        soil: soilType,
        risk: overallRisk,
        weatherCondition: 'High humidity + rainfall expected',
        detailedReason: `The combination of high humidity, rainfall and ${soilType.toLowerCase()}'s moisture retention increases conditions favorable to fungal disease.`
      }
    });
  }

  // Rule 3: High Temp + Low Rainfall + Well draining soil
  const drainingSoils = ['Sandy Soil', 'Sandy Loam', 'Red Soil', 'Laterite Soil'];
  if (hasHighTemp && !hasHighRainfall && drainingSoils.includes(soilType)) {
    actions.push({
      id: 'heat-stress-water',
      priority: 'Medium',
      title: 'Check soil moisture',
      reason: 'Low rainfall and higher temperature may increase moisture stress.',
      recommendedDate: getFormatDate(1),
      benefit: 'Prevents wilting and yield loss.',
      icon: '💧',
      details: {
        crop,
        soil: soilType,
        risk: overallRisk,
        weatherCondition: 'Low rainfall + high temperature',
        detailedReason: `${soilType} drains quickly. High temperatures without rain will lead to rapid moisture depletion.`
      }
    });
  }

  // Rule 4: Strong Wind
  if (hasStrongWind) {
    actions.push({
      id: 'wind-damage',
      priority: 'Medium',
      title: 'Check crop support',
      reason: 'Strong winds can cause physical damage or lodging.',
      recommendedDate: getFormatDate(0),
      benefit: 'Prevents plant breakage.',
      icon: '💨',
      details: {
        crop,
        soil: soilType,
        risk: overallRisk,
        weatherCondition: 'Strong wind predicted',
        detailedReason: 'High wind speeds can damage tall or top-heavy crops.'
      }
    });
  }

  // Fallback / Routine
  if (actions.length === 0) {
    actions.push({
      id: 'routine-monitoring',
      priority: 'Low',
      title: 'Continue routine monitoring',
      reason: 'Risk levels are currently low and weather is favorable.',
      recommendedDate: getFormatDate(3),
      benefit: 'Maintains baseline crop health records.',
      icon: '🌱',
      details: {
        crop,
        soil: soilType,
        risk: overallRisk,
        weatherCondition: 'Favorable',
        detailedReason: 'No extreme weather or disease risks are currently predicted for your soil and crop.'
      }
    });
  }

  // Deduplicate and return
  return actions.slice(0, 3);
}

export function generateCropConditionSummary(params: RecommendationParams): string {
  const { crop, soilType, weatherData, overallRisk, detectedDisease } = params;

  if (soilType === 'Select Soil Type') {
    return 'Please select a soil type to see the 7-day crop condition forecast.';
  }

  const hasHighRainfall = weatherData?.daily?.some((d: any) => d.precipitation > 15);
  const hasHighHumidity = weatherData?.daily?.some((d: any) => d.humidity > 80) || weatherData?.humidity > 80;
  const hasHighTemp = weatherData?.daily?.some((d: any) => d.tempMax > 35) || weatherData?.temperature > 35;
  const moistureRetainingSoils = ['Clay Soil', 'Clay Loam', 'Black Soil', 'Alluvial Soil'];
  const drainingSoils = ['Sandy Soil', 'Sandy Loam', 'Red Soil', 'Laterite Soil'];

  let summary = `Over the next 7 days, ${crop} is expected to experience `;

  if (overallRisk === 'High' || detectedDisease) {
    summary += `high stress levels due to ${detectedDisease ? `active ${detectedDisease}` : 'severe risk conditions'}. `;
  } else if (hasHighTemp && !hasHighRainfall && drainingSoils.includes(soilType)) {
    summary += `moisture stress. ${soilType} drains quickly, and high temperatures will deplete available water rapidly. `;
  } else if (hasHighHumidity && hasHighRainfall && moistureRetainingSoils.includes(soilType)) {
    summary += `elevated fungal disease risk. The combination of high humidity, rainfall, and ${soilType.toLowerCase()}'s moisture retention creates a highly favorable environment for pathogens. `;
  } else if (overallRisk === 'Moderate') {
    summary += `moderate conditions. While major outbreaks are unlikely, regular monitoring is advised. `;
  } else {
    summary += `favorable growing conditions. Weather and soil parameters remain optimal for healthy development. `;
  }

  summary += `Ensure proactive management to mitigate potential yield losses.`;
  return summary;
}
