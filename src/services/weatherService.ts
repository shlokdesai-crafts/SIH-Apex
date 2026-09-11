export interface DailyForecast {
  time: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  conditionText: string;
  daily: DailyForecast[];
}

export function getWeatherConditionText(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  
  const data = await response.json();
  const current = data.current;
  const dailyData = data.daily;

  const daily: DailyForecast[] = dailyData.time.map((time: string, index: number) => ({
    time,
    tempMax: Math.round(dailyData.temperature_2m_max[index]),
    tempMin: Math.round(dailyData.temperature_2m_min[index]),
    precipitation: dailyData.precipitation_sum[index],
    weatherCode: dailyData.weather_code[index],
    conditionText: getWeatherConditionText(dailyData.weather_code[index])
  }));
  
  return {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    precipitation: current.precipitation,
    windSpeed: Math.round(current.wind_speed_10m),
    weatherCode: current.weather_code,
    conditionText: getWeatherConditionText(current.weather_code),
    daily
  };
}
