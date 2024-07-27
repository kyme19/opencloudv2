import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, Sun, Gauge, Moon } from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    windSpeed: number;
    humidity: number;
    uvIndex: number;
    pressure: number;
    condition: string;
  };
  forecast: {
    daily: Array<{
      date: string;
      temperatureMax: number;
      temperatureMin: number;
      condition: string;
    }>;
    hourly: Array<{
      time: string;
      temperature: number;
      condition: string;
    }>;
  };
  location: {
    name: string;
    country: string;
  };
  astronomy: {
    sunrise: string;
    sunset: string;
    dawn: string;
    dusk: string;
  };
}

const WeatherApp: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async (lat: number, lon: number) => {
      try {
        const currentWeatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
        if (!currentWeatherResponse.ok) {
          throw new Error('Failed to fetch current weather data');
        }
        const currentWeatherData = await currentWeatherResponse.json();

        const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`);
        if (!forecastResponse.ok) {
          throw new Error('Failed to fetch forecast data');
        }
        const forecastData = await forecastResponse.json();

        const locationResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (!locationResponse.ok) {
          throw new Error('Failed to fetch location data');
        }
        const locationData = await locationResponse.json();

        const mappedWeatherData: WeatherData = {
          current: {
            temperature: currentWeatherData.current_weather.temperature,
            windSpeed: currentWeatherData.current_weather.windspeed,
            humidity: 0, // Open-Meteo does not provide humidity data
            uvIndex: 0, // Open-Meteo does not provide UV index data
            pressure: 0, // Open-Meteo does not provide pressure data
            condition: 'Clear', // Open-Meteo does not provide condition descriptions
          },
          forecast: {
            daily: forecastData.daily.time.map((time: string, index: number) => ({
              date: time,
              temperatureMax: forecastData.daily.temperature_2m_max[index],
              temperatureMin: forecastData.daily.temperature_2m_min[index],
              condition: 'Clear', // Open-Meteo does not provide condition descriptions
            })),
            hourly: forecastData.hourly.time.map((time: string, index: number) => ({
              time: time,
              temperature: forecastData.hourly.temperature_2m[index],
              condition: 'Clear', // Open-Meteo does not provide condition descriptions
            })),
          },
          location: {
            name: locationData.city || 'Unknown',
            country: locationData.countryName || 'Unknown',
          },
          astronomy: {
            sunrise: forecastData.daily.sunrise[0],
            sunset: forecastData.daily.sunset[0],
            dawn: '', // Open-Meteo does not provide dawn data
            dusk: '', // Open-Meteo does not provide dusk data
          },
        };

        setWeatherData(mappedWeatherData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to fetch weather data');
        setLoading(false);
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherData(latitude, longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
            setError('Failed to get location');
            setLoading(false);
          }
        );
      } else {
        setError('Geolocation is not supported by this browser');
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  if (loading) return <div className="text-center p-8 text-xl">Loading...</div>;
  if (error) return <div className="text-center p-8 text-xl text-red-500">Error: {error}</div>;
  if (!weatherData) return null;

  const isDayTime = (sunrise: string, sunset: string) => {
    const now = new Date();
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    return now >= sunriseTime && now <= sunsetTime;
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-gray-100">
      <div className="mb-8 p-6 bg-gray-200 rounded-2xl shadow-[inset_-12px_-12px_20px_#ffffff,inset_12px_12px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-6xl font-bold text-gray-800">{weatherData.current.temperature}°</h1>
            <p className="text-xl text-gray-600 mt-2">{weatherData.current.condition}</p>
            <p className="text-lg text-gray-500 mt-1">{weatherData.location.name}, {weatherData.location.country}</p>
          </div>
          <div className="text-right">
            <p className="text-lg">High <span className="font-semibold">{weatherData.forecast.daily[0].temperatureMax}°</span></p>
            <p className="text-lg mt-1">Low <span className="font-semibold">{weatherData.forecast.daily[0].temperatureMin}°</span></p>
          </div>
        </div>
      </div>

      <div className="mb-8 p-6 bg-gray-200 rounded-2xl shadow-[inset_-12px_-12px_20px_#ffffff,inset_12px_12px_20px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Hourly Forecast</h2>
        <div className="flex overflow-x-auto">
          {weatherData.forecast.hourly.map((hour, index) => (
            <div key={index} className="text-center flex-shrink-0 w-20 mx-2">
              <Cloud className="mx-auto text-gray-600" size={24} />
              <p className="text-sm mt-1 font-medium">{new Date(hour.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-sm mt-1">{hour.temperature}°</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 p-6 bg-gray-200 rounded-2xl shadow-[inset_-12px_-12px_20px_#ffffff,inset_12px_12px_20px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">7 Day Forecast</h2>
        {weatherData.forecast.daily.slice(0, 7).map((day, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-300 last:border-b-0">
            <p className="text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <Cloud className="text-gray-500" size={20} />
            <p className="text-gray-800">{day.temperatureMax}° / <span className="text-gray-600">{day.temperatureMin}°</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {[
          { title: 'Wind', icon: Wind, value: `${weatherData.current.windSpeed} m/s` },
          { title: 'Humidity', icon: Droplets, value: `${weatherData.current.humidity}%` },
          { title: 'UV Index', icon: Sun, value: weatherData.current.uvIndex },
          { title: 'Pressure', icon: Gauge, value: `${weatherData.current.pressure} hPa` },
        ].map((item, index) => (
          <div key={index} className="p-4 bg-gray-200 rounded-xl shadow-[inset_-8px_-8px_12px_#ffffff,inset_8px_8px_12px_rgba(0,0,0,0.1)]">
            <h3 className="font-semibold mb-2 text-gray-700">{item.title}</h3>
            <item.icon className="mb-2 text-gray-600" size={28} />
            <p className="text-lg font-medium text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-200 rounded-2xl shadow-[inset_-12px_-12px_20px_#ffffff,inset_12px_12px_20px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Sun Schedule</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Sunrise</p>
            <p className="text-lg font-medium text-gray-800">{new Date(weatherData.astronomy.sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg">
            {isDayTime(weatherData.astronomy.sunrise, weatherData.astronomy.sunset) ? (
              <Sun className="text-gray-600" size={48} />
            ) : (
              <Moon className="text-gray-600" size={48} />
            )}
          </div>
          <div>
            <p className="text-gray-600">Sunset</p>
            <p className="text-lg font-medium text-gray-800">{new Date(weatherData.astronomy.sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <p className="text-sm text-gray-600">Dawn {new Date(weatherData.astronomy.dawn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-sm text-gray-600">Dusk {new Date(weatherData.astronomy.dusk).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
