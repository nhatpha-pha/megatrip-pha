import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  MapPin,
  Calendar,
} from 'lucide-react';

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  forecast: {
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }[];
}

// Sample weather data for popular destinations
const weatherData: { [key: string]: WeatherData } = {
  'hanoi': {
    city: 'Hà Nội',
    temperature: 18,
    condition: 'Nhiều mây',
    humidity: 75,
    windSpeed: 8,
    visibility: 10,
    uvIndex: 3,
    forecast: [
      { day: 'Hôm nay', high: 22, low: 15, condition: 'Nhiều mây', icon: 'cloud' },
      { day: 'Mai', high: 25, low: 18, condition: 'Nắng', icon: 'sun' },
      { day: 'T3', high: 23, low: 16, condition: 'Mưa nhẹ', icon: 'rain' },
      { day: 'T4', high: 21, low: 14, condition: 'Nhiều mây', icon: 'cloud' },
      { day: 'T5', high: 24, low: 17, condition: 'Nắng', icon: 'sun' },
    ]
  },
  'danang': {
    city: 'Đà Nẵng',
    temperature: 28,
    condition: 'Nắng đẹp',
    humidity: 65,
    windSpeed: 12,
    visibility: 15,
    uvIndex: 8,
    forecast: [
      { day: 'Hôm nay', high: 30, low: 24, condition: 'Nắng', icon: 'sun' },
      { day: 'Mai', high: 31, low: 25, condition: 'Nắng', icon: 'sun' },
      { day: 'T3', high: 29, low: 23, condition: 'Ít mây', icon: 'cloud' },
      { day: 'T4', high: 28, low: 22, condition: 'Mưa rào', icon: 'rain' },
      { day: 'T5', high: 30, low: 24, condition: 'Nắng', icon: 'sun' },
    ]
  },
  'hochiminh': {
    city: 'TP.HCM',
    temperature: 32,
    condition: 'Nắng nóng',
    humidity: 80,
    windSpeed: 6,
    visibility: 12,
    uvIndex: 9,
    forecast: [
      { day: 'Hôm nay', high: 34, low: 26, condition: 'Nắng nóng', icon: 'sun' },
      { day: 'Mai', high: 33, low: 27, condition: 'Mưa dông', icon: 'rain' },
      { day: 'T3', high: 31, low: 25, condition: 'Mưa rào', icon: 'rain' },
      { day: 'T4', high: 32, low: 26, condition: 'Ít mây', icon: 'cloud' },
      { day: 'T5', high: 33, low: 27, condition: 'Nắng', icon: 'sun' },
    ]
  }
};

export default function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState('hanoi');
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(weatherData.hanoi);

  useEffect(() => {
    setCurrentWeather(weatherData[selectedCity]);
  }, [selectedCity]);

  const getWeatherIcon = (condition: string, size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'lg' ? 'h-12 w-12' : 'h-5 w-5';
    
    switch (condition.toLowerCase()) {
      case 'sun':
      case 'nắng':
      case 'nắng đẹp':
      case 'nắng nóng':
        return <Sun className={`${iconSize} text-yellow-500`} />;
      case 'cloud':
      case 'nhiều mây':
      case 'ít mây':
        return <Cloud className={`${iconSize} text-gray-500`} />;
      case 'rain':
      case 'mưa':
      case 'mưa nhẹ':
      case 'mưa rào':
      case 'mưa dông':
        return <CloudRain className={`${iconSize} text-blue-500`} />;
      case 'snow':
        return <CloudSnow className={`${iconSize} text-blue-300`} />;
      default:
        return <Sun className={`${iconSize} text-yellow-500`} />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'nắng':
      case 'nắng đẹp':
        return 'bg-yellow-100 text-yellow-800';
      case 'nắng nóng':
        return 'bg-orange-100 text-orange-800';
      case 'nhiều mây':
      case 'ít mây':
        return 'bg-gray-100 text-gray-800';
      case 'mưa':
      case 'mưa nhẹ':
      case 'mưa rào':
      case 'mưa dông':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTravelRecommendation = (temp: number, condition: string) => {
    if (temp >= 30) {
      return { 
        text: 'Thời tiết nóng - Mang theo nón và kem chống nắng',
        color: 'text-orange-600'
      };
    } else if (temp >= 25) {
      return { 
        text: 'Thời tiết đẹp - Rất phù hợp cho du lịch',
        color: 'text-green-600'
      };
    } else if (temp >= 20) {
      return { 
        text: 'Thời tiết mát mẻ - Nên mặc áo ấm',
        color: 'text-blue-600'
      };
    } else {
      return { 
        text: 'Thời tiết lạnh - Chuẩn bị quần áo ấm',
        color: 'text-blue-800'
      };
    }
  };

  const recommendation = getTravelRecommendation(currentWeather.temperature, currentWeather.condition);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Thời tiết điểm đến
          </CardTitle>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value="hanoi">Hà Nội</option>
            <option value="danang">Đà Nẵng</option>
            <option value="hochiminh">TP.HCM</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{currentWeather.temperature}°C</div>
            <div className="text-sm text-muted-foreground">{currentWeather.city}</div>
          </div>
          <div className="text-center">
            {getWeatherIcon(currentWeather.condition, 'lg')}
            <Badge className={`mt-2 ${getConditionColor(currentWeather.condition)}`}>
              {currentWeather.condition}
            </Badge>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span>Độ ẩm: {currentWeather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <span>Gió: {currentWeather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-green-500" />
            <span>Tầm nhìn: {currentWeather.visibility} km</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <span>UV: {currentWeather.uvIndex}/10</span>
          </div>
        </div>

        {/* Travel Recommendation */}
        <div className={`text-sm p-3 bg-gray-50 rounded-lg ${recommendation.color}`}>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5" />
            <span>{recommendation.text}</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Dự báo 5 ngày</h4>
          <div className="space-y-2">
            {currentWeather.forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1">
                  {getWeatherIcon(day.icon)}
                  <span className="min-w-0 flex-1">{day.day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{day.low}°</span>
                  <span className="font-medium">{day.high}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Alerts */}
        {currentWeather.temperature > 30 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sun className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Cảnh báo nắng nóng</div>
                <div className="text-orange-700">Nhiệt độ cao, hạn chế ra ngoài vào giữa trưa</div>
              </div>
            </div>
          </div>
        )}

        {currentWeather.uvIndex >= 7 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Thermometer className="h-4 w-4 text-purple-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-purple-800">Chỉ số UV cao</div>
                <div className="text-purple-700">Sử dụng kem chống nắng SPF 30+</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
