import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './KeralaMap.css';
import { keralaDistricts } from './keralaDistricts';
import rainImg from './assets/rain_cloud.gif';
import thunderImg from './assets/thunderstorm.gif';
import cloudy from './assets/cloudy.gif';
import heavyRain from './assets/heavy_rain.gif';
import sunny from './assets/sunny.gif';
import drizzle from './assets/drizzle.gif';
import logo from './assets/logo.png';

type ForecastEntry = {
  date: string;
  label: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
  icon: string;
};

type WeatherData = {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  icon: string;
  forecast: ForecastEntry[];
};

const districtWeather: { name: string; icon: string; lat: number; lon: number }[] = [
  { name: 'Alappuzha', icon: rainImg, lat: 9.4981, lon: 76.3388 },
  { name: 'Ernakulam', icon: thunderImg, lat: 9.9816, lon: 76.2999 },
  { name: 'Idukki', icon: cloudy, lat: 9.9189, lon: 77.1025 },
  { name: 'Kannur', icon: heavyRain, lat: 11.8745, lon: 75.3704 },
  { name: 'Kasaragod', icon: sunny, lat: 12.4996, lon: 74.9869 },
  { name: 'Kollam', icon: drizzle, lat: 8.8932, lon: 76.6141 },
  { name: 'Kottayam', icon: rainImg, lat: 9.5916, lon: 76.5222 },
  { name: 'Kozhikode', icon: thunderImg, lat: 11.2588, lon: 75.7804 },
  { name: 'Malappuram', icon: cloudy, lat: 11.0510, lon: 76.0711 },
  { name: 'Palakkad', icon: sunny, lat: 10.7867, lon: 76.6548 },
  { name: 'Pathanamthitta', icon: heavyRain, lat: 9.2648, lon: 76.7870 },
  { name: 'Thiruvananthapuram', icon: drizzle, lat: 8.5241, lon: 76.9366 },
  { name: 'Thrissur', icon: rainImg, lat: 10.5276, lon: 76.2144 },
  { name: 'Wayanad', icon: cloudy, lat: 11.6854, lon: 76.1320 },
];

type GeoJSONLayer = L.Layer & {
  getBounds?: () => L.LatLngBounds;
  feature?: { properties?: { name?: string } };
};

const weatherDataByDistrict: Record<string, WeatherData> = {};

function getWeatherIconForCode(code: number) {
  if (code === 0) return sunny;
  if (code <= 3) return cloudy;
  if (code <= 55) return drizzle;
  if (code <= 65) return rainImg;
  if (code <= 82) return heavyRain;
  return thunderImg;
}

function getWeatherCondition(code: number) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 82) return 'Heavy rain';
  return 'Thunderstorm';
}

function findFillColor(code: number) {
  if (code === 0) return 'rgba(233, 188, 112, 0.35)';
  if (code <= 3) return 'rgba(107, 121, 137, 0.35)';
  if (code <= 55) return 'rgba(76, 109, 95, 0.4)';
  if (code <= 65) return 'rgba(54, 114, 166, 0.45)';
  if (code <= 82) return 'rgba(23, 80, 112, 0.5)';
  return 'rgba(89, 96, 123, 0.45)';
}

function getDistrictMarkerIcon(districtName: string) {
  const weather = weatherDataByDistrict[districtName];
  return L.icon({
    iconUrl: weather?.icon || sunny,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getDistrictFillColor(districtName: string) {
  const weather = weatherDataByDistrict[districtName];
  return weather ? findFillColor(weather.weatherCode) : 'rgba(31, 122, 79, 0.22)';
}

// outline of kerala
function style(feature: GeoJSON.Feature): L.PathOptions {
  const districtName = feature.properties?.name as string;
  return {
    fillColor: getDistrictFillColor(districtName),
    weight: 1,
    opacity: 0.95,
    color: '#f3ead2',
    dashArray: '',
    fillOpacity: 0.32,
    className: 'unselected-district',
  };
}

function highlightFeature(e: L.LeafletMouseEvent) {
  const layer = e.target as L.Path;
  layer.setStyle({
    weight: 4,
    color: '#f8f0d9',
    dashArray: '0',
    fillColor: 'rgba(250, 243, 224, 0.96)',
    fillOpacity: 0.92,
    opacity: 1,
  });
  layer.bringToFront();
}


export default function KeralaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const selectedDistrictRef = useRef<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const selectedWeather = selectedDistrict ? weatherDataByDistrict[selectedDistrict] : undefined;

  const selectDistrict = useCallback((districtName: string) => {
    setSelectedDistrict(districtName);
    selectedDistrictRef.current = districtName;

    const district = districtWeather.find((d) => d.name === districtName);
    if (district && mapRef.current) {
      mapRef.current.flyTo([district.lat, district.lon], 9, { duration: 0.7 });
    }

    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        const pathLayer = layer as L.Path;
        const geoLayer = layer as GeoJSONLayer;
        const name = geoLayer.feature?.properties?.name as string | undefined;
        if (!name) return;

        const isSelected = name === districtName;
        pathLayer.setStyle({
          fillColor: isSelected ? 'rgba(250, 243, 224, 0.96)' : getDistrictFillColor(name),
          fillOpacity: isSelected ? 0.92 : 0.18,
          color: isSelected ? '#f8f0d9' : '#f3ead2',
          weight: isSelected ? 4 : 1.2,
          opacity: isSelected ? 1 : 0.65,
          className: isSelected ? 'selected-district' : 'unselected-district',
        });

        if (isSelected) {
          pathLayer.bringToFront();
        }
      });
    }
  }, []);

  const handleDistrictChange = (event: ChangeEvent<HTMLSelectElement>) => {
    selectDistrict(event.target.value);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function initMap() {
      const weatherResults = await Promise.all(
        districtWeather.map(async (d) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata`;
            const res = await fetch(url);
            const json = await res.json();
            const current = json.current_weather ?? { temperature: 0, windspeed: 0, weathercode: 0 };
            const daily = json.daily ?? {};
            const dates: string[] = daily.time ?? [];
            const weatherCodes: number[] = daily.weathercode ?? [];
            const maxTemps: number[] = daily.temperature_2m_max ?? [];
            const minTemps: number[] = daily.temperature_2m_min ?? [];
            const precipitation: number[] = daily.precipitation_sum ?? [];
            const forecast = dates.slice(0, 3).map((date, index) => ({
              date,
              label: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(new Date(date)),
              maxTemp: maxTemps[index] ?? 0,
              minTemp: minTemps[index] ?? 0,
              precipitation: precipitation[index] ?? 0,
              weatherCode: weatherCodes[index] ?? 0,
              icon: getWeatherIconForCode(weatherCodes[index] ?? 0),
            }));

            return {
              name: d.name,
              temperature: current.temperature,
              windSpeed: current.windspeed,
              weatherCode: current.weathercode,
              condition: getWeatherCondition(current.weathercode),
              icon: getWeatherIconForCode(current.weathercode),
              forecast,
            };
          } catch (error) {
            console.error(`Failed to fetch weather for ${d.name}:`, error);
            setFetchError('Some weather data failed to load. The app will continue with fallback values.');
            return {
              name: d.name,
              temperature: 0,
              windSpeed: 0,
              weatherCode: 0,
              condition: 'Unknown',
              icon: d.icon,
              forecast: [],
            };
          }
        })
      );

      weatherResults.forEach((result) => {
        weatherDataByDistrict[result.name] = result;
      });
      setLoading(false);

      const map = L.map(containerRef.current!, { zoomControl: false }).setView([10.5, 76.5], 7);
      mapRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: 'remaining-tiles',
      }).addTo(map);

      const geojson = L.geoJson(keralaDistricts, {
        style: style as L.StyleFunction,
        onEachFeature(feature, layer) {
          const pathLayer = layer as L.Path;
          pathLayer.on({
            mouseover: (event) => {
              highlightFeature(event);
              pathLayer.openPopup();
            },
            mouseout: () => {
              const geoLayer = pathLayer as GeoJSONLayer;
              const name = geoLayer.feature?.properties?.name as string | undefined;
              if (name && name === selectedDistrictRef.current) {
                pathLayer.setStyle({
                  fillColor: getDistrictFillColor(name),
                  fillOpacity: 0.85,
                  color: '#F4A261',
                  weight: 4,
                });
              } else {
                geojson.resetStyle(pathLayer);
              }
              pathLayer.closePopup();
            },
            click: () => {
              if (feature.properties) {
                selectDistrict(feature.properties.name as string);
              }
            },
          });
          if (feature.properties) {
            const districtName = feature.properties.name as string;
            layer.bindPopup(
              `<div class="glass-popup"><div class="glass-title">${districtName}</div></div>`,
              {
                closeButton: false,
                autoClose: false,
                closeOnClick: false,
                closeOnEscapeKey: false,
                className: 'kerala-popup',
              }
            );
          }
        },
      }).addTo(map);
      geoJsonRef.current = geojson;

      const bounds = geojson.getBounds();
      geojson.eachLayer((layer) => {
        const geoLayer = layer as GeoJSONLayer;
        if (geoLayer.getBounds && geoLayer.feature?.properties?.name) {
          L.marker(geoLayer.getBounds().getCenter(), {
            icon: getDistrictMarkerIcon(geoLayer.feature.properties.name),
            interactive: false,
          }).addTo(map);
        }
      });

      map.fitBounds(bounds);
      map.setMaxBounds(bounds.pad(0.1));
      map.setMinZoom(map.getBoundsZoom(bounds));
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [selectDistrict]);

  const handleLocationClick = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 12);
          L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'user-location-marker',
              html: '<div class="user-location-dot"></div>',
              iconSize: [16, 16],
            }),
          }).addTo(mapRef.current);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location permission denied. Please allow location access in your browser.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert('Location information is unavailable.');
        } else if (error.code === error.TIMEOUT) {
          alert('Location request timed out. Try again.');
        } else {
          alert('An unknown error occurred while fetching your location.');
        }
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logo} alt="Kalavasta Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <div>
              <div className="brand-title">Kalavasta</div>
              <div className="brand-subtitle">Kerala weather dashboard</div>
            </div>
          </div>
        </div>

        <div className="search-group">
          <label className="district-label" htmlFor="district-select">Select district</label>
          <select id="district-select" value={selectedDistrict} onChange={handleDistrictChange}>
            <option value="">Choose a district</option>
            {districtWeather.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

      </header>

      <main className="map-panel">
        <div ref={containerRef} className="map-container" />
        <button className="floating-locate-button" type="button" onClick={handleLocationClick} aria-label="Locate user">
          <span className="button-icon" aria-hidden="true">✈️</span>
          Locate
        </button>

        {selectedDistrict && (
          <aside className="weather-card">
            <div className="weather-card-title">Selected district weather</div>
            <div className="weather-card-content">
              <div className="weather-card-icon">
                <img src={selectedWeather?.icon || sunny} alt={selectedWeather?.condition || 'Weather'} />
              </div>
              <div>
                <div className="weather-card-location">{selectedDistrict}</div>
                <div className="weather-card-condition">
                  {selectedWeather?.condition ?? 'Loading weather...'}
                </div>
                <div className="weather-card-metrics">
                  {selectedWeather ? `${selectedWeather.temperature}°C · ${selectedWeather.windSpeed} km/h` : 'Loading...'}
                </div>
              </div>
            </div>
            {selectedWeather?.forecast && (
              <div className="forecast-panel">
                <div className="forecast-header">3-day forecast</div>
                <div className="forecast-list">
                  {selectedWeather.forecast.map((day) => (
                    <div key={day.date} className="forecast-row">
                      <div className="forecast-day">{day.label}</div>
                      <div className="forecast-icon">
                        <img src={day.icon} alt={getWeatherCondition(day.weatherCode)} />
                      </div>
                      <div className="forecast-values">
                        <span>{day.maxTemp}° / {day.minTemp}°</span>
                        <span>{day.precipitation.toFixed(1)} mm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="weather-card-footer">
              {fetchError || (loading ? 'Fetching live weather for Kerala districts...' : '')}
            </div>
          </aside>
        )}

        {selectedDistrict && (
          <aside className="legend-panel">
            <p>Weather legend</p>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#E9BC70' }} />
                <span className="label">Odukathey Vail</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#6B7989' }} />
                <span className="label">Moodal</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#4C6D5F' }} />
                <span className="label">ChattaMazha</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#3672A6' }} />
                <span className="label">Mazha</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#175070' }} />
                <span className="label">Kori Choriyunna Mazha</span>
              </div>
              <div className="legend-item">
                <span className="legend-badge" style={{ background: '#4C1F2F' }} />
                <span className="label">Edivetti Mazha</span>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
