/**
 * Weather Service for B2B Factory Radar (Samut Prakan)
 * Uses Open-Meteo API (Free, No-Key required, ECMWF/GFS weather model)
 */

export interface WeatherData {
  currentTemp: number;
  minTemp: number;
  maxTemp: number;
  humidity: number;
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  rainProbability: number;
  precipitationMm: number;
  windSpeed: number;
  salesTip: string;
  hourlyForecast: {
    hour: string;
    temp: number;
    rainProb: number;
    weatherCode: number;
  }[];
}

// Map WMO Weather Codes to Thai Description and Icons
export function getWeatherDetails(code: number): { desc: string; icon: string; level: 'good' | 'moderate' | 'rain' | 'storm' } {
  switch (code) {
    case 0:
      return { desc: 'ท้องฟ้าแจ่มใส', icon: '☀️', level: 'good' };
    case 1:
    case 2:
      return { desc: 'มีเมฆบางส่วน', icon: '🌤️', level: 'good' };
    case 3:
      return { desc: 'มีเมฆมาก', icon: '⛅', level: 'good' };
    case 45:
    case 48:
      return { desc: 'มีหมอก / ทัศนวิสัยลดลง', icon: '🌫️', level: 'moderate' };
    case 51:
    case 53:
    case 55:
      return { desc: 'ฝนตกปรอยๆ', icon: '🌦️', level: 'moderate' };
    case 61:
    case 63:
    case 65:
      return { desc: 'ฝนตกปานกลาง', icon: '🌧️', level: 'rain' };
    case 80:
    case 81:
    case 82:
      return { desc: 'ฝนตกหนักเป็นช่วงๆ', icon: '🌧️', level: 'rain' };
    case 95:
    case 96:
    case 99:
      return { desc: 'พายุฝนฟ้าคะนอง', icon: '⛈️', level: 'storm' };
    default:
      return { desc: 'มีเมฆบางส่วน', icon: '🌤️', level: 'good' };
  }
}

// Generate Field Sales Route Recommendation based on weather
function generateSalesRecommendation(rainProb: number, weatherCode: number, currentTemp: number): string {
  if (weatherCode >= 95 || rainProb >= 70) {
    return '⚠️ โซนนี้มีโอกาสฝนตก/พายุสูง แนะนำพกร่มและวางแผนเข้าพบโรงงานในร่มก่อน';
  }
  if (rainProb >= 40 || (weatherCode >= 51 && weatherCode <= 65)) {
    return '🌦️ มีโอกาสฝนประปราย ควรเช็กเส้นทางและนัดหมายก่อนเดินทาง';
  }
  if (currentTemp >= 35) {
    return '☀️ แดดจัดและอากาศร้อน ควรจัดคิวเข้าพบโรงงานติดแอร์ช่วงบ่าย';
  }
  return '✨ สภาพอากาศดีเยี่ยม เหมาะแก่การลงพื้นที่พบลูกค้าตลอดทั้งวัน';
}

// Simple client-side cache
let cachedWeather: { data: WeatherData; timestamp: number } | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchLiveWeather(
  lat: number = 13.6062,
  lng: number = 100.6974
): Promise<WeatherData | null> {
  const now = Date.now();
  if (cachedWeather && now - cachedWeather.timestamp < CACHE_DURATION_MS) {
    return cachedWeather.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=1`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const code = current.weather_code ?? daily.weather_code?.[0] ?? 1;
    const { desc, icon } = getWeatherDetails(code);

    const rainProb = daily.precipitation_probability_max?.[0] ?? current.precipitation ?? 0;
    const currentTemp = Math.round(current.temperature_2m ?? 30);

    // Format next 5 hours forecast
    const currentHourIndex = new Date().getHours();
    const hourlyForecast = (hourly.time || [])
      .slice(currentHourIndex, currentHourIndex + 5)
      .map((t: string, idx: number) => {
        const absoluteIndex = currentHourIndex + idx;
        const timeStr = t.split('T')[1] || '';
        return {
          hour: timeStr,
          temp: Math.round(hourly.temperature_2m?.[absoluteIndex] ?? currentTemp),
          rainProb: hourly.precipitation_probability?.[absoluteIndex] ?? 0,
          weatherCode: hourly.weather_code?.[absoluteIndex] ?? code,
        };
      });

    const result: WeatherData = {
      currentTemp,
      minTemp: Math.round(daily.temperature_2m_min?.[0] ?? currentTemp - 4),
      maxTemp: Math.round(daily.temperature_2m_max?.[0] ?? currentTemp + 4),
      humidity: Math.round(current.relative_humidity_2m ?? 75),
      weatherCode: code,
      weatherDesc: desc,
      weatherIcon: icon,
      rainProbability: rainProb,
      precipitationMm: current.precipitation ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 5),
      salesTip: generateSalesRecommendation(rainProb, code, currentTemp),
      hourlyForecast,
    };

    cachedWeather = { data: result, timestamp: now };
    return result;
  } catch (err) {
    console.warn('Unable to fetch live weather forecast:', err);
    return null;
  }
}
