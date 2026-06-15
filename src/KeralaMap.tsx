import { useEffect, useRef } from 'react';
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

const PALETTE = {
  navy: '#03110d',
  green: '#163d2c',
  green2: '#1f7a4f',
  accent: '#a8ffb8',
  ice: '#d4f3da',
  moss: '#1f6a48',
};

type WeatherData = {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  icon: string;
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
    weight: 1.5,
    opacity: 1,
    color: '#d4f3da',
    dashArray: '',
    fillOpacity: 0.65,
    className: 'state-border',
  };
}

function highlightFeature(e: L.LeafletMouseEvent) {
  const layer = e.target as L.Path;
  layer.setStyle({
    weight: 2,
    color: '#F4A261',
    dashArray: '0',
    fillOpacity: 0,
    opacity: 0.95,
  });
  layer.bringToFront();
}


export default function KeralaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function initMap() {
      const weatherResults = await Promise.all(
        districtWeather.map(async (d) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&current_weather=true&timezone=Asia/Kolkata`;
            const res = await fetch(url);
            const json = await res.json();
            const current = json.current_weather ?? { temperature: 0, windspeed: 0, weathercode: 0 };

            return {
              name: d.name,
              temperature: current.temperature,
              windSpeed: current.windspeed,
              weatherCode: current.weathercode,
              condition: getWeatherCondition(current.weathercode),
              icon: getWeatherIconForCode(current.weathercode),
            };
          } catch (error) {
            console.error(`Failed to fetch weather for ${d.name}:`, error);
            return {
              name: d.name,
              temperature: 0,
              windSpeed: 0,
              weatherCode: 0,
              condition: 'Unknown',
              icon: d.icon,
            };
          }
        })
      );

      weatherResults.forEach((result) => {
        weatherDataByDistrict[result.name] = result;
      });

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
              geojson.resetStyle(pathLayer);
              pathLayer.closePopup();
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
  }, []);

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
        let message = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please allow location access in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Try again.';
            break;
          default:
            message = 'An unknown error occurred while fetching your location.';
        }
        alert(message);
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: PALETTE.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Kalavasta Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
          <span style={{ fontSize: '18px', fontWeight: 700, color: PALETTE.ice }}>Kalavasta</span>
        </div>
        <button
          type="button"
          onClick={handleLocationClick}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: '#8EE6A2',
            color: '#06140D',
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)',
          }}
        >
          Locate Me
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
